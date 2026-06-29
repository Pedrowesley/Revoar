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
import { ImagesService } from "./images.service";

@Controller("extranet/hotels/:hotelId/images")
@UseGuards(PartnerJwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  findAll(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
  ) {
    return this.imagesService.findAll(partner.partnerId, hotelId);
  }

  @Post("presign")
  presign(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Body(new ZodValidationPipe(presignImageSchema)) body: PresignImageInput,
  ) {
    return this.imagesService.presign(partner.partnerId, hotelId, body);
  }

  @Post()
  register(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Body(new ZodValidationPipe(registerImageSchema)) body: RegisterImageInput,
  ) {
    return this.imagesService.register(partner.partnerId, hotelId, body);
  }

  @Patch(":imageId/primary")
  setPrimary(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.imagesService.setPrimary(partner.partnerId, hotelId, imageId);
  }

  @Delete(":imageId")
  remove(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("hotelId") hotelId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.imagesService.remove(partner.partnerId, hotelId, imageId);
  }
}
