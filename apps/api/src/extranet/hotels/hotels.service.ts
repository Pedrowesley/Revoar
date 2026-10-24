import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { HotelStatus, PartnerStatus, ActorType } from "@revoar/database";
import {
  CreateHotelInput,
  HOTEL_CRITICAL_FIELDS,
  HotelListQuery,
  slugify,
  UpdateHotelInput,
} from "@revoar/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { HotelStatusHistoryService } from "../../common/hotel-status-history.service";
import { EventBusService } from "../../events/event-bus.service";

const EDITABLE_STATUSES: HotelStatus[] = [HotelStatus.DRAFT, HotelStatus.REJECTED];

const hotelReadInclude = {
  _count: { select: { roomTypes: true, images: true } },
  images: { where: { isPrimary: true }, select: { id: true }, take: 1 },
};

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusHistory: HotelStatusHistoryService,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(partnerId: string, query: HotelListQuery) {
    const hotels = await this.prisma.hotel.findMany({
      where: {
        partnerId,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: hotelReadInclude,
    });

    return hotels.map((hotel) => this.toSummary(hotel));
  }

  async findOne(partnerId: string, hotelId: string) {
    const hotel = await this.getOwnedHotel(partnerId, hotelId);
    return this.toDetail(hotel);
  }

  async create(partnerId: string, input: CreateHotelInput) {
    const slug = await this.generateUniqueSlug(input.name);

    const hotel = await this.prisma.hotel.create({
      data: {
        partnerId,
        slug,
        name: input.name.trim(),
        description: input.description.trim(),
        starRating: input.starRating ?? null,
        addressLine: input.addressLine.trim(),
        city: input.city.trim(),
        state: input.state.toUpperCase(),
        zipCode: input.zipCode.replace(/\D/g, ""),
        phone: input.phone.replace(/\D/g, ""),
        checkInTime: input.checkInTime ?? "14:00",
        checkOutTime: input.checkOutTime ?? "12:00",
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        status: HotelStatus.DRAFT,
      },
      include: hotelReadInclude,
    });

    return this.toDetail(hotel);
  }

  async update(partnerId: string, hotelId: string, input: UpdateHotelInput) {
    const hotel = await this.getOwnedHotel(partnerId, hotelId);

    if (hotel.status === HotelStatus.IN_REVIEW) {
      return this.updatePartialInReview(hotelId, hotel, input);
    }

    if (!EDITABLE_STATUSES.includes(hotel.status)) {
      throw new UnprocessableEntityException(
        "Hotel não pode ser editado neste status. Aguarde a conclusão da revisão.",
      );
    }

    return this.applyFullUpdate(hotelId, hotel, input);
  }

  private async updatePartialInReview(
    hotelId: string,
    hotel: { status: HotelStatus; name: string },
    input: UpdateHotelInput,
  ) {
    for (const field of HOTEL_CRITICAL_FIELDS) {
      if (input[field as keyof UpdateHotelInput] !== undefined) {
        throw new UnprocessableEntityException(
          "Nome e endereço não podem ser editados enquanto o hotel está em análise.",
        );
      }
    }

    const data: Record<string, unknown> = {};

    if (input.description !== undefined) data.description = input.description.trim();
    if (input.starRating !== undefined) data.starRating = input.starRating;
    if (input.phone !== undefined) data.phone = input.phone.replace(/\D/g, "");
    if (input.checkInTime !== undefined) data.checkInTime = input.checkInTime;
    if (input.checkOutTime !== undefined) data.checkOutTime = input.checkOutTime;

    if (Object.keys(data).length === 0) {
      throw new UnprocessableEntityException("Nenhum campo editável foi informado.");
    }

    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data,
      include: hotelReadInclude,
    });

    return this.toDetail(updated);
  }

  private async applyFullUpdate(
    hotelId: string,
    hotel: { status: HotelStatus; name: string },
    input: UpdateHotelInput,
  ) {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) {
      data.name = input.name.trim();
      if (input.name.trim() !== hotel.name) {
        data.slug = await this.generateUniqueSlug(input.name.trim(), hotelId);
      }
    }
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.starRating !== undefined) data.starRating = input.starRating;
    if (input.addressLine !== undefined) data.addressLine = input.addressLine.trim();
    if (input.city !== undefined) data.city = input.city.trim();
    if (input.state !== undefined) data.state = input.state.toUpperCase();
    if (input.zipCode !== undefined) data.zipCode = input.zipCode.replace(/\D/g, "");
    if (input.phone !== undefined) data.phone = input.phone.replace(/\D/g, "");
    if (input.checkInTime !== undefined) data.checkInTime = input.checkInTime;
    if (input.checkOutTime !== undefined) data.checkOutTime = input.checkOutTime;
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;

    if (hotel.status === HotelStatus.REJECTED) {
      data.status = HotelStatus.DRAFT;
      data.rejectionReason = null;
    }

    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data,
      include: hotelReadInclude,
    });

    return this.toDetail(updated);
  }

  async remove(partnerId: string, hotelId: string) {
    const hotel = await this.getOwnedHotel(partnerId, hotelId);

    if (hotel.status !== HotelStatus.DRAFT) {
      throw new UnprocessableEntityException("Apenas hotéis em rascunho podem ser excluídos.");
    }

    await this.prisma.hotel.delete({ where: { id: hotelId } });
    return { deleted: true };
  }

  async submitForReview(partnerId: string, partnerUserId: string, hotelId: string) {
    const hotel = await this.getOwnedHotel(partnerId, hotelId);

    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner || partner.status !== PartnerStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        "Sua conta precisa ser aprovada pela Revoar antes de enviar hotéis para revisão.",
      );
    }

    if (!EDITABLE_STATUSES.includes(hotel.status)) {
      throw new UnprocessableEntityException(
        "Este hotel não pode ser enviado para revisão no status atual.",
      );
    }

    if (hotel._count.roomTypes < 1) {
      throw new UnprocessableEntityException(
        "Cadastre ao menos 1 quarto antes de enviar para revisão.",
      );
    }

    if (hotel._count.images < 1) {
      throw new UnprocessableEntityException(
        "Cadastre ao menos 1 foto antes de enviar para revisão.",
      );
    }

    const primaryImage = await this.prisma.hotelImage.findFirst({
      where: { hotelId, isPrimary: true },
    });

    if (!primaryImage) {
      throw new UnprocessableEntityException(
        "Defina uma foto principal antes de enviar para revisão.",
      );
    }

    if (!hotel.name.trim() || hotel.description.trim().length < 20) {
      throw new UnprocessableEntityException(
        "Preencha nome e descrição completos antes de enviar.",
      );
    }

    if (!hotel.addressLine.trim() || !hotel.city.trim() || !hotel.state.trim() || !hotel.zipCode.trim()) {
      throw new UnprocessableEntityException(
        "Preencha o endereço completo antes de enviar.",
      );
    }

    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: { status: HotelStatus.IN_REVIEW, rejectionReason: null },
      include: hotelReadInclude,
    });

    await this.statusHistory.record({
      hotelId,
      fromStatus: hotel.status,
      toStatus: HotelStatus.IN_REVIEW,
      actorType: ActorType.PARTNER,
      actorId: partnerUserId,
    });

    this.eventBus.emitToAdmins({
      type: "hotel.submitted",
      hotelId,
      partnerId,
    });

    return this.toDetail(updated);
  }

  async assertHotelAccess(partnerId: string, hotelId: string) {
    return this.getOwnedHotel(partnerId, hotelId);
  }

  async assertHotelEditable(partnerId: string, hotelId: string) {
    const hotel = await this.getOwnedHotel(partnerId, hotelId);

    if (!EDITABLE_STATUSES.includes(hotel.status)) {
      throw new UnprocessableEntityException(
        "Hotel não pode ser editado neste status. Aguarde a conclusão da revisão.",
      );
    }

    return hotel;
  }

  private async getOwnedHotel(partnerId: string, hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      include: hotelReadInclude,
    });

    if (!hotel) {
      throw new NotFoundException("Hotel não encontrado");
    }

    if (hotel.partnerId !== partnerId) {
      throw new ForbiddenException("Acesso negado a este hotel");
    }

    return hotel;
  }

  private async generateUniqueSlug(name: string, excludeHotelId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 2;

    while (true) {
      const existing = await this.prisma.hotel.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeHotelId) {
        return slug;
      }
      slug = `${base}-${counter}`;
      counter++;
    }
  }

  private toSummary(
    hotel: {
      id: string;
      name: string;
      slug: string;
      city: string;
      state: string;
      status: HotelStatus;
      rejectionReason: string | null;
      updatedAt: Date;
      _count: { roomTypes: number; images: number };
      images?: { id: string }[];
    },
  ) {
    return {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      city: hotel.city,
      state: hotel.state,
      status: hotel.status,
      rejectionReason: hotel.rejectionReason,
      roomCount: hotel._count.roomTypes,
      imageCount: hotel._count.images,
      hasPrimaryImage: (hotel.images?.length ?? 0) > 0,
      updatedAt: hotel.updatedAt.toISOString(),
    };
  }

  private toDetail(
    hotel: {
      id: string;
      partnerId: string;
      name: string;
      slug: string;
      description: string;
      starRating: { toNumber(): number } | null;
      addressLine: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      latitude: { toNumber(): number } | null;
      longitude: { toNumber(): number } | null;
      phone: string;
      checkInTime: string;
      checkOutTime: string;
      status: HotelStatus;
      rejectionReason: string | null;
      createdAt: Date;
      updatedAt: Date;
      _count: { roomTypes: number; images: number };
      images?: { id: string }[];
    },
  ) {
    return {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description,
      starRating: hotel.starRating ? hotel.starRating.toNumber() : null,
      addressLine: hotel.addressLine,
      city: hotel.city,
      state: hotel.state,
      zipCode: hotel.zipCode,
      country: hotel.country,
      latitude: hotel.latitude ? hotel.latitude.toNumber() : null,
      longitude: hotel.longitude ? hotel.longitude.toNumber() : null,
      phone: hotel.phone,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      status: hotel.status,
      rejectionReason: hotel.rejectionReason,
      roomCount: hotel._count.roomTypes,
      imageCount: hotel._count.images,
      hasPrimaryImage: (hotel.images?.length ?? 0) > 0,
      createdAt: hotel.createdAt.toISOString(),
      updatedAt: hotel.updatedAt.toISOString(),
    };
  }
}
