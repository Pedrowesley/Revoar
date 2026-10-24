import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
