import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { IEmbeddingsService } from '../application/embeddings.interface.js';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Injectable()
export class LocalEmbeddingsService implements IEmbeddingsService, OnModuleInit {
  private extractor: FeatureExtractionPipeline | null = null;
  private readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LocalEmbeddingsService.name);
  }

  async onModuleInit(): Promise<void> {
    const tracer = trace.getTracer('ai-business-assistant');

    await tracer.startActiveSpan('LocalEmbeddingsService.init', async (span: Span) => {
      try {
        this.logger.info({ model: this.MODEL_NAME }, 'Loading local embeddings model...');

        this.extractor = await pipeline('feature-extraction', this.MODEL_NAME, {
          progress_callback: (progress: { status: string; progress?: number }) => {
            if (progress.status === 'progress' && progress.progress) {
              this.logger.debug({ progress: Math.round(progress.progress) }, 'Model loading');
            }
          },
        });

        span.setAttribute('model.loaded', true);
        span.setAttribute('model.name', this.MODEL_NAME);
        this.logger.info({ model: this.MODEL_NAME }, 'Local embeddings model loaded successfully');

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error({ error, model: this.MODEL_NAME }, 'Failed to load local embeddings model');
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('LocalEmbeddings.embedTexts', async (span: Span) => {
      span.setAttribute('embedding.model', this.MODEL_NAME);
      span.setAttribute('texts.count', texts.length);

      try {
        if (!this.extractor) {
          throw new Error('Embeddings model not loaded');
        }

        this.logger.debug({ textsCount: texts.length }, 'Generating local embeddings');

        const results: number[][] = [];

        for (const text of texts) {
          const output = await this.extractor(text, {
            pooling: 'mean',
            normalize: true,
          });

          const embedding = Array.from(output.data as Float32Array);
          results.push(embedding);
        }

        span.setAttribute('embeddings.count', results.length);
        span.setAttribute('embedding.dimension', results[0]?.length || 0);

        this.logger.info(
          { count: results.length, dimension: results[0]?.length },
          'Local embeddings generated'
        );

        return results;

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error({ error }, 'Failed to generate local embeddings');
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async embedSingle(text: string): Promise<number[]> {
    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('LocalEmbeddings.embedSingle', async (span: Span) => {
      try {
        span.setAttribute('text.length', text.length);

        const results = await this.embedTexts([text]);
        const embedding = results[0];

        if (!embedding) {
          throw new Error('Failed to generate embedding: empty result');
        }

        return embedding;

      } catch (error) {
        recordExceptionSafe(span, error);
        this.logger.error({ error }, 'Failed to generate single local embedding');
        throw error;
      } finally {
        span.end();
      }
    });
  }
}