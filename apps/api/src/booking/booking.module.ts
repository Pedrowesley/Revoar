import { Module } from "@nestjs/common";
import { GuestController, PartnerBookingController } from "./booking.controller";
import { CalendarService } from "./calendar.service";
import { GuestBookingService } from "./guest-booking.service";

@Module({
  controllers: [GuestController, PartnerBookingController],
  providers: [GuestBookingService, CalendarService],
  exports: [GuestBookingService],
})
export class BookingModule {}
