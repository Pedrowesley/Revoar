import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { AllowedImageType } from "@revoar/shared";

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private client!: S3Client;
  private bucket!: string;
  private publicBaseUrl!: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const region = this.config.get<string>("AWS_REGION") ?? "sa-east-1";
    const endpoint = this.config.get<string>("AWS_S3_ENDPOINT");
    this.bucket = this.config.get<string>("AWS_S3_BUCKET") ?? "revoar-hotel-images";

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: this.config.get<string>("AWS_ACCESS_KEY_ID") ?? "test",
        secretAccessKey: this.config.get<string>("AWS_SECRET_ACCESS_KEY") ?? "test",
      },
    });

    this.publicBaseUrl = endpoint
      ? `${endpoint.replace(/\/$/, "")}/${this.bucket}`
      : `https://${this.bucket}.s3.${region}.amazonaws.com`;

    await this.ensureBucket();
    await this.ensureBucketCors();
  }

  async createPresignedUpload(params: {
    hotelId: string;
    contentType: AllowedImageType;
    fileName?: string;
  }) {
    const extension = this.extensionFromContentType(params.contentType, params.fileName);
    const key = `hotels/${params.hotelId}/${randomUUID()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 900 });
    const publicUrl = `${this.publicBaseUrl}/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  private extensionFromContentType(contentType: AllowedImageType, fileName?: string) {
    if (fileName) {
      const match = fileName.match(/\.(jpe?g|png|webp)$/i);
      if (match) return `.${match[1].toLowerCase().replace("jpeg", "jpg")}`;
    }

    const map: Record<AllowedImageType, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    return map[contentType];
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket S3 criado: ${this.bucket}`);
      } catch (error) {
        this.logger.warn(`Não foi possível criar bucket S3 (${this.bucket}). Upload pode falhar.`);
        this.logger.warn(error);
      }
    }
  }

  private corsOrigins(): string[] {
    const fromEnv = [this.config.get<string>("EXTRANET_URL"), this.config.get<string>("ADMIN_URL")]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.replace(/\/$/, ""));

    const loopback = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];

    return [...new Set([...loopback, ...fromEnv])];
  }

  private async ensureBucketCors() {
    const allowedOrigins = this.corsOrigins();

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "HEAD"],
                AllowedOrigins: allowedOrigins,
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        }),
      );
      this.logger.log(`CORS S3 configurado para: ${allowedOrigins.join(", ")}`);
    } catch (error) {
      this.logger.warn(
        `Não foi possível configurar CORS do bucket S3 (${this.bucket}). Upload via browser pode falhar.`,
      );
      this.logger.warn(error);
    }
  }
}
