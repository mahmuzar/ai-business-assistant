import { Injectable, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Injectable()
export class FileParserService {
  private readonly ALLOWED_TYPES = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(FileParserService.name);
  }

  validateFile(file: Express.Multer.File): void {
    const tracer = trace.getTracer('ai-business-assistant');

    tracer.startActiveSpan('FileParserService.validateFile', (span: Span) => {
      try {
        span.setAttribute('file.mimetype', file.mimetype);
        span.setAttribute('file.size', file.size);

        if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
          const error = new BadRequestException(
            `Неподдерживаемый формат: ${file.mimetype}. Допустимы: TXT, PDF, DOCX`
          );
          recordExceptionSafe(span, error);
          this.logger.warn({ mimetype: file.mimetype }, 'Unsupported file type');
          throw error;
        }

        this.logger.debug({ mimetype: file.mimetype, size: file.size }, 'File validated');
      } finally {
        span.end();
      }
    });
  }

  async extractText(file: Express.Multer.File): Promise<string> {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('FileParserService.extractText', async (span: Span) => {
      try {
        span.setAttribute('file.mimetype', file.mimetype);
        span.setAttribute('file.originalname', file.originalname);

        if (file.mimetype === 'text/plain') {
          const text = file.buffer.toString('utf-8');
          span.setAttribute('text.length', text.length);
          this.logger.info({ filename: file.originalname, textLength: text.length }, 'Text extracted from TXT file');
          return text;
        }

        const error = new BadRequestException('PDF и DOCX будут поддержаны в следующей версии');
        recordExceptionSafe(span, error);
        this.logger.warn({ mimetype: file.mimetype }, 'Unsupported format for text extraction');
        throw error;

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error({ error, filename: file.originalname }, 'Failed to extract text from file');
        throw error;
      } finally {
        span.end();
      }
    });
  }
}