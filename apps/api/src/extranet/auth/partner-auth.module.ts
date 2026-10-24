import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PartnerAuthController } from "./partner-auth.controller";
import { PartnerAuthService } from "./partner-auth.service";
import { PartnerJwtStrategy } from "./partner-jwt.strategy";
import { PartnerNotificationsController } from "../notifications/partner-notifications.controller";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "partner-jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>("JWT_EXPIRES_IN") ?? "15m";
        return {
          secret: config.getOrThrow<string>("JWT_PARTNER_SECRET"),
          signOptions: { expiresIn: expiresIn as `${number}${"s" | "m" | "h" | "d"}` },
        };
      },
    }),
  ],
  controllers: [PartnerAuthController, PartnerNotificationsController],
  providers: [PartnerAuthService, PartnerJwtStrategy],
  exports: [PartnerAuthService, JwtModule, PassportModule],
})
export class PartnerAuthModule {}
