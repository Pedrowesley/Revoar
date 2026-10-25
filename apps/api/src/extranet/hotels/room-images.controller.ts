import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  presignImageSchema,
  PresignImageInput,
  registerImageSchema,
  RegisterImageInput,
} from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentPartner } from "../auth/current-partner.decorator";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "../auth/partner-jwt.guard";
import { RoomImagesService } from "./room-images.service";

@Controller("extranet/hotels/:hotelId/rooms/:roomId/images")
@UseGuards(PartnerJwtAuthGuard)
export class RoomImagesController {
  constructor(private readonly roomImagesService: RoomImagesService) {}

  @Get()
  findAll(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
  ) {
    return this.roomImagesService.findAll(partner.partnerId, hotelId, roomId);
  }

  @Post("presign")
  presign(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
    @Body(new ZodValidationPipe(presignImageSchema)) body: PresignImageInput,
  ) {
    return this.roomImagesService.presign(partner.partnerId, hotelId, roomId, body);
  }

  @Post()
  register(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
    @Body(new ZodValidationPipe(registerImageSchema)) body: RegisterImageInput,
  ) {
    return this.roomImagesService.register(partner.partnerId, hotelId, roomId, body);
  }

  @Patch(":imageId/primary")
  setPrimary(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.roomImagesService.setPrimary(partner.partnerId, hotelId, roomId, imageId);
  }

  @Delete(":imageId")
  remove(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("roomId") roomId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.roomImagesService.remove(partner.partnerId, hotelId, roomId, imageId);
  }
}
