import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { trace, Span } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Injectable()
export class GigaChatService {
    private readonly baseUrl: string;
    private readonly authUrl: string;
    private readonly authKey: string;
    private readonly scope: string;
    private readonly model: string;
    private readonly httpsAgent: https.Agent;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(GigaChatService.name);

        this.baseUrl = this.configService.getOrThrow<string>('GIGACHAT_BASE_URL');
        this.authUrl = this.configService.getOrThrow<string>('GIGACHAT_AUTH_URL');
        this.authKey = this.configService.getOrThrow<string>('GIGACHAT_AUTH_KEY');
        this.scope = this.configService.get<string>('GIGACHAT_SCOPE', 'GIGACHAT_API_PERS');
        this.model = this.configService.get<string>('GIGACHAT_MODEL', 'GigaChat-Max');

        // Загружаем сертификат Сбера
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const certPath = path.resolve(__dirname, '../certs/russian_trusted_root_ca.cer');

        try {
            const caCert = fs.readFileSync(certPath);
            this.httpsAgent = new https.Agent({ ca: caCert });
            this.logger.info('Russian Trusted Root CA certificate loaded');
        } catch (error) {
            this.logger.warn('Failed to load CA certificate, falling back to rejectUnauthorized: false');
            this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
        }
    }

    async chat(userMessage: string, history: Array<{ role: string; content: string }> = []): Promise<string> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('GigaChatService.chat', async (span: Span) => {
            span.setAttribute('ai.model', this.model);
            span.setAttribute('message.length', userMessage.length);
            span.setAttribute('history.length', history.length);

            this.logger.info({ model: this.model, historyLength: history.length }, 'Sending request to GigaChat');

            try {
                const token = await this.getAccessToken();

                // Формируем сообщения: system + история + текущее сообщение
                const systemMessage = {
                    role: 'system',
                    content: 'Вы - профессиональный AI-ассистент для бизнеса. Отвечайте кратко и по делу.'
                };

                // Если история уже содержит текущее сообщение (из ConversationService),
                // используем историю как есть. Иначе добавляем.
                const lastMessage = history.length > 0 ? history[history.length - 1] : undefined;

                const messages = lastMessage && lastMessage.content === userMessage
                    ? [systemMessage, ...history]
                    : [systemMessage, ...history, { role: 'user', content: userMessage }];
                    
                const response = await firstValueFrom(
                    this.httpService.post(
                        `${this.baseUrl}/chat/completions`,
                        {
                            model: this.model,
                            messages,
                            temperature: Number(this.configService.get('GIGACHAT_TEMPERATURE', 0.7)),
                            max_tokens: Number(this.configService.get('GIGACHAT_MAX_TOKENS', 4096)),
                            stream: false,
                            repetition_penalty: 1,
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            timeout: Number(this.configService.get('GIGACHAT_TIMEOUT_MS', 30000)),
                            httpsAgent: this.httpsAgent,
                        }
                    )
                );

                const aiResponse = response.data.choices?.[0]?.message?.content || 'Не удалось получить ответ от AI.';

                span.setAttribute('response.length', aiResponse.length);
                this.logger.info({ responseLength: aiResponse.length }, 'Received response from GigaChat');

                return aiResponse;

            } catch (error) {

                recordExceptionSafe(span, error);
                span.setStatus({ code: 2, message: 'GigaChat request failed' });
                this.logger.error({ error }, 'Failed to get response from GigaChat');
                return 'Извините, произошла ошибка при обращении к AI. Попробуйте позже.';
            } finally {
                span.end();
            }
        });
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 120000) {
            return this.accessToken;
        }

        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('GigaChatService.getAccessToken', async (span: Span) => {
            span.setAttribute('gigachat.auth_url', this.authUrl);
            span.setAttribute('gigachat.scope', this.scope);

            this.logger.debug('Requesting new GigaChat access token');

            try {
                const rqUid = uuidv4();
                span.setAttribute('gigachat.rq_uid', rqUid);

                const response = await firstValueFrom(
                    this.httpService.post(
                        this.authUrl,
                        new URLSearchParams({ scope: this.scope }).toString(),
                        {
                            headers: {
                                'Authorization': `Basic ${this.authKey}`,
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept': 'application/json',
                                'RqUID': rqUid,
                            },
                            httpsAgent: this.httpsAgent,
                        }
                    )
                );

                this.accessToken = response.data.access_token;
                this.tokenExpiresAt = response.data.expires_at;

                span.setAttribute('gigachat.token_received', true);
                span.setAttribute('gigachat.expires_at', new Date(this.tokenExpiresAt).toISOString());

                this.logger.debug(
                    { expiresAt: new Date(this.tokenExpiresAt).toISOString() },
                    'New GigaChat access token received'
                );

                return this.accessToken!;

            } catch (error) {
                recordExceptionSafe(span, error);
                span.setStatus({ code: 2, message: 'Failed to obtain GigaChat access token' });
                this.logger.error({ error }, 'Failed to obtain GigaChat access token');
                throw error;
            } finally {
                span.end();
            }
        });
    }
}