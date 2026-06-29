import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.EXTRANET_URL ?? "http://localhost:3000",
      process.env.ADMIN_URL ?? "http://localhost:3001",
    ],
    credentials: true,
  });

  const port = process.env.API_PORT ?? 3002;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
