import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  }));

  const swagger = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription('Development API for testing authentication')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/v1/api-docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.VNA_PORT || 3001);
  await app.listen(port);
  console.log(`Authentication API listening on http://localhost:${port}/api/v1`);
}

bootstrap();
