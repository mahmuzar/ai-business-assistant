import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';
import { PrismaService } from '../../../database/prisma.service.js';



@Injectable()
export class KnowledgeRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(KnowledgeRepository.name);
    }

    async createDocument(userId: string, filename: string, mimeType: string, fileSize: number): Promise<string> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('KnowledgeRepository.createDocument', async (span: Span) => {
            try {
                span.setAttribute('document.filename', filename);
                span.setAttribute('document.userId', userId);

                const doc = await this.prisma.document.create({
                    data: {
                        uploadedBy: userId,
                        filename,
                        mimeType,
                        fileSize,
                        status: 'processing',
                    },
                });

                this.logger.info({ documentId: doc.id, filename, userId }, 'Document created');
                return doc.id;

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error, filename, userId }, 'Failed to create document');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async updateDocumentStatus(documentId: string, status: string, chunkCount?: number): Promise<void> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('KnowledgeRepository.updateDocumentStatus', async (span: Span) => {
            try {
                span.setAttribute('document.id', documentId);
                span.setAttribute('document.status', status);

                await this.prisma.document.update({
                    where: { id: documentId },
                    data: {
                        status,
                        ...(chunkCount !== undefined && { chunkCount }),
                    },
                });

                this.logger.info({ documentId, status, chunkCount }, 'Document status updated');

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error, documentId, status }, 'Failed to update document status');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async saveChunks(documentId: string, chunks: Array<{ content: string; order: number; embedding: number[]; tokenCount?: number }>): Promise<void> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('KnowledgeRepository.saveChunks', async (span: Span) => {
            try {
                span.setAttribute('document.id', documentId);
                span.setAttribute('chunks.count', chunks.length);

                await this.prisma.chunk.createMany({
                    data: chunks.map(chunk => ({
                        documentId,
                        content: chunk.content,
                        order: chunk.order,
                        embedding: chunk.embedding,
                        tokenCount: chunk.tokenCount,
                    })),
                });

                this.logger.info({ documentId, chunksCount: chunks.length }, 'Chunks saved');

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error, documentId }, 'Failed to save chunks');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async searchSimilar(embedding: number[], limit: number = 5): Promise<Array<{ content: string; filename: string; similarity: number }>> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('KnowledgeRepository.searchSimilar', async (span: Span) => {
            try {
                span.setAttribute('search.limit', limit);
                span.setAttribute('embedding.dimension', embedding.length);

                const vectorString = `[${embedding.join(',')}]`;

                const results = await this.prisma.$queryRaw<Array<{ content: string; filename: string; similarity: number }>>`
          SELECT 
            c.content,
            d.filename,
            1 - (c.embedding::vector <=> ${vectorString}::vector) as similarity
          FROM chunks c
          JOIN documents d ON c."documentId" = d.id
          WHERE d.status = 'ready'
          ORDER BY c.embedding::vector <=> ${vectorString}::vector
          LIMIT ${limit}
        `;

                span.setAttribute('results.count', results.length);
                this.logger.debug({ resultsCount: results.length, limit }, 'Vector search completed');

                return results;

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error }, 'Vector search failed');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async getAllDocuments(): Promise<Array<{ id: string; filename: string; status: string; chunkCount: number; createdAt: Date }>> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('KnowledgeRepository.getAllDocuments', async (span: Span) => {
            try {
                const documents = await this.prisma.document.findMany({
                    select: { id: true, filename: true, status: true, chunkCount: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                });

                span.setAttribute('documents.count', documents.length);
                this.logger.debug({ count: documents.length }, 'Documents listed');

                return documents;

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error }, 'Failed to list documents');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async deleteDocument(documentId: string): Promise<void> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('KnowledgeRepository.deleteDocument', async (span: Span) => {
            try {
                span.setAttribute('document.id', documentId);

                await this.prisma.document.delete({
                    where: { id: documentId },
                });

                this.logger.info({ documentId }, 'Document deleted');

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error, documentId }, 'Failed to delete document');
                throw error;
            } finally {
                span.end();
            }
        });
    }
}