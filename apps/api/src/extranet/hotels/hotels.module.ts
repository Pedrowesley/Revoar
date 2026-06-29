import { Module } from "@nestjs/common";
import { HotelStatusHistoryService } from "../../common/hotel-status-history.service";
import { HotelsController } from "./hotels.controller";
import { HotelsService } from "./hotels.service";
import { ImagesController } from "./images.controller";
import { ImagesService } from "./images.service";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

@Module({
  controllers: [HotelsController, RoomsController, ImagesController],
  providers: [HotelsService, RoomsService, ImagesService, HotelStatusHistoryService],
  exports: [HotelsService, RoomsService, ImagesService],
})
export class HotelsModule {}
