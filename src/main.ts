import './observability.js'; // <-- Самый первый импорт!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors();
  
  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}

void bootstrap();