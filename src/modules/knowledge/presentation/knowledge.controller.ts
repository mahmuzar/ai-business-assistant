import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { IngestionService } from '../application/ingestion.service.js';
import { KnowledgeRepository } from '../infrastructure/knowledge.repository.js';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Controller('api/v1/knowledge')
//@UseGuards(AdminGuard)
export class KnowledgeController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly repo: KnowledgeRepository,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(KnowledgeController.name);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('KnowledgeController.uploadFile', async (span: Span) => {
      try {
        if (!file) {
          throw new BadRequestException('Файл не загружен');
        }

        span.setAttribute('file.originalname', file.originalname);
        span.setAttribute('file.mimetype', file.mimetype);
        span.setAttribute('file.size', file.size);
        span.setAttribute('user.id', req.user?.id);

        this.logger.info({ filename: file.originalname, size: file.size, userId: req.user?.id }, 'File upload requested');

        const userId = req.user?.id ?? '90cea254-643a-4a86-b671-88d7fd907990';
        const documentId = await this.ingestionService.ingestFile(userId, file);

        span.setAttribute('document.id', documentId);
        this.logger.info({ documentId, filename: file.originalname }, 'File uploaded and ingested');

        return { success: true, documentId };

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error(
          {
            error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : String(error),
            filename: file?.originalname
          },
          'File upload failed'
        );
        throw error;
      } finally {
        span.end();
      }
    });
  }

  @Get('documents')
  async listDocuments() {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('KnowledgeController.listDocuments', async (span: Span) => {
      try {
        const documents = await this.repo.getAllDocuments();

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

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('KnowledgeController.deleteDocument', async (span: Span) => {
      try {
        span.setAttribute('document.id', id);

        this.logger.info({ documentId: id }, 'Document deletion requested');

        await this.repo.deleteDocument(id);

        this.logger.info({ documentId: id }, 'Document deleted');

        return { success: true };

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error({ error, documentId: id }, 'Failed to delete document');
        throw error;
      } finally {
        span.end();
      }
    });
  }
}