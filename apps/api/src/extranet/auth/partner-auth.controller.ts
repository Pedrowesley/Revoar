import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  partnerLoginSchema,
  PartnerLoginInput,
  partnerSignupSchema,
  PartnerSignupInput,
} from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PartnerAuthService } from "./partner-auth.service";
import { PartnerJwtAuthGuard, PartnerRequestUser } from "./partner-jwt.guard";
import { CurrentPartner } from "./current-partner.decorator";

@Controller("extranet/auth")
export class PartnerAuthController {
  constructor(private readonly partnerAuthService: PartnerAuthService) {}

  @Post("signup")
  signup(@Body(new ZodValidationPipe(partnerSignupSchema)) body: PartnerSignupInput) {
    return this.partnerAuthService.signup(body);
  }

  @Post("login")
  login(@Body(new ZodValidationPipe(partnerLoginSchema)) body: PartnerLoginInput) {
    return this.partnerAuthService.login(body);
  }

  @Get("me")
  @UseGuards(PartnerJwtAuthGuard)
  me(@CurrentPartner() partner: PartnerRequestUser) {
    return this.partnerAuthService.getProfile(partner.userId);
  }
}
