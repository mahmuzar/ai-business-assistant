import './observability.js'; // <-- Самый первый импорт!
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors();
  // Включаем валидацию входящих DTO
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Включаем сериализацию исходящих ответов (убирает _id, _domainEvents и т.д.)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}

void bootstrap();