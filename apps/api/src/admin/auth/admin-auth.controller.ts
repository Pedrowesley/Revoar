import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { adminLoginSchema, AdminLoginInput } from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AdminAuthService } from "./admin-auth.service";
import { AdminJwtAuthGuard, AdminRequestUser } from "./admin-jwt.guard";
import { CurrentAdmin } from "./current-admin.decorator";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post("login")
  login(@Body(new ZodValidationPipe(adminLoginSchema)) body: AdminLoginInput) {
    return this.adminAuthService.login(body);
  }

  @Get("me")
  @UseGuards(AdminJwtAuthGuard)
  me(@CurrentAdmin() admin: AdminRequestUser) {
    return this.adminAuthService.getProfile(admin.adminId);
  }
}
