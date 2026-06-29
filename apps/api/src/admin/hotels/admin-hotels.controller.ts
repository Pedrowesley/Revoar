import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { rejectHotelSchema, RejectHotelInput } from "@revoar/shared";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AdminJwtAuthGuard, AdminRequestUser } from "../auth/admin-jwt.guard";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import { AdminHotelsService } from "./admin-hotels.service";

@Controller("admin/hotels")
@UseGuards(AdminJwtAuthGuard)
export class AdminHotelsController {
  constructor(private readonly adminHotelsService: AdminHotelsService) {}

  @Get("pending")
  listPending() {
    return this.adminHotelsService.listPending();
  }

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.adminHotelsService.getDetail(id);
  }

  @Patch(":id/approve")
  approve(@CurrentAdmin() admin: AdminRequestUser, @Param("id") id: string) {
    return this.adminHotelsService.approve(admin.adminId, id);
  }

  @Patch(":id/reject")
  reject(
    @CurrentAdmin() admin: AdminRequestUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(rejectHotelSchema)) body: RejectHotelInput,
  ) {
    return this.adminHotelsService.reject(admin.adminId, id, body);
  }
}
