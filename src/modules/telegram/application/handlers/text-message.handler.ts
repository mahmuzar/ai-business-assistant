import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { TelegramClientService } from '../../infrastructure/client.service.js';
import { GigaChatService } from '../../../ai/infrastructure/gigachat.service.js';
import { ConversationService } from '../../../conversation/application/conversation.service.js';
import { CommandHandler } from './command-handler.interface.js';
import { UpdateDto } from '../dto/update.dto.js';
import { recordExceptionSafe } from '../../../../common/utils/trace.utils.js';

@Injectable()
export class TextMessageHandler implements CommandHandler {
  command = '__TEXT__';

  constructor(
    private readonly telegramClient: TelegramClientService,
    private readonly gigaChatService: GigaChatService,
    private readonly conversationService: ConversationService,
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
        // Загружаем контекст диалога и сохраняем сообщение
        const conservation = await this.conversationService.getContextAndSave(telegramId, text);

        // Отправляем историю в GigaChat
        const aiResponse = await this.gigaChatService.chat(text, conservation.history);

        // Сохраняем ответ AI
        await this.conversationService.saveAssistantResponse(conservation.conversationId, aiResponse);

        span.setAttribute('response.length', aiResponse.length);
        this.logger.info({ telegramId, responseLength: aiResponse.length }, 'AI response received');

        // Отправляем ответ пользователю
        await this.telegramClient.sendMessage(telegramId, aiResponse);
        this.logger.info({ telegramId }, 'AI response sent to user');

      } catch (error) {
        recordExceptionSafe(span, error);
        span.setStatus({ code: 2, message: 'Failed to process text message' });
        this.logger.error({ telegramId, error }, 'Failed to process text message');

        try {
          await this.telegramClient.sendMessage(
            telegramId,
            'Извините, произошла ошибка при обработке запроса. Попробуйте позже.'
          );
        } catch (sendError) {
          this.logger.error({ telegramId, error: sendError }, 'Failed to send error message');
        }
      } finally {
        span.end();
      }
    });
  }
}