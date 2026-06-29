import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { roomTypeSchema, RoomTypeInput } from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentPartner } from "../auth/current-partner.decorator";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "../auth/partner-jwt.guard";
import { RoomsService } from "./rooms.service";

@Controller("extranet/hotels/:hotelId/rooms")
@UseGuards(PartnerJwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
  ) {
    return this.roomsService.findAll(partner.partnerId, hotelId);
  }

  @Post()
  create(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Body(new ZodValidationPipe(roomTypeSchema)) body: RoomTypeInput,
  ) {
    return this.roomsService.create(partner.partnerId, hotelId, body);
  }

  @Patch(":roomId")
  update(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
    @Body(new ZodValidationPipe(roomTypeSchema)) body: RoomTypeInput,
  ) {
    return this.roomsService.update(partner.partnerId, hotelId, roomId, body);
  }

  @Delete(":roomId")
  remove(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
  ) {
    return this.roomsService.remove(partner.partnerId, hotelId, roomId);
  }
}
