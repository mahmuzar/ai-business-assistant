import { Injectable } from '@nestjs/common';
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
    const chunks: TextChunk[] = [];
    let start = 0;
    let order = 0;

    while (start < text.length) {
      const end = Math.min(start + this.CHUNK_SIZE, text.length);

      let splitPoint = end;
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('. ', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);

        const bestSplit = Math.max(lastPeriod, lastNewline, lastSpace);
        if (bestSplit > start + this.CHUNK_SIZE * 0.5) {
          splitPoint = bestSplit + 1;
        }
      }

      const content = text.slice(start, splitPoint).trim();
      if (content.length > 0) {
        chunks.push({ content, order });
        order++;
      }

      start = splitPoint - this.OVERLAP;
      if (start >= end) {
        start = end;
      }
    }

    this.logger.info({ totalChunks: chunks.length, textLength: text.length }, 'Text chunked');
    return chunks;
  }
}