import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { KnowledgeRepository } from '../infrastructure/knowledge.repository.js';
import { ChunkingService } from './chunking.service.js';
import { FileParserService } from './file-parser.service.js';
import { IEmbeddingsService, LOCAL_EMBEDDINGS_SERVICE } from '../../ai/application/embeddings.interface.js';
import { IDocumentSource, DOCUMENT_SOURCE } from '../domain/document-source.interface.js';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Injectable()
export class IngestionService {
    constructor(
        private readonly repo: KnowledgeRepository,
        private readonly chunkingService: ChunkingService,
        private readonly fileParserService: FileParserService,
        @Inject(LOCAL_EMBEDDINGS_SERVICE) private readonly embeddingsService: IEmbeddingsService,
        private readonly logger: PinoLogger,
        @Inject(DOCUMENT_SOURCE) private readonly documentSource: IDocumentSource
    ) {
        this.logger.setContext(IngestionService.name);
    }

    async syncFromSource(): Promise<void> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('IngestionService.syncFromSource', async (span: Span) => {
            span.setAttribute('source.name', this.documentSource.name);

            const isHealthy = await this.documentSource.healthCheck();
            if (!isHealthy) {
                throw new Error(`Document source "${this.documentSource.name}" is not available`);
            }

            const documents = await this.documentSource.listDocuments();
            span.setAttribute('documents.total', documents.length);

            this.logger.info({ source: this.documentSource.name, count: documents.length }, 'Starting sync from source');

            for (const doc of documents) {
                try {
                    const existing = await this.repo.findDocumentBySourceId(doc.id);

                    // Re-sync логика: пропускаем если документ актуален
                    if (existing && existing.sourceUpdatedAt && existing.status === 'ready') {
                        const dbTime = new Date(existing.sourceUpdatedAt).getTime();
                        const sourceTime = new Date(doc.updatedAt).getTime();

                        if (dbTime >= sourceTime) {
                            this.logger.debug({ documentId: existing.id, filename: doc.filename }, 'Document is up to date, skipping');
                            continue;
                        }
                        this.logger.info({ documentId: existing.id, filename: doc.filename }, 'Document updated in source, re-syncing');
                    }

                    span.addEvent('processing_document', { 'document.id': doc.id, 'document.filename': doc.filename });

                    const downloaded = await this.documentSource.downloadDocument(doc.id);

                    let documentId = existing?.id;
                    if (!documentId) {
                        // TODO: заменить на реальный userId из авторизации
                        const systemUserId = '90cea254-643a-4a86-b671-88d7fd907990';
                        documentId = await this.repo.createDocument(
                            systemUserId, downloaded.filename, downloaded.mimeType, downloaded.buffer.length
                        );
                    }

                    // Сохраняем метаданные источника
                    await this.repo.updateDocumentMetadata(documentId, doc.id, doc.updatedAt);

                    const textContent = await this.fileParserService.extractTextFromBuffer(downloaded.buffer, downloaded.filename);

                    if (!textContent.trim()) {
                        await this.repo.updateDocumentStatus(documentId, 'failed');
                        this.logger.warn({ documentId, filename: doc.filename }, 'Document is empty, marking as failed');
                        continue;
                    }

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

                    // saveChunks теперь сам удаляет старые чанки перед записью новых
                    await this.repo.saveChunks(documentId, chunksWithEmbeddings);
                    await this.repo.updateDocumentStatus(documentId, 'ready');

                    this.logger.info({ documentId, filename: doc.filename, chunks: chunks.length }, 'Document synced from source');

                } catch (error) {
                    recordExceptionSafe(span, error);
                    // Добавь этот лог, чтобы видеть полную ошибку
                    this.logger.error({
                        sourceId: doc.id,
                        filename: doc.filename,
                        error: error instanceof Error ? error.message : error,
                        stack: error instanceof Error ? error.stack : undefined
                    }, 'Failed to sync document from source');

                    try {
                        const existingDoc = await this.repo.findDocumentBySourceId(doc.id);
                        if (existingDoc) {
                            await this.repo.updateDocumentStatus(existingDoc.id, 'failed');
                        }
                    } catch {
                        // игнорируем ошибку при обновлении статуса
                    }
                }
            }

            this.logger.info({ source: this.documentSource.name }, 'Sync from source completed');
            span.end();
        });
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
                await this.repo.updateDocumentStatus(documentId, 'ready');

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