import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiModule } from '../ai/ai.module.js';
import { KnowledgeRepository } from './infrastructure/knowledge.repository.js';
import { ChunkingService } from './application/chunking.service.js';
import { FileParserService } from './application/file-parser.service.js';
import { IngestionService } from './application/ingestion.service.js';
import { RetrievalService } from './application/retrieval.service.js';
import { KnowledgeController } from './presentation/knowledge.controller.js';
import { AdminGuard } from './presentation/guards/admin.guard.js';
import { LocalFileDocumentSource } from './infrastructure/sources/local-file.source.js';
import { DOCUMENT_SOURCE } from './domain/document-source.interface.js';

@Module({
  imports: [AiModule, ConfigModule],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeRepository,
    ChunkingService,
    FileParserService,
    IngestionService,
    RetrievalService,
    AdminGuard,
    {
      provide: DOCUMENT_SOURCE,
      useFactory: (configService: ConfigService) => {
        const basePath = configService.get<string>('DOCUMENTS_BASE_PATH', './documents');
        return new LocalFileDocumentSource(basePath);
      },
      inject: [ConfigService],
    },
  ],
  exports: [RetrievalService, IngestionService, DOCUMENT_SOURCE],
})
export class KnowledgeModule { }