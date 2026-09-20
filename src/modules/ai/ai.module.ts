import { Module } from '@nestjs/common';
import { GigaChatService } from './infrastructure/gigachat.service.js';
import { GigaChatEmbeddingsService } from './infrastructure/gigachat-embeddings.service.js';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EMBEDDINGS_SERVICE, LOCAL_EMBEDDINGS_SERVICE } from './application/embeddings.interface.js';
import { LocalEmbeddingsService } from './infrastructure/local-embeddings.service.js';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    GigaChatService,
    {
      provide: EMBEDDINGS_SERVICE,
      useClass: GigaChatEmbeddingsService,
    },
    {
      provide: LOCAL_EMBEDDINGS_SERVICE,
      useClass: LocalEmbeddingsService,
    },
  ],
  exports: [
    GigaChatService,
    EMBEDDINGS_SERVICE,
    LOCAL_EMBEDDINGS_SERVICE
  ],
})
export class AiModule { }