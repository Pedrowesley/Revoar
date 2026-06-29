import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AdminJwtPayload } from "./admin-auth.service";
import { AdminRequestUser } from "./admin-jwt.guard";

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, "admin-jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ADMIN_SECRET"),
    });
  }

  validate(payload: AdminJwtPayload): AdminRequestUser {
    if (payload.type !== "admin") {
      throw new UnauthorizedException("Token inválido");
    }

    return {
      adminId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
