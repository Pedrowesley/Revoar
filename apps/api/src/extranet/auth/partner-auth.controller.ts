import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
  partnerLoginSchema,
  PartnerLoginInput,
  partnerSignupSchema,
  PartnerSignupInput,
  resetPasswordSchema,
  ResetPasswordInput,
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

  @Post("forgot-password")
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput) {
    return this.partnerAuthService.forgotPassword(body.email);
  }

  @Post("reset-password")
  resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    return this.partnerAuthService.resetPassword(body.token, body.password);
  }

  @Get("me")
  @UseGuards(PartnerJwtAuthGuard)
  me(@CurrentPartner() partner: PartnerRequestUser) {
    return this.partnerAuthService.getProfile(partner.userId);
  }
}
