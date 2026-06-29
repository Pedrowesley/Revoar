import { Injectable } from "@nestjs/common";
import { ActorType, HotelStatus } from "@revoar/database";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HotelStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    hotelId: string;
    fromStatus: HotelStatus | null;
    toStatus: HotelStatus;
    reason?: string;
    actorType: ActorType;
    actorId: string;
  }) {
    return this.prisma.hotelStatusHistory.create({
      data: {
        hotelId: params.hotelId,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        reason: params.reason ?? null,
        actorType: params.actorType,
        actorId: params.actorId,
      },
    });
  }
}
