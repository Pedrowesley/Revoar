import { Module } from "@nestjs/common";
import { HotelStatusHistoryService } from "../common/hotel-status-history.service";
import { AdminAuthModule } from "./auth/admin-auth.module";
import { AdminHotelsController } from "./hotels/admin-hotels.controller";
import { AdminHotelsService } from "./hotels/admin-hotels.service";
import { AdminNotificationsController } from "./notifications/admin-notifications.controller";
import { AdminPartnersController } from "./partners/admin-partners.controller";
import { AdminPartnersService } from "./partners/admin-partners.service";
import { AdminStatsController } from "./stats/admin-stats.controller";
import { AdminStatsService } from "./stats/admin-stats.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [
    AdminPartnersController,
    AdminHotelsController,
    AdminStatsController,
    AdminNotificationsController,
  ],
  providers: [AdminPartnersService, AdminHotelsService, AdminStatsService, HotelStatusHistoryService],
})
export class AdminModule {}
