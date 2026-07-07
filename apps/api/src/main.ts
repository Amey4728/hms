import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { patchNestJsSwagger } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const apiPrefix = config.getOrThrow<string>('app.apiPrefix');
  const apiVersion = config.getOrThrow<string>('app.apiVersion');
  const globalPrefix = `${apiPrefix}/${apiVersion}`;

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser(config.getOrThrow<string>('cookie.secret')));
  app.enableCors({
    origin: config.getOrThrow<string[]>('app.corsOrigins'),
    credentials: true,
  });
  app.setGlobalPrefix(globalPrefix);
  app.enableShutdownHooks();

  // Swagger / OpenAPI (Zod-aware)
  patchNestJsSwagger();
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HMS API')
    .setDescription('Enterprise Hospital Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(config.getOrThrow<string>('cookie.refreshName'))
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Browser-friendly root: redirect "/" to the Swagger docs.
  app.getHttpAdapter().getInstance().get('/', (_req, res) => res.redirect('/docs'));

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);
  logger.log(`HMS API running at http://localhost:${port}/${globalPrefix}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
