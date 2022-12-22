import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
console.log('NODE_ENV', process.env.NODE_ENV);
export interface IBootstrapConfig {
  module: any;
  name: string;
  logger: Logger;
  port?: number;
}

export async function bootstrapOpenApi(runtime: IBootstrapConfig) {
  runtime.module.name;
  const config = new DocumentBuilder()
    .setTitle(`${runtime.name}`)
    .setDescription(``)
    .setVersion(process.env.FILES_STORAGE_VERSION || '1.0')
    .addBearerAuth()
    .build();

  const app = await NestFactory.create<NestExpressApplication>(runtime.module);
  app.enableCors({
    origin: ['http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  app.enableVersioning();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableShutdownHooks();
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  );
  app.use(cookieParser(process.env.COOKIE_SECRET || 'BAD_SECRET'));
  return await app.listen(runtime.port, '0.0.0.0', () => {
    runtime.logger.verbose(`Started on port ${runtime.port}`);
  });
}
