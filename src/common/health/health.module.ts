import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthCheckService } from './health-check.service.js';
import { KnowledgeModule } from '../../modules/knowledge/knowledge.module.js'; // Для доступа к DOCUMENT_SOURCE
import { DatabaseModule } from '../../database/database.module.js';

@Module({
  imports: [DatabaseModule, KnowledgeModule],
  controllers: [HealthController],
  providers: [HealthCheckService],
  exports: [], // Экспортировать не нужно, если используется только внутри AppModule
})
export class HealthModule {}