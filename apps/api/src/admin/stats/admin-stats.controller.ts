import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminJwtAuthGuard } from "../auth/admin-jwt.guard";
import { AdminStatsService } from "./admin-stats.service";

@Controller("admin/stats")
@UseGuards(AdminJwtAuthGuard)
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get()
  getStats() {
    return this.adminStatsService.getStats();
  }
}
