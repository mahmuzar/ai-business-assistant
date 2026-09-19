import './observability.js'; // <-- Самый первый импорт!
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // <-- Импортируем

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors();
  // Включаем валидацию входящих DTO
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Включаем сериализацию исходящих ответов (убирает _id, _domainEvents и т.д.)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

   const config = new DocumentBuilder()
    .setTitle('AI Business Assistant API')
    .setDescription('API documentation for the AI Business Assistant project')
    .setVersion('1.0')
    .addTag('telegram', 'Telegram Bot Webhooks')
    .addTag('users', 'User Management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}

void bootstrap();