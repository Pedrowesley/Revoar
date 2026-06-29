import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { HotelStatus } from "@revoar/database";
import { RoomTypeInput } from "@revoar/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { HotelsService } from "./hotels.service";

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hotelsService: HotelsService,
  ) {}

  async findAll(partnerId: string, hotelId: string) {
    await this.hotelsService.assertHotelAccess(partnerId, hotelId);

    const rooms = await this.prisma.roomType.findMany({
      where: { hotelId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return rooms.map((room) => this.toResponse(room));
  }

  async create(partnerId: string, hotelId: string, input: RoomTypeInput) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);

    const sortOrder = await this.prisma.roomType.count({ where: { hotelId } });

    const room = await this.prisma.roomType.create({
      data: {
        hotelId,
        name: input.name.trim(),
        description: input.description.trim(),
        maxAdults: input.maxAdults,
        maxChildren: input.maxChildren,
        maxOccupancy: input.maxOccupancy,
        bedConfiguration: input.bedConfiguration.trim(),
        amenities: input.amenities,
        sizeSqm: input.sizeSqm ?? null,
        sortOrder,
      },
    });

    return this.toResponse(room);
  }

  async update(partnerId: string, hotelId: string, roomId: string, input: RoomTypeInput) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.getOwnedRoom(hotelId, roomId);

    const room = await this.prisma.roomType.update({
      where: { id: roomId },
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        maxAdults: input.maxAdults,
        maxChildren: input.maxChildren,
        maxOccupancy: input.maxOccupancy,
        bedConfiguration: input.bedConfiguration.trim(),
        amenities: input.amenities,
        sizeSqm: input.sizeSqm ?? null,
      },
    });

    return this.toResponse(room);
  }

  async remove(partnerId: string, hotelId: string, roomId: string) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.getOwnedRoom(hotelId, roomId);

    await this.prisma.roomType.delete({ where: { id: roomId } });
    return { deleted: true };
  }

  private async getOwnedRoom(hotelId: string, roomId: string) {
    const room = await this.prisma.roomType.findUnique({ where: { id: roomId } });

    if (!room || room.hotelId !== hotelId) {
      throw new NotFoundException("Quarto não encontrado");
    }

    return room;
  }

  private toResponse(room: {
    id: string;
    hotelId: string;
    name: string;
    description: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    bedConfiguration: string;
    amenities: unknown;
    sizeSqm: number | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: room.id,
      hotelId: room.hotelId,
      name: room.name,
      description: room.description,
      maxAdults: room.maxAdults,
      maxChildren: room.maxChildren,
      maxOccupancy: room.maxOccupancy,
      bedConfiguration: room.bedConfiguration,
      amenities: room.amenities as string[],
      sizeSqm: room.sizeSqm,
      sortOrder: room.sortOrder,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }
}
