import { Injectable } from '@nestjs/common';
import { Span, trace } from '@opentelemetry/api';
import { PinoLogger } from 'nestjs-pino';

export interface TextChunk {
  content: string;
  order: number;
}

@Injectable()
export class ChunkingService {
  private readonly CHUNK_SIZE = 800;
  private readonly OVERLAP = 100;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ChunkingService.name);
  }

  chunkText(text: string): TextChunk[] {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('ChunkingService.chunkText', (span: Span) => {
      span.setAttribute('text.length', text.length);
      span.setAttribute('chunk.size', this.CHUNK_SIZE);
      span.setAttribute('chunk.overlap', this.OVERLAP);

      const chunks: TextChunk[] = [];
      let start = 0;
      let order = 0;

      while (start < text.length) {
        const end = Math.min(start + this.CHUNK_SIZE, text.length);

        // Если дошли до конца текста — берём остаток целиком
        if (end >= text.length) {
          const content = text.slice(start).trim();
          if (content.length > 0) {
            chunks.push({ content, order });
            order++;
          }
          break;
        }

        // Ищем точку разрыва
        let splitPoint = end;
        const lastPeriod = text.lastIndexOf('. ', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);

        const bestSplit = Math.max(lastPeriod, lastNewline, lastSpace);
        if (bestSplit > start + this.CHUNK_SIZE * 0.5) {
          splitPoint = bestSplit + 1;
        }

        const content = text.slice(start, splitPoint).trim();
        if (content.length > 0) {
          chunks.push({ content, order });
          order++;
        }

        // Сдвиг вперёд с учётом overlap, но гарантируем прогресс
        const nextStart = splitPoint - this.OVERLAP;
        start = Math.max(nextStart, start + 1); // минимум +1 чтобы не застрять
      }

      span.setAttribute('chunks.count', chunks.length);
      this.logger.info({ totalChunks: chunks.length, textLength: text.length }, 'Text chunked');

      span.end();
      return chunks;
    });
  }
}