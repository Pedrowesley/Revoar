import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PartnerStatus } from "@revoar/database";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { EventBusService } from "../../events/event-bus.service";

@Injectable()
export class AdminPartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly eventBus: EventBusService,
  ) {}

  async list(status?: string) {
    const allowed = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
    if (status && !allowed.includes(status as (typeof allowed)[number])) {
      throw new BadRequestException("Status inválido");
    }

    const partners = await this.prisma.partner.findMany({
      where: status ? { status: status as (typeof allowed)[number] } : undefined,
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { hotels: true } } },
    });

    return partners.map((partner) => ({
      id: partner.id,
      legalName: partner.legalName,
      tradeName: partner.tradeName,
      cnpj: partner.cnpj,
      email: partner.email,
      phone: partner.phone,
      contactName: partner.contactName,
      status: partner.status,
      detailsConfirmed: partner.detailsConfirmedAt !== null,
      hotelCount: partner._count.hotels,
      createdAt: partner.createdAt.toISOString(),
    }));
  }

  async listPending() {
    const partners = await this.prisma.partner.findMany({
      where: { status: PartnerStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { hotels: true } },
      },
    });

    return partners.map((partner) => ({
      id: partner.id,
      legalName: partner.legalName,
      tradeName: partner.tradeName,
      cnpj: partner.cnpj,
      email: partner.email,
      phone: partner.phone,
      contactName: partner.contactName,
      status: partner.status,
      detailsConfirmed: partner.detailsConfirmedAt !== null,
      hotelCount: partner._count.hotels,
      createdAt: partner.createdAt.toISOString(),
    }));
  }

  async getById(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      include: { users: { orderBy: { createdAt: "asc" }, take: 1 } },
    });

    if (!partner) {
      throw new NotFoundException("Parceiro não encontrado");
    }

    const user = partner.users[0];

    return {
      id: partner.id,
      name: user?.name ?? null,
      email: user?.email ?? partner.email,
      avatarUrl: user?.avatarUrl ?? null,
      legalName: partner.legalName,
      cnpj: partner.cnpj,
      tradeName: partner.tradeName,
      logoUrl: partner.logoUrl,
      phone: partner.phone,
      contactName: partner.contactName,
      status: partner.status,
      detailsConfirmedAt: partner.detailsConfirmedAt?.toISOString() ?? null,
    };
  }

  async approve(adminId: string, partnerId: string) {
    const partner = await this.getPendingPartner(partnerId);

    const updated = await this.prisma.partner.update({
      where: { id: partnerId },
      data: { status: PartnerStatus.ACTIVE },
    });

    await this.notifications.sendPartnerApproved(updated.email, updated.legalName);

    this.eventBus.emitToPartner(partnerId, { type: "partner.approved", partnerId });
    this.eventBus.emitToAdmins({ type: "partner.approved", partnerId });

    return {
      id: updated.id,
      legalName: updated.legalName,
      status: updated.status,
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
    };
  }

  async suspend(adminId: string, partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });

    if (!partner) {
      throw new NotFoundException("Parceiro não encontrado");
    }

    if (partner.status === PartnerStatus.PENDING) {
      throw new UnprocessableEntityException("Use aprovação para parceiros pendentes.");
    }

    const updated = await this.prisma.partner.update({
      where: { id: partnerId },
      data: { status: PartnerStatus.SUSPENDED },
    });

    return {
      id: updated.id,
      legalName: updated.legalName,
      status: updated.status,
      suspendedBy: adminId,
    };
  }

  private async getPendingPartner(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });

    if (!partner) {
      throw new NotFoundException("Parceiro não encontrado");
    }

    if (partner.status !== PartnerStatus.PENDING) {
      throw new UnprocessableEntityException("Parceiro não está pendente de aprovação.");
    }

    return partner;
  }
}
