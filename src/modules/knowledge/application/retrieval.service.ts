import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { KnowledgeRepository } from '../infrastructure/knowledge.repository.js';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';
import { IEmbeddingsService, LOCAL_EMBEDDINGS_SERVICE } from '../../ai/application/embeddings.interface.js';

export interface RetrievedContext {
  content: string;
  source: string;
  similarity: number;
}

@Injectable()
export class RetrievalService {
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MAX_RESULTS = 5;

  constructor(
    private readonly repo: KnowledgeRepository,
    @Inject(LOCAL_EMBEDDINGS_SERVICE) private readonly embeddingsService: IEmbeddingsService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(RetrievalService.name);
  }

  async retrieve(query: string): Promise<RetrievedContext[]> {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('RetrievalService.retrieve', async (span: Span) => {
      try {
        const queryEmbedding = await this.embeddingsService.embedSingle(query);
        span.setAttribute('embedding.dimension', queryEmbedding.length);

        const results = await this.repo.searchSimilar(queryEmbedding, this.MAX_RESULTS);

        const filtered = results.filter(r => Number(r.similarity) >= this.SIMILARITY_THRESHOLD);

        span.setAttribute('results.total', results.length);
        span.setAttribute('results.filtered', filtered.length);

        this.logger.info(
          { queryLength: query.length, totalResults: results.length, filteredResults: filtered.length },
          'Retrieval completed'
        );

        return filtered.map(r => ({
          content: r.content,
          source: r.filename,
          similarity: Number(r.similarity),
        }));

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error({ error }, 'Retrieval failed');
        return [];
      } finally {
        span.end();
      }
    });
  }

  formatContextForPrompt(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) return '';

    const formatted = contexts
      .map(ctx => `[Источник: ${ctx.source}]\n${ctx.content}`)
      .join('\n\n---\n\n');

    return `Используй следующую информацию для ответа на вопрос пользователя. Отвечай ТОЛЬКО на основе предоставленных данных. Если информации недостаточно, скажи: "В моих данных нет информации об этом."\n\n${formatted}`;
  }
}