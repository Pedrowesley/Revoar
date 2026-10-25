import { Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { AdminJwtAuthGuard, AdminRequestUser } from "../auth/admin-jwt.guard";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import { AdminPartnersService } from "./admin-partners.service";

@Controller("admin/partners")
@UseGuards(AdminJwtAuthGuard)
export class AdminPartnersController {
  constructor(private readonly adminPartnersService: AdminPartnersService) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.adminPartnersService.list(status);
  }

  @Get("pending")
  listPending() {
    return this.adminPartnersService.listPending();
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.adminPartnersService.getById(id);
  }

  @Patch(":id/approve")
  approve(@CurrentAdmin() admin: AdminRequestUser, @Param("id") id: string) {
    return this.adminPartnersService.approve(admin.adminId, id);
  }

  @Patch(":id/suspend")
  suspend(@CurrentAdmin() admin: AdminRequestUser, @Param("id") id: string) {
    return this.adminPartnersService.suspend(admin.adminId, id);
  }
}
