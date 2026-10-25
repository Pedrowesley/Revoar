import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  calendarQuerySchema,
  CalendarQuery,
  calendarRangeSchema,
  CalendarRangeInput,
  cancelBookingSchema,
  createGuestBookingSchema,
  CreateGuestBookingInput,
  createRatePlanSchema,
  CreateRatePlanInput,
  guestSearchSchema,
  GuestSearchQuery,
  partnerBookingDecisionSchema,
  PartnerBookingDecisionInput,
  payBookingSchema,
  PayBookingInput,
  updateBookingModeSchema,
  UpdateBookingModeInput,
  updateRoomBookingModeSchema,
  UpdateRoomBookingModeInput,
} from "@revoar/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CurrentPartner } from "../extranet/auth/current-partner.decorator";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "../extranet/auth/partner-jwt.guard";
import { CalendarService } from "./calendar.service";
import { GuestBookingService } from "./guest-booking.service";

@Controller("guest")
export class GuestController {
  constructor(private readonly bookings: GuestBookingService) {}

  @Get("search")
  search(@Query(new ZodValidationPipe(guestSearchSchema)) query: GuestSearchQuery) {
    return this.bookings.search(query);
  }

  @Get("hotels/:slug")
  hotel(
    @Param("slug") slug: string,
    @Query(new ZodValidationPipe(guestSearchSchema)) query: GuestSearchQuery,
  ) {
    return this.bookings.hotelDetail(slug, query);
  }

  @Post("bookings")
  create(@Body(new ZodValidationPipe(createGuestBookingSchema)) body: CreateGuestBookingInput) {
    return this.bookings.create(body);
  }

  @Get("bookings/:code")
  find(@Param("code") code: string, @Query("email") email: string) {
    return this.bookings.findForGuest(code, email ?? "");
  }

  @Post("bookings/:code/extend")
  extend(@Param("code") code: string, @Body(new ZodValidationPipe(cancelBookingSchema)) body: { email: string }) {
    return this.bookings.extendHold(code, body.email);
  }

  @Post("bookings/:code/pay")
  pay(@Param("code") code: string, @Body(new ZodValidationPipe(payBookingSchema)) body: PayBookingInput) {
    return this.bookings.startPayment(code, body);
  }

  @Post("bookings/:code/pay/:paymentId/confirm")
  confirm(
    @Param("code") code: string,
    @Param("paymentId") paymentId: string,
    @Body(new ZodValidationPipe(cancelBookingSchema)) body: { email: string },
  ) {
    return this.bookings.confirmSandboxPayment(code, body.email, paymentId);
  }

  @Post("bookings/:code/cancel")
  cancel(@Param("code") code: string, @Body(new ZodValidationPipe(cancelBookingSchema)) body: { email: string }) {
    return this.bookings.cancel(code, body.email);
  }
}

@Controller("extranet")
@UseGuards(PartnerJwtAuthGuard)
export class PartnerBookingController {
  constructor(
    private readonly calendar: CalendarService,
    private readonly bookings: GuestBookingService,
  ) {}

  @Patch("hotels/:hotelId/booking-mode")
  mode(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Body(new ZodValidationPipe(updateBookingModeSchema)) body: UpdateBookingModeInput,
  ) {
    return this.calendar.updateHotelMode(partner.partnerId, hotelId, body);
  }

  @Patch("hotels/:hotelId/rooms/:roomId/booking-mode")
  roomMode(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
    @Body(new ZodValidationPipe(updateRoomBookingModeSchema)) body: UpdateRoomBookingModeInput,
  ) {
    return this.calendar.updateRoomMode(partner.partnerId, hotelId, roomId, body);
  }

  @Post("hotels/:hotelId/rate-plans")
  ratePlan(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Body(new ZodValidationPipe(createRatePlanSchema)) body: CreateRatePlanInput,
  ) {
    return this.calendar.createRatePlan(partner.partnerId, hotelId, body);
  }

  @Get("hotels/:hotelId/calendar")
  calendarView(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Query(new ZodValidationPipe(calendarQuerySchema)) query: CalendarQuery,
  ) {
    return this.calendar.getCalendar(partner.partnerId, hotelId, query);
  }

  @Post("hotels/:hotelId/calendar")
  calendarUpdate(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Body(new ZodValidationPipe(calendarRangeSchema)) body: CalendarRangeInput,
  ) {
    return this.calendar.applyRange(partner.partnerId, hotelId, body);
  }

  @Get("bookings")
  list(@CurrentPartner() partner: PartnerRequestUser) {
    return this.bookings.listForPartner(partner.partnerId);
  }

  @Post("bookings/:id/decision")
  decide(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(partnerBookingDecisionSchema)) body: PartnerBookingDecisionInput,
  ) {
    return this.bookings.decide(partner.partnerId, id, body);
  }
}
