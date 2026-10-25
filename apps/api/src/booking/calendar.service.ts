import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@revoar/database";
import { CalendarQuery, CalendarRangeInput, CreateRatePlanInput, UpdateBookingModeInput, UpdateRoomBookingModeInput } from "@revoar/shared";
import { PrismaService } from "../prisma/prisma.service";
import { eachDateInclusive, isoDate, utcDate } from "./stay";
import { GuestBookingService } from "./guest-booking.service";

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: GuestBookingService,
  ) {}

  async updateHotelMode(partnerId: string, hotelId: string, input: UpdateBookingModeInput) {
    await this.ownedHotel(partnerId, hotelId);
    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        bookingMode: input.bookingMode,
        ...(input.houseRules !== undefined ? { houseRules: input.houseRules?.trim() || null } : {}),
        ...(input.amenities ? { amenities: input.amenities } : {}),
      },
      select: { id: true, bookingMode: true, houseRules: true, amenities: true },
    });
  }

  async updateRoomMode(partnerId: string, hotelId: string, roomId: string, input: UpdateRoomBookingModeInput) {
    await this.ownedRoom(partnerId, hotelId, roomId);
    return this.prisma.roomType.update({
      where: { id: roomId },
      data: { bookingMode: input.bookingMode },
      select: { id: true, bookingMode: true },
    });
  }

  async createRatePlan(partnerId: string, hotelId: string, input: CreateRatePlanInput) {
    await this.ownedRoom(partnerId, hotelId, input.roomTypeId);
    return this.prisma.ratePlan.create({
      data: {
        hotelId,
        roomTypeId: input.roomTypeId,
        name: input.name.trim(),
        cancellationPolicy: input.cancellationPolicy,
        mealPlan: input.mealPlan,
        minNights: input.minNights,
        payAtProperty: input.payAtProperty?.trim() || null,
      },
    });
  }

  async getCalendar(partnerId: string, hotelId: string, query: CalendarQuery) {
    const hotel = await this.prisma.hotel.findFirst({
      where: { id: hotelId, partnerId },
      include: {
        roomTypes: {
          orderBy: { sortOrder: "asc" },
          include: {
            ratePlans: { orderBy: { createdAt: "asc" } },
            inventory: {
              where: { date: { gte: utcDate(query.from), lte: utcDate(query.to) } },
              orderBy: { date: "asc" },
            },
          },
        },
      },
    });
    if (!hotel) throw new NotFoundException("Hotel não encontrado");

    const from = utcDate(query.from);
    const to = utcDate(query.to);
    const days = eachDateInclusive(from, to);
    const roomIds = hotel.roomTypes.map((room) => room.id);
    const committed = await this.bookings.committedByRoom(roomIds, from, to);

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        status: hotel.status,
        bookingMode: hotel.bookingMode,
        houseRules: hotel.houseRules,
        amenities: hotel.amenities,
      },
      rooms: hotel.roomTypes.map((room) => ({
        id: room.id,
        name: room.name,
        bookingMode: room.bookingMode,
        ratePlans: room.ratePlans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          cancellationPolicy: plan.cancellationPolicy,
          mealPlan: plan.mealPlan,
          minNights: plan.minNights,
          payAtProperty: plan.payAtProperty,
          active: plan.active,
        })),
        days: days.map((date) => {
          const key = isoDate(date);
          const inventory = room.inventory.find((row) => isoDate(row.date) === key);
          const taken = committed.get(`${room.id}:${key}`) ?? 0;
          const unitsForSale = inventory?.unitsForSale ?? 0;
          const blockedUnits = inventory?.blockedUnits ?? 0;
          const freeUnits = Math.max(0, unitsForSale - blockedUnits - taken);
          return {
            date: key,
            unitsForSale,
            blockedUnits,
            blockReason: inventory?.blockReason ?? null,
            committedUnits: taken,
            freeUnits,
            configured: Boolean(inventory),
          };
        }),
      })),
    };
  }

  async applyRange(partnerId: string, hotelId: string, input: CalendarRangeInput) {
    await this.ownedRoom(partnerId, hotelId, input.roomTypeId);
    const days = eachDateInclusive(utcDate(input.from), utcDate(input.to));

    if (input.action === "open") {
      const plan = await this.prisma.ratePlan.findFirst({
        where: { id: input.ratePlanId, hotelId, roomTypeId: input.roomTypeId },
      });
      if (!plan) throw new NotFoundException("Tarifa não encontrada neste quarto");
      await this.prisma.$transaction(async (tx) => {
        for (const date of days) {
          const taken = await this.takenUnits(tx, input.roomTypeId, date);
          if (taken > input.unitsForSale!) {
            throw new BadRequestException(
              `Em ${isoDate(date)} já existem ${taken} quarto(s) confirmados ou em checkout. A quantidade à venda precisa cobrir isso.`,
            );
          }
          await tx.roomInventory.upsert({
            where: { roomTypeId_date: { roomTypeId: input.roomTypeId, date } },
            create: {
              roomTypeId: input.roomTypeId,
              date,
              unitsForSale: input.unitsForSale!,
              blockedUnits: 0,
              blockReason: null,
            },
            update: { unitsForSale: input.unitsForSale!, blockedUnits: 0, blockReason: null },
          });
          await tx.dailyRate.upsert({
            where: { ratePlanId_date: { ratePlanId: plan.id, date } },
            create: { ratePlanId: plan.id, date, priceCents: input.priceCents! },
            update: { priceCents: input.priceCents! },
          });
        }
      });
    } else {
      await this.prisma.$transaction(async (tx) => {
        for (const date of days) {
          const taken = await this.takenUnits(tx, input.roomTypeId, date);
          const current = await tx.roomInventory.findUnique({
            where: { roomTypeId_date: { roomTypeId: input.roomTypeId, date } },
          });
          const unitsForSale = current?.unitsForSale ?? 0;
          const blockedUnits = input.blockAll ? Math.max(0, unitsForSale - taken) : input.blockedUnits!;
          if (!input.blockAll && unitsForSale === 0 && blockedUnits > 0) {
            await tx.roomInventory.upsert({
              where: { roomTypeId_date: { roomTypeId: input.roomTypeId, date } },
              create: {
                roomTypeId: input.roomTypeId,
                date,
                unitsForSale: blockedUnits,
                blockedUnits,
                blockReason: input.blockReason!,
              },
              update: { unitsForSale: blockedUnits, blockedUnits, blockReason: input.blockReason! },
            });
            continue;
          }
          if (blockedUnits > unitsForSale - taken) {
            throw new BadRequestException(
              `Em ${isoDate(date)} dá para bloquear no máximo ${Math.max(0, unitsForSale - taken)} unidade(s). O restante já está confirmado ou em checkout.`,
            );
          }
          await tx.roomInventory.upsert({
            where: { roomTypeId_date: { roomTypeId: input.roomTypeId, date } },
            create: {
              roomTypeId: input.roomTypeId,
              date,
              unitsForSale,
              blockedUnits,
              blockReason: blockedUnits > 0 ? input.blockReason! : null,
            },
            update: {
              blockedUnits,
              blockReason: blockedUnits > 0 ? input.blockReason! : null,
            },
          });
        }
      });
    }

    return this.getCalendar(partnerId, hotelId, { from: input.from, to: input.to });
  }

  private async takenUnits(tx: Prisma.TransactionClient, roomTypeId: string, date: Date) {
    const map = await this.bookings.committedByRoom([roomTypeId], date, date, tx);
    return map.get(`${roomTypeId}:${isoDate(date)}`) ?? 0;
  }

  private async ownedHotel(partnerId: string, hotelId: string) {
    const hotel = await this.prisma.hotel.findFirst({ where: { id: hotelId, partnerId }, select: { id: true } });
    if (!hotel) throw new NotFoundException("Hotel não encontrado");
    return hotel;
  }

  private async ownedRoom(partnerId: string, hotelId: string, roomId: string) {
    const room = await this.prisma.roomType.findFirst({
      where: { id: roomId, hotelId, hotel: { partnerId } },
      select: { id: true },
    });
    if (!room) throw new NotFoundException("Quarto não encontrado");
    return room;
  }
}
