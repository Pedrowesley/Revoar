import { existsSync } from "fs";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

function seedMediaDir(): string | null {
  const candidates = [join(__dirname, "..", "assets", "seed"), join(process.cwd(), "apps/api/assets/seed"), join(process.cwd(), "assets/seed")];
  return candidates.find((dir) => existsSync(dir)) ?? null;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const seedMedia = seedMediaDir();
  if (seedMedia) app.useStaticAssets(seedMedia, { prefix: "/media/seed" });

  const configuredOrigins = [
    process.env.EXTRANET_URL ?? "http://localhost:3000",
    process.env.ADMIN_URL ?? "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (isLocal || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3002;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
