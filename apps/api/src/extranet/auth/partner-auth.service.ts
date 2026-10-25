import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PartnerStatus } from "@revoar/database";
import {
  normalizeCnpj,
  PartnerLoginInput,
  PartnerSignupInput,
} from "@revoar/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/notifications.service";

export type PartnerJwtPayload = {
  sub: string;
  partnerId: string;
  email: string;
  type: "partner";
};

@Injectable()
export class PartnerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  async signup(input: PartnerSignupInput) {
    const cnpj = normalizeCnpj(input.cnpj);
    const email = input.email.toLowerCase().trim();

    const existingCnpj = await this.prisma.partner.findUnique({ where: { cnpj } });
    if (existingCnpj) {
      throw new ConflictException("CNPJ já cadastrado");
    }

    const existingEmail = await this.prisma.partnerUser.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const partner = await this.prisma.partner.create({
      data: {
        legalName: input.legalName.trim(),
        tradeName: input.tradeName?.trim() || null,
        cnpj,
        email,
        phone: input.phone.replace(/\D/g, ""),
        contactName: input.contactName.trim(),
        status: PartnerStatus.PENDING,
        users: {
          create: {
            email,
            passwordHash,
            name: input.name.trim(),
          },
        },
      },
      include: { users: true },
    });

    const user = partner.users[0];

    await this.notifications.sendPartnerSignupPending(partner.email, partner.legalName);

    return {
      ...this.buildAuthResponse(user.id, partner.id, user.email),
      partner: {
        id: partner.id,
        legalName: partner.legalName,
        status: partner.status,
      },
    };
  }

  async login(input: PartnerLoginInput) {
    const email = input.email.toLowerCase().trim();

    const user = await this.prisma.partnerUser.findUnique({
      where: { email },
      include: { partner: true },
    });

    if (!user) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    if (user.partner.status === PartnerStatus.SUSPENDED) {
      throw new UnauthorizedException("Conta suspensa. Entre em contato com a Revoar.");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    return {
      ...this.buildAuthResponse(user.id, user.partnerId, user.email),
      partner: {
        id: user.partner.id,
        legalName: user.partner.legalName,
        status: user.partner.status,
      },
    };
  }

  async forgotPassword(emailRaw: string) {
    const email = emailRaw.toLowerCase().trim();
    const user = await this.prisma.partnerUser.findUnique({ where: { email } });
    if (!user) return { sent: true };

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const extranetUrl = process.env.EXTRANET_URL ?? "http://localhost:3000";
    const link = `${extranetUrl}/reset-password?token=${token}`;
    await this.notifications.sendPasswordReset(user.email, link);
    return { sent: true };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const row = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Link inválido ou expirado.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.partnerUser.update({ where: { id: row.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    ]);
    return { reset: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.partnerUser.findUnique({
      where: { id: userId },
      include: { partner: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      partner: {
        id: user.partner.id,
        legalName: user.partner.legalName,
        tradeName: user.partner.tradeName,
        cnpj: user.partner.cnpj,
        status: user.partner.status,
        email: user.partner.email,
        phone: user.partner.phone,
        contactName: user.partner.contactName,
        logoUrl: user.partner.logoUrl,
        detailsConfirmedAt: user.partner.detailsConfirmedAt?.toISOString() ?? null,
      },
    };
  }

  private buildAuthResponse(userId: string, partnerId: string, email: string) {
    const payload: PartnerJwtPayload = {
      sub: userId,
      partnerId,
      email,
      type: "partner",
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: "Bearer" as const,
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    };
  }
}
