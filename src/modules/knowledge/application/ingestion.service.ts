import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { KnowledgeRepository } from '../infrastructure/knowledge.repository.js';
import { ChunkingService } from './chunking.service.js';
import { FileParserService } from './file-parser.service.js';
import { IEmbeddingsService, LOCAL_EMBEDDINGS_SERVICE } from '../../ai/application/embeddings.interface.js';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Injectable()
export class IngestionService {
    constructor(
        private readonly repo: KnowledgeRepository,
        private readonly chunkingService: ChunkingService,
        private readonly fileParserService: FileParserService,
        @Inject(LOCAL_EMBEDDINGS_SERVICE) private readonly embeddingsService: IEmbeddingsService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(IngestionService.name);
    }

    async ingestFile(userId: string, file: Express.Multer.File): Promise<string> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('IngestionService.ingestFile', async (span: Span) => {
            this.fileParserService.validateFile(file);
            const textContent = await this.fileParserService.extractText(file);

            if (!textContent.trim()) {
                throw new BadRequestException('Файл пуст или не содержит текста');
            }

            const documentId = await this.repo.createDocument(
                userId, file.originalname, file.mimetype, file.size
            );

            span.setAttribute('document.id', documentId);
            span.setAttribute('document.filename', file.originalname);

            try {
                const chunks = this.chunkingService.chunkText(textContent);
                span.setAttribute('chunks.count', chunks.length);

                const BATCH_SIZE = 10;
                const allEmbeddings: number[][] = [];

                for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                    const batch = chunks.slice(i, i + BATCH_SIZE);
                    const texts = batch.map(c => c.content);
                    const embeddings = await this.embeddingsService.embedTexts(texts);
                    allEmbeddings.push(...embeddings);
                }

                const chunksWithEmbeddings = chunks.map((chunk, index) => {
                    const embedding = allEmbeddings[index];
                    if (!embedding) {
                        throw new Error(`Missing embedding for chunk ${index}`);
                    }
                    return {
                        content: chunk.content,
                        order: chunk.order,
                        embedding,
                        tokenCount: Math.ceil(chunk.content.length / 4),
                    };
                });

                await this.repo.saveChunks(documentId, chunksWithEmbeddings);
                await this.repo.updateDocumentStatus(documentId, 'ready', chunks.length);

                span.setAttribute('status', 'ready');
                this.logger.info({ documentId, filename: file.originalname, chunksCount: chunks.length }, 'Document ingested');

                return documentId;

            } catch (error) {
                await this.repo.updateDocumentStatus(documentId, 'failed');
                recordExceptionSafe(span, error);
                this.logger.error({ documentId, error }, 'Failed to ingest document');
                throw error;
            } finally {
                span.end();
            }
        });
    }
}