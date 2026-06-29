import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PartnerJwtPayload } from "./partner-auth.service";
import { PartnerRequestUser } from "./partner-jwt.guard";

@Injectable()
export class PartnerJwtStrategy extends PassportStrategy(Strategy, "partner-jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_PARTNER_SECRET"),
    });
  }

  validate(payload: PartnerJwtPayload): PartnerRequestUser {
    if (payload.type !== "partner") {
      throw new UnauthorizedException("Token inválido");
    }

    return {
      userId: payload.sub,
      partnerId: payload.partnerId,
      email: payload.email,
    };
  }
}
