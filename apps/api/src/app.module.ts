import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventsModule } from "./events/events.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PartnerAuthModule } from "./extranet/auth/partner-auth.module";
import { HotelsModule } from "./extranet/hotels/hotels.module";
import { PartnerProfileModule } from "./extranet/profile/partner-profile.module";
import { S3Module } from "./storage/s3.module";
import { AdminModule } from "./admin/admin.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { BookingModule } from "./booking/booking.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    PrismaModule,
    S3Module,
    NotificationsModule,
    HealthModule,
    PartnerAuthModule,
    PartnerProfileModule,
    HotelsModule,
    BookingModule,
    AdminModule,
  ],
})
export class AppModule {}
