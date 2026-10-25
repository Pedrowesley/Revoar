import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  MAX_ROOM_IMAGES,
  PresignImageInput,
  RegisterImageInput,
  ROOM_IMAGE_LIMIT_MESSAGE,
} from "@revoar/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { S3Service } from "../../storage/s3.service";
import { HotelsService } from "./hotels.service";
import { RoomsService } from "./rooms.service";

@Injectable()
export class RoomImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly hotelsService: HotelsService,
    private readonly roomsService: RoomsService,
  ) {}

  async findAll(partnerId: string, hotelId: string, roomId: string) {
    await this.hotelsService.assertHotelAccess(partnerId, hotelId);
    await this.roomsService.getOwnedRoom(hotelId, roomId);

    const images = await this.prisma.roomImage.findMany({
      where: { roomTypeId: roomId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return images.map((image) => this.toResponse(image));
  }

  async presign(partnerId: string, hotelId: string, roomId: string, input: PresignImageInput) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.roomsService.getOwnedRoom(hotelId, roomId);
    await this.assertBelowLimit(roomId);

    return this.s3Service.createPresignedUpload({
      hotelId,
      roomId,
      contentType: input.contentType,
      fileName: input.fileName,
    });
  }

  async register(partnerId: string, hotelId: string, roomId: string, input: RegisterImageInput) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.roomsService.getOwnedRoom(hotelId, roomId);
    await this.assertBelowLimit(roomId);

    if (!input.url.includes(`/hotels/${hotelId}/rooms/${roomId}/`)) {
      throw new BadRequestException("URL da imagem inválida para este quarto");
    }

    const sortOrder = await this.prisma.roomImage.count({ where: { roomTypeId: roomId } });
    const setPrimary = input.isPrimary ?? sortOrder === 0;

    if (setPrimary) {
      await this.prisma.roomImage.updateMany({
        where: { roomTypeId: roomId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await this.prisma.roomImage.create({
      data: {
        roomTypeId: roomId,
        url: input.url,
        altText: input.altText?.trim() || null,
        isPrimary: setPrimary,
        sortOrder,
      },
    });

    return this.toResponse(image);
  }

  async setPrimary(partnerId: string, hotelId: string, roomId: string, imageId: string) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.roomsService.getOwnedRoom(hotelId, roomId);
    await this.getOwnedImage(roomId, imageId);

    await this.prisma.$transaction([
      this.prisma.roomImage.updateMany({
        where: { roomTypeId: roomId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.roomImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    const updated = await this.prisma.roomImage.findUniqueOrThrow({ where: { id: imageId } });
    return this.toResponse(updated);
  }

  async remove(partnerId: string, hotelId: string, roomId: string, imageId: string) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.roomsService.getOwnedRoom(hotelId, roomId);
    const image = await this.getOwnedImage(roomId, imageId);

    await this.prisma.roomImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await this.prisma.roomImage.findFirst({
        where: { roomTypeId: roomId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      if (next) {
        await this.prisma.roomImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return { deleted: true };
  }

  private async assertBelowLimit(roomId: string) {
    const count = await this.prisma.roomImage.count({ where: { roomTypeId: roomId } });
    if (count >= MAX_ROOM_IMAGES) {
      throw new UnprocessableEntityException(ROOM_IMAGE_LIMIT_MESSAGE);
    }
  }

  private async getOwnedImage(roomId: string, imageId: string) {
    const image = await this.prisma.roomImage.findUnique({ where: { id: imageId } });

    if (!image || image.roomTypeId !== roomId) {
      throw new NotFoundException("Foto não encontrada");
    }

    return image;
  }

  private toResponse(image: {
    id: string;
    roomTypeId: string;
    url: string;
    sortOrder: number;
    isPrimary: boolean;
    altText: string | null;
    createdAt: Date;
  }) {
    return {
      id: image.id,
      roomTypeId: image.roomTypeId,
      url: image.url,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      altText: image.altText,
      createdAt: image.createdAt.toISOString(),
    };
  }
}
