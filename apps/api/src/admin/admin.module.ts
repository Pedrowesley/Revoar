import { Module } from "@nestjs/common";
import { HotelStatusHistoryService } from "../common/hotel-status-history.service";
import { AdminAuthModule } from "./auth/admin-auth.module";
import { AdminHotelsController } from "./hotels/admin-hotels.controller";
import { AdminHotelsService } from "./hotels/admin-hotels.service";
import { AdminPartnersController } from "./partners/admin-partners.controller";
import { AdminPartnersService } from "./partners/admin-partners.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminPartnersController, AdminHotelsController],
  providers: [AdminPartnersService, AdminHotelsService, HotelStatusHistoryService],
})
export class AdminModule {}
