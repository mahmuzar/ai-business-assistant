import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { TelegramClientService } from '../../infrastructure/client.service.js';
import { CommandHandler } from './command-handler.interface.js';
import { UpdateDto } from '../dto/update.dto.js';
import { recordExceptionSafe } from '../../../../common/utils/trace.utils.js';

@Injectable()
export class TextMessageHandler implements CommandHandler {
  // Специальный ключ для обозначения "любой текст"
  command = '__TEXT__';

  constructor(
    private readonly telegramClient: TelegramClientService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(TextMessageHandler.name);
  }

  async handle(update: UpdateDto): Promise<void> {
    const message = update.message;
    if (!message?.from || !message.text) return;

    const telegramId = message.from.id;
    const text = message.text;

    const tracer = trace.getTracer('ai-business-assistant');

    return tracer.startActiveSpan('TextMessageHandler.handle', async (span: Span) => {
      span.setAttribute('telegram.chatId', telegramId);
      span.setAttribute('message.length', text.length);

      this.logger.info({ telegramId, textLength: text.length }, 'Processing text message');

      try {
        // Пока заглушка. Позже здесь будет вызов GigaChatService
        const responseText = `Я получил ваше сообщение:\n\n«${text}»\n\nСкоро я научусь отвечать на вопросы с помощью AI. А пока попробуйте команду /start`;

        await this.telegramClient.sendMessage(telegramId, responseText);
        this.logger.info({ telegramId }, 'Text response sent');

      } catch (error) {
        recordExceptionSafe(span, error);
        span.setStatus({ code: 2, message: 'Failed to send text response' });
        this.logger.error({ telegramId, error }, 'Failed to process text message');
      } finally {
        span.end();
      }
    });
  }
}