import { Body, Controller, Patch, Post, UseGuards } from "@nestjs/common";
import {
  presignProfileImageSchema,
  PresignProfileImageInput,
  updatePartnerProfileSchema,
  UpdatePartnerProfileInput,
} from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { CurrentPartner } from "../auth/current-partner.decorator";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "../auth/partner-jwt.guard";
import { PartnerProfileService } from "./partner-profile.service";

@Controller("extranet/profile")
@UseGuards(PartnerJwtAuthGuard)
export class PartnerProfileController {
  constructor(private readonly profile: PartnerProfileService) {}

  @Patch()
  update(
    @CurrentPartner() partner: PartnerRequestUser,
    @Body(new ZodValidationPipe(updatePartnerProfileSchema)) body: UpdatePartnerProfileInput,
  ) {
    return this.profile.update(partner.partnerId, partner.userId, body);
  }

  @Post("avatar/presign")
  presignAvatar(
    @CurrentPartner() partner: PartnerRequestUser,
    @Body(new ZodValidationPipe(presignProfileImageSchema)) body: PresignProfileImageInput,
  ) {
    return this.profile.presign(partner.partnerId, "avatar", body);
  }

  @Post("logo/presign")
  presignLogo(
    @CurrentPartner() partner: PartnerRequestUser,
    @Body(new ZodValidationPipe(presignProfileImageSchema)) body: PresignProfileImageInput,
  ) {
    return this.profile.presign(partner.partnerId, "logo", body);
  }

  @Post("confirm")
  confirm(@CurrentPartner() partner: PartnerRequestUser) {
    return this.profile.confirm(partner.partnerId, partner.userId);
  }
}
