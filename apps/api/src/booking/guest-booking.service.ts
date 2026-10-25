import { randomBytes } from "crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ActorType,
  BookingMode,
  BookingStatus,
  CancellationPolicy,
  Prisma,
} from "@revoar/database";
import {
  CreateGuestBookingInput,
  GuestSearchQuery,
  normalizeCpf,
  normalizeEmail,
  PartnerBookingDecisionInput,
  PayBookingInput,
} from "@revoar/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  checkInInstant,
  formatBrl,
  hashCpf,
  hashSecret,
  isoDate,
  mealLabel,
  newAccessToken,
  newBookingCode,
  policyLabel,
  refundPercent,
  stayNights,
  utcDate,
} from "./stay";

type Db = PrismaService | Prisma.TransactionClient;

const ACTIVE_LOCK = { expiresAt: { gt: new Date() } };

@Injectable()
export class GuestBookingService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: GuestSearchQuery) {
    await this.expireDue(this.prisma);
    const nights = stayNights(query.checkIn, query.checkOut);
    const hotels = await this.loadHotels(query.city, nights);
    const committed = await this.committedByRoom(
      hotels.flatMap((hotel) => hotel.roomTypes.map((room) => room.id)),
      nights[0],
      nights[nights.length - 1],
    );
    const results = hotels
      .map((hotel) => this.quoteHotel(hotel, nights, query, committed))
      .filter((hotel) => hotel.offers.length > 0)
      .map((hotel) => {
        const cheapest = hotel.offers.reduce((best, offer) => (offer.totalCents < best.totalCents ? offer : best));
        return {
          id: hotel.id,
          slug: hotel.slug,
          name: hotel.name,
          city: hotel.city,
          state: hotel.state,
          addressLine: hotel.addressLine,
          starRating: hotel.starRating ? Number(hotel.starRating) : null,
          imageUrl: hotel.imageUrl,
          nights: nights.length,
          totalCents: cheapest.totalCents,
          bookingMode: cheapest.bookingMode,
        };
      })
      .sort((a, b) => a.totalCents - b.totalCents);

    return {
      search: query,
      nights: nights.length,
      hotels: results,
    };
  }

  async hotelDetail(slug: string, query: GuestSearchQuery) {
    await this.expireDue(this.prisma);
    const nights = stayNights(query.checkIn, query.checkOut);
    const hotels = await this.loadHotels(query.city, nights, slug);
    const hotel = hotels[0];
    if (!hotel) throw new NotFoundException("Hotel não encontrado");
    const committed = await this.committedByRoom(
      hotel.roomTypes.map((room) => room.id),
      nights[0],
      nights[nights.length - 1],
    );
    const quoted = this.quoteHotel(hotel, nights, query, committed, { allowFewerRooms: true });
    return {
      search: { ...query, nights: nights.length },
      hotel: {
        id: hotel.id,
        slug: hotel.slug,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        state: hotel.state,
        addressLine: hotel.addressLine,
        starRating: hotel.starRating ? Number(hotel.starRating) : null,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        houseRules: hotel.houseRules,
        amenities: hotel.amenities,
        images: quoted.images,
        latitude: hotel.latitude ? Number(hotel.latitude) : null,
        longitude: hotel.longitude ? Number(hotel.longitude) : null,
      },
      rooms: quoted.rooms.filter((room) => room.rates.length > 0),
    };
  }

  async create(input: CreateGuestBookingInput) {
    const email = normalizeEmail(input.email);
    const existing = await this.prisma.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.guestEmail !== email) throw new ConflictException("Esta chave já foi usada em outra reserva");
      return this.present(existing.id, email);
    }

    const nights = stayNights(input.checkIn, input.checkOut);
    const created = await this.prisma.$transaction(async (tx) => {
      await this.expireDue(tx);
      const plan = await tx.ratePlan.findFirst({
        where: { id: input.ratePlanId, active: true },
        include: { roomType: true, hotel: true, dailyRates: { where: { date: { in: nights } } } },
      });
      if (!plan || plan.hotel.status !== "ACTIVE" || plan.hotel.supplierType !== "DIRECT") {
        throw new NotFoundException("Essa tarifa não está disponível");
      }
      const guests = input.adults + input.children;
      if (input.adults > plan.roomType.maxAdults || guests > plan.roomType.maxOccupancy) {
        throw new BadRequestException("Esse quarto não cabe o número de hóspedes");
      }
      if (nights.length < plan.minNights) {
        throw new BadRequestException(`Essa tarifa pede no mínimo ${plan.minNights} noites`);
      }
      if (input.childAges.length !== input.children) {
        throw new BadRequestException("Informe a idade de cada criança");
      }

      const mode: BookingMode =
        plan.roomType.bookingMode === "INHERIT" ? plan.hotel.bookingMode : plan.roomType.bookingMode;
      const prices = nights.map((night) => {
        const rate = plan.dailyRates.find((row) => isoDate(row.date) === isoDate(night));
        return rate?.priceCents ?? null;
      });
      if (prices.some((price) => price == null)) {
        throw new BadRequestException("Essa tarifa não está aberta em todas as noites");
      }

      for (const night of nights) {
        const free = await this.freeUnits(tx, plan.roomTypeId, night);
        if (free < input.quantity) {
          throw new ConflictException("Esse quarto acabou de ser reservado. Escolha outra opção.");
        }
      }

      const nightly = prices as number[];
      const totalCents = nightly.reduce((sum, price) => sum + price, 0) * input.quantity;
      if (
        input.expectedTotalCents != null &&
        totalCents > input.expectedTotalCents * 1.02 &&
        !input.acceptPriceChange
      ) {
        throw new ConflictException({
          message: `O hotel atualizou o preço para ${formatBrl(totalCents)}. Deseja continuar?`,
          totalCents,
        });
      }

      const now = new Date();
      const holdExpiresAt = mode === "INSTANT" ? new Date(now.getTime() + 15 * 60_000) : null;
      const respondBy = mode === "REQUEST" ? new Date(now.getTime() + 24 * 60 * 60_000) : null;
      const expiresAt = holdExpiresAt ?? respondBy!;
      const accessToken = newAccessToken();
      const booking = await tx.booking.create({
        data: {
          bookingCode: newBookingCode(),
          status: mode === "INSTANT" ? "HELD" : "REQUESTED",
          bookingMode: mode,
          hotelId: plan.hotelId,
          roomTypeId: plan.roomTypeId,
          ratePlanId: plan.id,
          checkIn: utcDate(input.checkIn),
          checkOut: utcDate(input.checkOut),
          nights: nights.length,
          adults: input.adults,
          children: input.children,
          quantity: input.quantity,
          totalCents,
          guestEmail: email,
          guestPhone: input.phone.replace(/\D/g, ""),
          guestCpfHash: hashCpf(normalizeCpf(input.cpf)),
          guestMessage: input.guestMessage?.trim() || null,
          idempotencyKey: input.idempotencyKey,
          accessTokenHash: hashSecret(accessToken),
          holdExpiresAt,
          respondBy,
          snapshot: {
            hotelName: plan.hotel.name,
            hotelSlug: plan.hotel.slug,
            roomName: plan.roomType.name,
            rateName: plan.name,
            cancellationPolicy: plan.cancellationPolicy,
            cancellationLabel: policyLabel(plan.cancellationPolicy),
            mealPlan: plan.mealPlan,
            mealLabel: mealLabel(plan.mealPlan),
            checkInTime: plan.hotel.checkInTime,
            checkOutTime: plan.hotel.checkOutTime,
            addressLine: plan.hotel.addressLine,
            city: plan.hotel.city,
            state: plan.hotel.state,
            nightlyCents: nightly,
            payAtProperty: plan.payAtProperty,
          },
          guests: {
            create: [
              { kind: "PRIMARY", firstName: input.firstName.trim(), lastName: input.lastName.trim() },
              ...input.additionalGuests.map((guest) => ({
                kind: "ADDITIONAL",
                firstName: guest.firstName.trim(),
                lastName: guest.lastName.trim(),
              })),
              ...input.childAges.map((age) => ({
                kind: "CHILD",
                firstName: "Criança",
                lastName: String(age),
                age,
              })),
            ],
          },
          locks: {
            create: nights.map((date) => ({
              roomTypeId: plan.roomTypeId,
              date,
              quantity: input.quantity,
              expiresAt,
            })),
          },
          statusHistory: {
            create: {
              toStatus: mode === "INSTANT" ? "HELD" : "REQUESTED",
              actorType: "GUEST",
            },
          },
        },
      });
      return { id: booking.id, accessToken };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const view = await this.present(created.id, email);
    return { ...view, accessToken: created.accessToken };
  }

  async findForGuest(code: string, email: string) {
    if (!email?.includes("@")) throw new BadRequestException("Informe o e-mail da reserva");
    await this.expireDue(this.prisma);
    const booking = await this.byCode(code, email);
    return this.present(booking.id, normalizeEmail(email));
  }

  async extendHold(code: string, email: string) {
    const booking = await this.byCode(code, email);
    if (booking.status !== "HELD" || booking.bookingMode !== "INSTANT") {
      throw new BadRequestException("Só dá para estender o tempo de uma reserva imediata ainda não paga");
    }
    if (booking.holdExtended) throw new BadRequestException("O tempo extra já foi usado");
    const holdExpiresAt = new Date(Date.now() + 10 * 60_000);
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { holdExpiresAt, holdExtended: true },
      });
      await tx.inventoryLock.updateMany({ where: { bookingId: booking.id }, data: { expiresAt: holdExpiresAt } });
    });
    return this.present(booking.id, normalizeEmail(email));
  }

  async startPayment(code: string, input: PayBookingInput) {
    await this.expireDue(this.prisma);
    const booking = await this.byCode(code, input.email);
    if (booking.status !== "HELD" && booking.status !== "AWAITING_PAYMENT" && booking.status !== "PAYMENT_PENDING") {
      throw new BadRequestException("Essa reserva não está aguardando pagamento");
    }
    if (input.method === "CREDIT_CARD" && input.installments > 1 && booking.totalCents < 10_000) {
      throw new BadRequestException("O parcelamento começa em reservas de R$ 100");
    }
    const deadline = booking.bookingMode === "INSTANT" ? booking.holdExpiresAt : booking.payBy;
    if (!deadline || deadline.getTime() <= Date.now()) {
      throw new BadRequestException("O prazo para pagar acabou");
    }
    await this.prisma.payment.updateMany({
      where: { bookingId: booking.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    const pixCopyPaste =
      input.method === "PIX"
        ? `00020126revoar${booking.bookingCode}${booking.totalCents}${randomBytes(3).toString("hex")}`
        : null;
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountCents: booking.totalCents,
        method: input.method,
        status: "PENDING",
        installments: input.method === "CREDIT_CARD" ? input.installments : 1,
        pixCopyPaste,
        sandbox: true,
      },
    });
    await this.transition(booking.id, booking.status, "PAYMENT_PENDING", "GUEST", "Pagamento iniciado");
    const view = await this.present(booking.id, normalizeEmail(input.email));
    return {
      ...view,
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        pixCopyPaste: payment.pixCopyPaste,
        sandbox: true,
        installments: payment.installments,
      },
    };
  }

  async confirmSandboxPayment(code: string, email: string, paymentId: string) {
    await this.expireDue(this.prisma);
    const booking = await this.byCode(code, email);
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, bookingId: booking.id } });
    if (!payment) throw new NotFoundException("Pagamento não encontrado");
    if (payment.status === "CAPTURED" && booking.status === "CONFIRMED") {
      return this.present(booking.id, normalizeEmail(email));
    }
    if (!payment.sandbox) throw new BadRequestException("Esse pagamento não pode ser confirmado por aqui");

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
      const deadline = fresh.bookingMode === "INSTANT" ? fresh.holdExpiresAt : fresh.payBy;
      if (!deadline || deadline.getTime() <= Date.now() || fresh.status === "CANCELLED" || fresh.status === "EXPIRED") {
        throw new ConflictException("Esse quarto acabou de ser reservado. Nada foi cobrado.");
      }
      const locks = await tx.inventoryLock.count({ where: { bookingId: fresh.id, expiresAt: { gt: new Date() } } });
      if (locks === 0) {
        throw new ConflictException("Esse quarto acabou de ser reservado. Nada foi cobrado.");
      }
      await tx.inventoryLock.deleteMany({ where: { bookingId: fresh.id } });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "CAPTURED", capturedAt: new Date() },
      });
      await tx.booking.update({
        where: { id: fresh.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: fresh.id,
          fromStatus: fresh.status,
          toStatus: "CONFIRMED",
          actorType: "GUEST",
          reason: "Pagamento confirmado no ambiente de teste",
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.present(booking.id, normalizeEmail(email));
  }

  async cancel(code: string, email: string) {
    await this.expireDue(this.prisma);
    const booking = await this.byCode(code, email);
    if (booking.status === "DECLINED" || booking.status === "EXPIRED" || booking.status === "CANCELLED") {
      throw new BadRequestException("Essa reserva já foi encerrada");
    }
    if (booking.status === "REQUESTED" || booking.status === "AWAITING_PAYMENT" || booking.status === "HELD" || booking.status === "PAYMENT_PENDING") {
      await this.release(booking.id, booking.status, "CANCELLED", "GUEST", "Hóspede desistiu");
      return this.present(booking.id, normalizeEmail(email));
    }
    if (booking.status !== "CONFIRMED" || !booking.confirmedAt) {
      throw new BadRequestException("Essa reserva não pode ser cancelada por aqui");
    }
    const snapshot = booking.snapshot as { cancellationPolicy?: CancellationPolicy; checkInTime?: string };
    const policy = snapshot.cancellationPolicy ?? "NON_REFUNDABLE";
    const checkInAt = checkInInstant(booking.checkIn, snapshot.checkInTime ?? "14:00");
    if (checkInAt.getTime() <= Date.now()) {
      throw new BadRequestException("O check-in já começou. Fale com o suporte para alterar a estadia.");
    }
    const percent = refundPercent({
      policy,
      confirmedAt: booking.confirmedAt,
      checkInAt,
      now: new Date(),
    });
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId: booking.id, status: "CAPTURED" },
      orderBy: { createdAt: "desc" },
    });
    const refundedCents = payment ? Math.round((payment.amountCents * percent) / 100) : 0;
    await this.prisma.$transaction(async (tx) => {
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            refundedCents,
            status: percent === 100 ? "REFUNDED" : percent > 0 ? "PARTIAL_REFUND" : "CAPTURED",
          },
        });
      }
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: `Reembolso de ${percent}%` },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: "CONFIRMED",
          toStatus: "CANCELLED",
          actorType: "GUEST",
          reason: `Cancelamento com reembolso de ${percent}%`,
        },
      });
    });
    const view = await this.present(booking.id, normalizeEmail(email));
    return { ...view, refundPercent: percent, refundedCents };
  }

  async listForPartner(partnerId: string) {
    await this.expireDue(this.prisma);
    const bookings = await this.prisma.booking.findMany({
      where: { hotel: { partnerId } },
      orderBy: { createdAt: "desc" },
      include: { guests: true, hotel: { select: { name: true } } },
      take: 100,
    });
    return bookings.map((booking) => this.toView(booking));
  }

  async decide(partnerId: string, bookingId: string, input: PartnerBookingDecisionInput) {
    await this.expireDue(this.prisma);
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, hotel: { partnerId } },
    });
    if (!booking) throw new NotFoundException("Reserva não encontrada");
    if (booking.status !== "REQUESTED") {
      throw new BadRequestException("Esse pedido não está aguardando resposta");
    }
    if (input.decision === "decline") {
      await this.release(booking.id, "REQUESTED", "DECLINED", "PARTNER", input.reason?.trim() || "Parceiro recusou");
      return this.toView(await this.prisma.booking.findUniqueOrThrow({ where: { id: booking.id }, include: { guests: true, hotel: { select: { name: true } } } }));
    }
    const payBy = new Date(Date.now() + 2 * 60 * 60_000);
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "AWAITING_PAYMENT", payBy, respondBy: null },
      });
      await tx.inventoryLock.updateMany({ where: { bookingId: booking.id }, data: { expiresAt: payBy } });
      await tx.bookingStatusHistory.create({
        data: { bookingId: booking.id, fromStatus: "REQUESTED", toStatus: "AWAITING_PAYMENT", actorType: "PARTNER" },
      });
    });
    return this.toView(
      await this.prisma.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: { guests: true, hotel: { select: { name: true } } },
      }),
    );
  }

  async committedByRoom(roomIds: string[], from: Date, to: Date, db: Db = this.prisma) {
    const map = new Map<string, number>();
    if (roomIds.length === 0) return map;
    const [confirmed, locks] = await Promise.all([
      db.booking.findMany({
        where: {
          roomTypeId: { in: roomIds },
          status: "CONFIRMED",
          checkIn: { lte: to },
          checkOut: { gt: from },
        },
        select: { roomTypeId: true, checkIn: true, checkOut: true, quantity: true },
      }),
      db.inventoryLock.findMany({
        where: { roomTypeId: { in: roomIds }, date: { gte: from, lte: to }, ...ACTIVE_LOCK },
        select: { roomTypeId: true, date: true, quantity: true },
      }),
    ]);
    for (const lock of locks) {
      const key = `${lock.roomTypeId}:${isoDate(lock.date)}`;
      map.set(key, (map.get(key) ?? 0) + lock.quantity);
    }
    for (const booking of confirmed) {
      for (let cursor = booking.checkIn; cursor < booking.checkOut; cursor = new Date(cursor.getTime() + 86_400_000)) {
        if (cursor < from || cursor > to) continue;
        const key = `${booking.roomTypeId}:${isoDate(cursor)}`;
        map.set(key, (map.get(key) ?? 0) + booking.quantity);
      }
    }
    return map;
  }

  private async freeUnits(tx: Prisma.TransactionClient, roomTypeId: string, date: Date) {
    const inventory = await tx.roomInventory.findUnique({
      where: { roomTypeId_date: { roomTypeId, date } },
    });
    if (!inventory) return 0;
    const map = await this.committedByRoom([roomTypeId], date, date, tx);
    const taken = map.get(`${roomTypeId}:${isoDate(date)}`) ?? 0;
    return Math.max(0, inventory.unitsForSale - inventory.blockedUnits - taken);
  }

  private async expireDue(db: Db) {
    const now = new Date();
    const due = await db.booking.findMany({
      where: {
        OR: [
          { status: { in: ["HELD", "PAYMENT_PENDING"] }, holdExpiresAt: { lt: now } },
          { status: "REQUESTED", respondBy: { lt: now } },
          { status: "AWAITING_PAYMENT", payBy: { lt: now } },
        ],
      },
      select: { id: true, status: true },
    });
    for (const booking of due) {
      const next: BookingStatus =
        booking.status === "REQUESTED" || booking.status === "AWAITING_PAYMENT" ? "EXPIRED" : "CANCELLED";
      await db.inventoryLock.deleteMany({ where: { bookingId: booking.id } });
      await db.booking.update({
        where: { id: booking.id },
        data: { status: next, cancelledAt: next === "CANCELLED" ? now : null },
      });
      await db.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: next,
          actorType: "SYSTEM",
          reason: "Prazo esgotado",
        },
      });
    }
  }

  private async release(bookingId: string, from: BookingStatus, to: BookingStatus, actor: ActorType, reason: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryLock.deleteMany({ where: { bookingId } });
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: to,
          declineReason: to === "DECLINED" ? reason : undefined,
          cancelledAt: to === "CANCELLED" ? new Date() : undefined,
          cancelReason: to === "CANCELLED" ? reason : undefined,
        },
      });
      await tx.bookingStatusHistory.create({
        data: { bookingId, fromStatus: from, toStatus: to, actorType: actor, reason },
      });
    });
  }

  private async transition(bookingId: string, from: BookingStatus, to: BookingStatus, actor: ActorType, reason: string) {
    await this.prisma.$transaction([
      this.prisma.booking.update({ where: { id: bookingId }, data: { status: to } }),
      this.prisma.bookingStatusHistory.create({
        data: { bookingId, fromStatus: from, toStatus: to, actorType: actor, reason },
      }),
    ]);
  }

  private async byCode(code: string, email: string) {
    const booking = await this.prisma.booking.findUnique({ where: { bookingCode: code.toUpperCase() } });
    if (!booking || booking.guestEmail !== normalizeEmail(email)) {
      throw new NotFoundException("Reserva não encontrada");
    }
    return booking;
  }

  private async present(id: string, email: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, guestEmail: email },
      include: { guests: true, payments: { orderBy: { createdAt: "desc" }, take: 1 }, hotel: { select: { name: true } } },
    });
    if (!booking) throw new NotFoundException("Reserva não encontrada");
    return this.toView(booking);
  }

  private toView(booking: {
    id: string;
    bookingCode: string;
    status: BookingStatus;
    bookingMode: BookingMode;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    adults: number;
    children: number;
    quantity: number;
    totalCents: number;
    guestEmail: string;
    guestPhone: string;
    guestMessage: string | null;
    declineReason: string | null;
    holdExpiresAt: Date | null;
    respondBy: Date | null;
    payBy: Date | null;
    holdExtended: boolean;
    confirmedAt: Date | null;
    snapshot: Prisma.JsonValue;
    guests?: { kind: string; firstName: string; lastName: string; age: number | null }[];
    payments?: { id: string; method: string; status: string; pixCopyPaste: string | null; sandbox: boolean; installments: number; refundedCents: number; amountCents: number }[];
    hotel?: { name: string };
  }) {
    const payment = booking.payments?.[0];
    return {
      id: booking.id,
      code: booking.bookingCode,
      status: booking.status,
      bookingMode: booking.bookingMode,
      hotelName: booking.hotel?.name ?? null,
      checkIn: isoDate(booking.checkIn),
      checkOut: isoDate(booking.checkOut),
      nights: booking.nights,
      adults: booking.adults,
      children: booking.children,
      quantity: booking.quantity,
      totalCents: booking.totalCents,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      guestMessage: booking.guestMessage,
      declineReason: booking.declineReason,
      holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
      respondBy: booking.respondBy?.toISOString() ?? null,
      payBy: booking.payBy?.toISOString() ?? null,
      holdExtended: booking.holdExtended,
      confirmedAt: booking.confirmedAt?.toISOString() ?? null,
      snapshot: booking.snapshot,
      guests: booking.guests ?? [],
      payment: payment
        ? {
            id: payment.id,
            method: payment.method,
            status: payment.status,
            pixCopyPaste: payment.pixCopyPaste,
            sandbox: payment.sandbox,
            installments: payment.installments,
            refundedCents: payment.refundedCents,
          }
        : null,
      refundPreview: this.refundPreview(booking),
    };
  }

  private refundPreview(booking: {
    status: BookingStatus;
    confirmedAt: Date | null;
    checkIn: Date;
    snapshot: Prisma.JsonValue;
    payments?: { status: string; amountCents: number }[];
  }): { percent: number; refundedCents: number } | null {
    const open = ["HELD", "PAYMENT_PENDING", "REQUESTED", "AWAITING_PAYMENT", "CONFIRMED"];
    if (!open.includes(booking.status)) return null;
    if (booking.status !== "CONFIRMED" || !booking.confirmedAt) {
      return { percent: 0, refundedCents: 0 };
    }
    const snapshot = (booking.snapshot ?? {}) as { cancellationPolicy?: CancellationPolicy; checkInTime?: string };
    const checkInAt = checkInInstant(booking.checkIn, snapshot.checkInTime ?? "14:00");
    if (checkInAt.getTime() <= Date.now()) return { percent: 0, refundedCents: 0 };
    const percent = refundPercent({
      policy: snapshot.cancellationPolicy ?? "NON_REFUNDABLE",
      confirmedAt: booking.confirmedAt,
      checkInAt,
      now: new Date(),
    });
    const payment = booking.payments?.find((item) => item.status === "CAPTURED");
    return {
      percent,
      refundedCents: payment ? Math.round((payment.amountCents * percent) / 100) : 0,
    };
  }

  private async loadHotels(city: string, nights: Date[], slug?: string) {
    const from = nights[0];
    const to = nights[nights.length - 1];
    return this.prisma.hotel.findMany({
      where: {
        status: "ACTIVE",
        supplierType: "DIRECT",
        ...(slug ? { slug } : { city: { equals: city, mode: "insensitive" } }),
      },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        roomTypes: {
          orderBy: { sortOrder: "asc" },
          include: {
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
            ratePlans: { where: { active: true }, include: { dailyRates: { where: { date: { gte: from, lte: to } } } } },
            inventory: { where: { date: { gte: from, lte: to } } },
          },
        },
      },
    });
  }

  private quoteHotel(
    hotel: Awaited<ReturnType<GuestBookingService["loadHotels"]>>[number],
    nights: Date[],
    query: GuestSearchQuery,
    committed: Map<string, number>,
    options?: { allowFewerRooms?: boolean },
  ) {
    const offers: { totalCents: number; bookingMode: BookingMode }[] = [];
    const rooms = hotel.roomTypes.map((room) => {
      const mode: BookingMode = room.bookingMode === "INHERIT" ? hotel.bookingMode : room.bookingMode;
      const fits = query.adults <= room.maxAdults && query.adults + query.children <= room.maxOccupancy;
      const rates = fits
        ? room.ratePlans.flatMap((plan) => {
            if (nights.length < plan.minNights) return [];
            const nightly = nights.map((night) => plan.dailyRates.find((rate) => isoDate(rate.date) === isoDate(night))?.priceCents);
            if (nightly.some((price) => price == null)) return [];
            const freeUnits = Math.min(
              ...nights.map((night) => {
                const inventory = room.inventory.find((row) => isoDate(row.date) === isoDate(night));
                if (!inventory) return 0;
                const taken = committed.get(`${room.id}:${isoDate(night)}`) ?? 0;
                return Math.max(0, inventory.unitsForSale - inventory.blockedUnits - taken);
              }),
            );
            if (freeUnits < 1) return [];
            const maxQuantity = Math.min(query.rooms, freeUnits);
            if (!options?.allowFewerRooms && freeUnits < query.rooms) return [];
            const pricedQuantity = options?.allowFewerRooms ? maxQuantity : query.rooms;
            const totalCents = (nightly as number[]).reduce((sum, price) => sum + price, 0) * pricedQuantity;
            offers.push({ totalCents, bookingMode: mode });
            return [
              {
                id: plan.id,
                name: plan.name,
                cancellationPolicy: plan.cancellationPolicy,
                cancellationLabel: policyLabel(plan.cancellationPolicy),
                mealPlan: plan.mealPlan,
                mealLabel: mealLabel(plan.mealPlan),
                minNights: plan.minNights,
                payAtProperty: plan.payAtProperty,
                nightlyCents: nightly,
                totalCents,
                freeUnits,
                maxQuantity,
                bookingMode: mode,
              },
            ];
          })
        : [];
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        bedConfiguration: room.bedConfiguration,
        maxAdults: room.maxAdults,
        maxChildren: room.maxChildren,
        maxOccupancy: room.maxOccupancy,
        amenities: room.amenities,
        sizeSqm: room.sizeSqm,
        imageUrl: room.images[0]?.url ?? null,
        images: room.images.map((image) => ({ url: image.url, altText: image.altText })),
        bookingMode: mode,
        rates,
      };
    });

    return {
      id: hotel.id,
      slug: hotel.slug,
      name: hotel.name,
      city: hotel.city,
      state: hotel.state,
      addressLine: hotel.addressLine,
      starRating: hotel.starRating,
      description: hotel.description,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      houseRules: hotel.houseRules,
      amenities: hotel.amenities,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      imageUrl: hotel.images[0]?.url ?? null,
      images: hotel.images.map((image) => ({ url: image.url, altText: image.altText, isPrimary: image.isPrimary })),
      offers,
      rooms,
    };
  }
}
