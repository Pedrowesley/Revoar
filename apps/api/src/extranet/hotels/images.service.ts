import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PresignImageInput, RegisterImageInput } from "@revoar/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { S3Service } from "../../storage/s3.service";
import { HotelsService } from "./hotels.service";

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly hotelsService: HotelsService,
  ) {}

  async findAll(partnerId: string, hotelId: string) {
    await this.hotelsService.assertHotelAccess(partnerId, hotelId);

    const images = await this.prisma.hotelImage.findMany({
      where: { hotelId },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return images.map((image) => this.toResponse(image));
  }

  async presign(partnerId: string, hotelId: string, input: PresignImageInput) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);

    return this.s3Service.createPresignedUpload({
      hotelId,
      contentType: input.contentType,
      fileName: input.fileName,
    });
  }

  async register(partnerId: string, hotelId: string, input: RegisterImageInput) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);

    if (!input.url.includes(`/hotels/${hotelId}/`)) {
      throw new BadRequestException("URL da imagem inválida para este hotel");
    }

    const sortOrder = await this.prisma.hotelImage.count({ where: { hotelId } });
    const setPrimary = input.isPrimary ?? sortOrder === 0;

    if (setPrimary) {
      await this.prisma.hotelImage.updateMany({
        where: { hotelId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await this.prisma.hotelImage.create({
      data: {
        hotelId,
        url: input.url,
        altText: input.altText?.trim() || null,
        isPrimary: setPrimary,
        sortOrder,
      },
    });

    return this.toResponse(image);
  }

  async setPrimary(partnerId: string, hotelId: string, imageId: string) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    await this.getOwnedImage(hotelId, imageId);

    await this.prisma.$transaction([
      this.prisma.hotelImage.updateMany({
        where: { hotelId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.hotelImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    const updated = await this.prisma.hotelImage.findUniqueOrThrow({ where: { id: imageId } });
    return this.toResponse(updated);
  }

  async remove(partnerId: string, hotelId: string, imageId: string) {
    await this.hotelsService.assertHotelEditable(partnerId, hotelId);
    const image = await this.getOwnedImage(hotelId, imageId);

    await this.prisma.hotelImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await this.prisma.hotelImage.findFirst({
        where: { hotelId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      if (next) {
        await this.prisma.hotelImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return { deleted: true };
  }

  private async getOwnedImage(hotelId: string, imageId: string) {
    const image = await this.prisma.hotelImage.findUnique({ where: { id: imageId } });

    if (!image || image.hotelId !== hotelId) {
      throw new NotFoundException("Foto não encontrada");
    }

    return image;
  }

  private toResponse(image: {
    id: string;
    hotelId: string;
    url: string;
    sortOrder: number;
    isPrimary: boolean;
    altText: string | null;
    createdAt: Date;
  }) {
    return {
      id: image.id,
      hotelId: image.hotelId,
      url: image.url,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
      altText: image.altText,
      createdAt: image.createdAt.toISOString(),
    };
  }
}
