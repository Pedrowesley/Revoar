import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ActorType, HotelStatus } from "@revoar/database";
import { RejectHotelInput } from "@revoar/shared";
import { HotelStatusHistoryService } from "../../common/hotel-status-history.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { EventBusService } from "../../events/event-bus.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminHotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statusHistory: HotelStatusHistoryService,
    private readonly notifications: NotificationsService,
    private readonly eventBus: EventBusService,
  ) {}

  async list(status?: string) {
    const allowed = Object.values(HotelStatus);
    if (status && !allowed.includes(status as HotelStatus)) {
      throw new BadRequestException("Status inválido");
    }

    const hotels = await this.prisma.hotel.findMany({
      where: status ? { status: status as HotelStatus } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        partner: { select: { id: true, legalName: true, tradeName: true } },
        _count: { select: { roomTypes: true, images: true } },
      },
    });

    return hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      state: hotel.state,
      status: hotel.status,
      partner: hotel.partner,
      roomCount: hotel._count.roomTypes,
      imageCount: hotel._count.images,
      updatedAt: hotel.updatedAt.toISOString(),
    }));
  }

  async listPending() {
    const hotels = await this.prisma.hotel.findMany({
      where: { status: HotelStatus.IN_REVIEW },
      orderBy: { updatedAt: "asc" },
      include: {
        partner: { select: { id: true, legalName: true, tradeName: true } },
        _count: { select: { roomTypes: true, images: true } },
      },
    });

    return hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      city: hotel.city,
      state: hotel.state,
      status: hotel.status,
      partner: hotel.partner,
      roomCount: hotel._count.roomTypes,
      imageCount: hotel._count.images,
      updatedAt: hotel.updatedAt.toISOString(),
    }));
  }

  async getDetail(hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        partner: true,
        roomTypes: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] },
          },
        },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!hotel) {
      throw new NotFoundException("Hotel não encontrado");
    }

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
      phone: hotel.phone,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      status: hotel.status,
      rejectionReason: hotel.rejectionReason,
      partner: {
        id: hotel.partner.id,
        legalName: hotel.partner.legalName,
        tradeName: hotel.partner.tradeName,
        cnpj: hotel.partner.cnpj,
        email: hotel.partner.email,
        contactName: hotel.partner.contactName,
      },
      roomTypes: hotel.roomTypes.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        maxAdults: room.maxAdults,
        maxChildren: room.maxChildren,
        maxOccupancy: room.maxOccupancy,
        bedConfiguration: room.bedConfiguration,
        amenities: room.amenities as string[],
        sizeSqm: room.sizeSqm,
        images: room.images.map((image) => ({
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary,
          altText: image.altText,
        })),
      })),
      images: hotel.images.map((image) => ({
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
        altText: image.altText,
      })),
      statusHistory: hotel.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason,
        actorType: entry.actorType,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  async approve(adminId: string, hotelId: string) {
    const hotel = await this.getInReviewHotel(hotelId);

    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        status: HotelStatus.ACTIVE,
        rejectionReason: null,
      },
      include: { partner: true },
    });

    await this.statusHistory.record({
      hotelId,
      fromStatus: hotel.status,
      toStatus: HotelStatus.ACTIVE,
      actorType: ActorType.ADMIN,
      actorId: adminId,
    });

    await this.notifications.sendHotelApproved(updated.partner.email, updated.name);

    this.eventBus.emitToPartner(updated.partnerId, {
      type: "hotel.approved",
      hotelId,
      partnerId: updated.partnerId,
    });
    this.eventBus.emitToAdmins({
      type: "hotel.approved",
      hotelId,
      partnerId: updated.partnerId,
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
    };
  }

  async reject(adminId: string, hotelId: string, input: RejectHotelInput) {
    const hotel = await this.getInReviewHotel(hotelId);

    const updated = await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        status: HotelStatus.REJECTED,
        rejectionReason: input.reason.trim(),
      },
      include: { partner: true },
    });

    await this.statusHistory.record({
      hotelId,
      fromStatus: hotel.status,
      toStatus: HotelStatus.REJECTED,
      reason: input.reason.trim(),
      actorType: ActorType.ADMIN,
      actorId: adminId,
    });

    await this.notifications.sendHotelRejected(
      updated.partner.email,
      updated.name,
      input.reason.trim(),
    );

    const reason = input.reason.trim();
    this.eventBus.emitToPartner(updated.partnerId, {
      type: "hotel.rejected",
      hotelId,
      partnerId: updated.partnerId,
      reason,
    });
    this.eventBus.emitToAdmins({
      type: "hotel.rejected",
      hotelId,
      partnerId: updated.partnerId,
      reason,
    });

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
      rejectedBy: adminId,
    };
  }

  private async getInReviewHotel(hotelId: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });

    if (!hotel) {
      throw new NotFoundException("Hotel não encontrado");
    }

    if (hotel.status !== HotelStatus.IN_REVIEW) {
      throw new UnprocessableEntityException("Hotel não está em revisão.");
    }

    return hotel;
  }
}
