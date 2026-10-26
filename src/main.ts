import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    exceptionFactory: (errors) => {
      const messages: string[] = [];
      errors.forEach((error) => {
        const constraints = error.constraints || {};
        Object.keys(constraints).forEach((constraint) => {
          messages.push(
            constraint === 'whitelistValidation'
              ? `Trường "${error.property}" không được hỗ trợ.`
              : constraints[constraint],
          );
        });
      });
      return new BadRequestException({
        statusCode: 400,
        message: messages.length ? messages : ['Dữ liệu gửi lên không hợp lệ.'],
        error: 'Yêu cầu không hợp lệ.',
      });
    },
  }));

  const swagger = new DocumentBuilder()
    .setTitle('API Xác thực')
    .setDescription('API xác thực và quản lý tài khoản trong môi trường phát triển')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/v1/api-docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.VNA_PORT || 3001);
  await app.listen(port);
  console.log(`API xác thực đang chạy tại http://localhost:${port}/api/v1`);
}

bootstrap();

Name        Mode  
----        ----  
desktop.ini ---h--


