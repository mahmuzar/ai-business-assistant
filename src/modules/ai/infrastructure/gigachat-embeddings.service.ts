import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import https from 'https';
import { trace, Span } from '@opentelemetry/api';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';
import { IEmbeddingsService } from '../application/embeddings.interface.js';

@Injectable()
export class GigaChatEmbeddingsService implements IEmbeddingsService {
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly httpsAgent: https.Agent;
    private cachedToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(GigaChatEmbeddingsService.name);
        this.baseUrl = this.configService.get<string>('GIGACHAT_BASE_URL')!;
        this.model = this.configService.get<string>('GIGACHAT_EMBEDDING_MODEL', 'Embeddings-GigaChat');

        this.httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });
    }

    async embedTexts(texts: string[]): Promise<number[][]> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('GigaChatEmbeddings.embedTexts', async (span: Span) => {
            span.setAttribute('embedding.model', this.model);
            span.setAttribute('texts.count', texts.length);

            try {
                const token = await this.getAccessToken();

                const response = await firstValueFrom(
                    this.httpService.post(
                        `${this.baseUrl}/embeddings`,
                        {
                            model: this.model,
                            input: texts,
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            httpsAgent: this.httpsAgent,
                            timeout: 60000,
                        }
                    )
                );

                const embeddings: number[][] = response.data.data.map(
                    (item: { embedding: number[] }) => item.embedding
                );

                span.setAttribute('embeddings.count', embeddings.length);
                span.setAttribute('embedding.dimension', embeddings[0]?.length || 0);

                this.logger.info(
                    { count: embeddings.length, dimension: embeddings[0]?.length },
                    'Embeddings generated'
                );

                return embeddings;

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error }, 'Failed to generate embeddings');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async embedSingle(text: string): Promise<number[]> {
        const results = await this.embedTexts([text]);
        const embedding = results[0];
        if (!embedding) {
            throw new Error('Failed to generate embedding: empty response');
        }
        return embedding;
    }

    private async getAccessToken(): Promise<string> {
        if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
            return this.cachedToken;
        }

        const authUrl = this.configService.get<string>('GIGACHAT_AUTH_URL')!;
        const authKey = this.configService.get<string>('GIGACHAT_AUTH_KEY')!;
        const scope = this.configService.get<string>('GIGACHAT_SCOPE', 'GIGACHAT_API_PERS');

        const response = await firstValueFrom(
            this.httpService.post(
                authUrl,
                `scope=${scope}`,
                {
                    headers: {
                        'Authorization': `Basic ${authKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'RqUID': crypto.randomUUID(),
                    },
                    httpsAgent: this.httpsAgent,
                }
            )
        );

        this.cachedToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + (response.data.expires_at
            ? (response.data.expires_at * 1000 - Date.now() - 300000)
            : 25 * 60 * 1000);
        if (!this.cachedToken) {
            throw new Error('Failed to obtain access token from GigaChat');
        }

        return this.cachedToken;
    }
}