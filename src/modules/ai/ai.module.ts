import { Module } from '@nestjs/common';
import { GigaChatService } from './infrastructure/gigachat.service.js';
import { GigaChatEmbeddingsService } from './infrastructure/gigachat-embeddings.service.js';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EMBEDDINGS_SERVICE } from './application/embeddings.interface.js';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    GigaChatService,
    {
      provide: EMBEDDINGS_SERVICE,
      useClass: GigaChatEmbeddingsService,
    }
  ],
  exports: [
    GigaChatService,
    EMBEDDINGS_SERVICE
  ],
})
export class AiModule { }