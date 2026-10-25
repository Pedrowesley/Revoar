import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  createHotelSchema,
  CreateHotelInput,
  hotelListQuerySchema,
  HotelListQuery,
  updateHotelSchema,
  UpdateHotelInput,
} from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentPartner } from "../auth/current-partner.decorator";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "../auth/partner-jwt.guard";
import { HotelsService } from "./hotels.service";

@Controller("extranet/hotels")
@UseGuards(PartnerJwtAuthGuard)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  findAll(
    @CurrentPartner() partner: PartnerRequestUser,
    @Query(new ZodValidationPipe(hotelListQuerySchema)) query: HotelListQuery,
  ) {
    return this.hotelsService.findAll(partner.partnerId, query);
  }

  @Post()
  create(
    @CurrentPartner() partner: PartnerRequestUser,
    @Body(new ZodValidationPipe(createHotelSchema)) body: CreateHotelInput,
  ) {
    return this.hotelsService.create(partner.partnerId, body);
  }

  @Get(":id")
  findOne(@CurrentPartner() partner: PartnerRequestUser, @Param("id") id: string) {
    return this.hotelsService.findOne(partner.partnerId, id);
  }

  @Patch(":id")
  update(
    @CurrentPartner() partner: PartnerRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateHotelSchema)) body: UpdateHotelInput,
  ) {
    return this.hotelsService.update(partner.partnerId, id, body);
  }

  @Delete(":id")
  remove(@CurrentPartner() partner: PartnerRequestUser, @Param("id") id: string) {
    return this.hotelsService.remove(partner.partnerId, id);
  }

  @Post(":id/submit")
  submit(@CurrentPartner() partner: PartnerRequestUser, @Param("id") id: string) {
    return this.hotelsService.submitForReview(partner.partnerId, partner.userId, id);
  }

  @Post(":id/correction")
  correction(@CurrentPartner() partner: PartnerRequestUser, @Param("id") id: string) {
    return this.hotelsService.requestCorrection(partner.partnerId, partner.userId, id);
  }
}
