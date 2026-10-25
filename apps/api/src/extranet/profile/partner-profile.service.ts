import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PresignProfileImageInput, UpdatePartnerProfileInput } from "@revoar/shared";
import { EventBusService } from "../../events/event-bus.service";
import { PrismaService } from "../../prisma/prisma.service";
import { S3Service } from "../../storage/s3.service";

const REQUIRED_FIELDS = ["name", "phone", "contactName", "avatarUrl", "logoUrl"] as const;

type ProfileSheet = {
  name: string;
  email: string;
  avatarUrl: string | null;
  legalName: string;
  cnpj: string;
  tradeName: string | null;
  logoUrl: string | null;
  phone: string;
  contactName: string;
  status: string;
  detailsConfirmedAt: string | null;
};

@Injectable()
export class PartnerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly events: EventBusService,
  ) {}

  async update(partnerId: string, userId: string, input: UpdatePartnerProfileInput) {
    this.assertOwnedUrl(input.avatarUrl, partnerId, "avatar");
    this.assertOwnedUrl(input.logoUrl, partnerId, "logo");

    if (Object.keys(input).length === 0) {
      return this.read(partnerId, userId);
    }

    await this.prisma.$transaction([
      this.prisma.partnerUser.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        },
      }),
      this.prisma.partner.update({
        where: { id: partnerId },
        data: {
          ...(input.tradeName !== undefined ? { tradeName: input.tradeName } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
          ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
          detailsConfirmedAt: null,
        },
      }),
    ]);

    this.events.emitToAdmins({ type: "partner.profile.updated", partnerId });
    return this.read(partnerId, userId);
  }

  async presign(partnerId: string, kind: "avatar" | "logo", input: PresignProfileImageInput) {
    if (input.partnerId && input.partnerId !== partnerId) {
      throw new ForbiddenException("Presign de outro parceiro não é permitido.");
    }

    return this.s3.createPartnerAssetUpload({
      partnerId,
      kind,
      contentType: input.contentType,
      fileName: input.fileName,
    });
  }

  async confirm(partnerId: string, userId: string) {
    const current = await this.read(partnerId, userId);
    const missing = REQUIRED_FIELDS.filter((field) => !current[field]);
    if (missing.length > 0) {
      throw new UnprocessableEntityException({ missing: [...missing] });
    }

    await this.prisma.partner.update({
      where: { id: partnerId },
      data: { detailsConfirmedAt: new Date() },
    });
    this.events.emitToAdmins({ type: "partner.profile.updated", partnerId });
    return this.read(partnerId, userId);
  }

  private async read(partnerId: string, userId: string): Promise<ProfileSheet> {
    const user = await this.prisma.partnerUser.findFirst({
      where: { id: userId, partnerId },
      include: { partner: true },
    });
    if (!user) throw new NotFoundException("Parceiro não encontrado");

    return {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      legalName: user.partner.legalName,
      cnpj: user.partner.cnpj,
      tradeName: user.partner.tradeName,
      logoUrl: user.partner.logoUrl,
      phone: user.partner.phone,
      contactName: user.partner.contactName,
      status: user.partner.status,
      detailsConfirmedAt: user.partner.detailsConfirmedAt?.toISOString() ?? null,
    };
  }

  private assertOwnedUrl(url: string | undefined, partnerId: string, kind: "avatar" | "logo") {
    if (url === undefined) return;
    const prefix = `partners/${partnerId}/${kind}/`;
    if (!url.startsWith(prefix) && !url.includes(`/${prefix}`)) {
      throw new BadRequestException("URL de foto inválida");
    }
  }
}
