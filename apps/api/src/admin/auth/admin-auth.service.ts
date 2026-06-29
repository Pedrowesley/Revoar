import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { AdminLoginInput } from "@revoar/shared";
import { PrismaService } from "../../prisma/prisma.service";

export type AdminJwtPayload = {
  sub: string;
  email: string;
  role: string;
  type: "admin";
};

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: AdminLoginInput) {
    const email = input.email.toLowerCase().trim();

    const user = await this.prisma.adminUser.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }

    const payload: AdminJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "admin",
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: "Bearer" as const,
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(adminId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: adminId } });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
