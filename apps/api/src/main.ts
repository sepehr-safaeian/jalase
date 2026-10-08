import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ensureAvatarUploadDir } from './auth/avatar-upload.config.js';
import { ensureRecordingUploadDir } from './transcription/recording-storage.js';

async function bootstrap() {
  ensureAvatarUploadDir();
  ensureRecordingUploadDir();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 3000);
  const isDev = config.get<string>('NODE_ENV') === 'development';

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: isDev ? true : config.get<string>('CORS_ORIGIN', ''),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/v1/uploads/',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('جلسه API')
    .setDescription('دستیار جلسات مبتنی بر هوش مصنوعی، jalase.me')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, config.get<string>('API_HOST', '0.0.0.0'));
  console.log(`🚀 API: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
}

await bootstrap();
