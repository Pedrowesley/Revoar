import { Injectable } from "@nestjs/common";
import { HotelStatus, PartnerStatus } from "@revoar/database";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [pendingPartners, pendingHotels] = await Promise.all([
      this.prisma.partner.count({ where: { status: PartnerStatus.PENDING } }),
      this.prisma.hotel.count({ where: { status: HotelStatus.IN_REVIEW } }),
    ]);

    return { pendingPartners, pendingHotels };
  }
}
