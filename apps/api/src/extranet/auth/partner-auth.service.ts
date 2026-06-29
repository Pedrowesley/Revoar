import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
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
      partner: {
        id: user.partner.id,
        legalName: user.partner.legalName,
        tradeName: user.partner.tradeName,
        cnpj: user.partner.cnpj,
        status: user.partner.status,
        email: user.partner.email,
        phone: user.partner.phone,
        contactName: user.partner.contactName,
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
