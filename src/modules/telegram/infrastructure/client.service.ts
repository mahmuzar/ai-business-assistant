import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegram } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';

@Injectable()
export class TelegramClientService {
    private readonly bot: Telegram;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(TelegramClientService.name);
        const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
        
        // Просто инициализируем клиент
        this.bot = new Telegram(token);
    }

    async sendMessage(chatId: number, text: string): Promise<void> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('TelegramClientService.sendMessage', async (span: Span) => {
            span.setAttribute('telegram.chatId', chatId);
            this.logger.debug({ chatId, textLength: text.length }, 'Sending message via Telegraf');

            try {
                await this.bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
                this.logger.debug({ chatId }, 'Message sent successfully');
            } catch (error) {
                recordExceptionSafe(span, error);
                span.setStatus({ code: 2, message: 'Failed to send message' });
                this.logger.error({ chatId, error }, 'Failed to send message via Telegraf');
            } finally {
                span.end();
            }
        });
    }
}