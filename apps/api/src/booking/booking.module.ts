import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { GuestController, PartnerBookingController } from "./booking.controller";
import { CalendarService } from "./calendar.service";
import { GuestBookingService } from "./guest-booking.service";

@Module({
  imports: [NotificationsModule],
  controllers: [GuestController, PartnerBookingController],
  providers: [GuestBookingService, CalendarService],
  exports: [GuestBookingService],
})
export class BookingModule {}
