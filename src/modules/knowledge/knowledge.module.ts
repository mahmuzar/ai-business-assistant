import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { KnowledgeRepository } from './infrastructure/knowledge.repository.js';
import { ChunkingService } from './application/chunking.service.js';
import { FileParserService } from './application/file-parser.service.js';
import { IngestionService } from './application/ingestion.service.js';
import { RetrievalService } from './application/retrieval.service.js';
import { KnowledgeController } from './presentation/knowledge.controller.js';
import { AdminGuard } from './presentation/guards/admin.guard.js';

@Module({
  imports: [AiModule],
  controllers: [KnowledgeController],
  providers: [
    KnowledgeRepository,
    ChunkingService,
    FileParserService,
    IngestionService,
    RetrievalService,
    AdminGuard,
  ],
  exports: [RetrievalService],
})
export class KnowledgeModule {}