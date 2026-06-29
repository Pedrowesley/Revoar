import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PartnerAuthModule } from "./extranet/auth/partner-auth.module";
import { HotelsModule } from "./extranet/hotels/hotels.module";
import { S3Module } from "./storage/s3.module";
import { AdminModule } from "./admin/admin.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    S3Module,
    NotificationsModule,
    HealthModule,
    PartnerAuthModule,
    HotelsModule,
    AdminModule,
  ],
})
export class AppModule {}
