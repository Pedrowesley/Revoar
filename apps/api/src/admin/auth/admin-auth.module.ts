import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminJwtStrategy } from "./admin-jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "admin-jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>("JWT_EXPIRES_IN") ?? "15m";
        return {
          secret: config.getOrThrow<string>("JWT_ADMIN_SECRET"),
          signOptions: { expiresIn: expiresIn as `${number}${"s" | "m" | "h" | "d"}` },
        };
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy],
  exports: [AdminAuthService, JwtModule],
})
export class AdminAuthModule {}
