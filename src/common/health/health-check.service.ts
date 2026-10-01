import { Injectable } from '@nestjs/common';
import { DOCUMENT_SOURCE, IDocumentSource } from '../../modules/knowledge/domain/document-source.interface.js';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class HealthCheckService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(DOCUMENT_SOURCE) private readonly docSource: IDocumentSource,
    ) { }

    async checkDatabase(): Promise<void> {
        await this.prisma.$queryRaw`SELECT 1`;
    }

    async checkDocumentSource(): Promise<void> {
        const healthy = await this.docSource.healthCheck();
        if (!healthy) throw new Error('Document source unavailable');
    }
}