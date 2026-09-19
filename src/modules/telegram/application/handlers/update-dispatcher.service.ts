import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { UpdateDto } from '../dto/update.dto.js';
import { CommandHandler } from './command-handler.interface.js';
import { StartCommandHandler } from './start-command.handler.js';
import { TextMessageHandler } from './text-message.handler.js';

@Injectable()
export class UpdateDispatcherService {
  private readonly handlers: Map<string, CommandHandler>;

  constructor(
    private readonly logger: PinoLogger,
    private readonly startHandler: StartCommandHandler,
    private readonly textHandler: TextMessageHandler
  ) {
    this.logger.setContext(UpdateDispatcherService.name);
    
    // Регистрируем все доступные команды
    this.handlers = new Map([
      [this.startHandler.command, this.startHandler],
    ]);
  }

  async dispatch(update: UpdateDto): Promise<void> {
    const tracer = trace.getTracer('ai-business-assistant');
    
    return tracer.startActiveSpan('UpdateDispatcherService.dispatch', async (span: Span) => {
      span.setAttribute('telegram.updateId', update.update_id);
      this.logger.info({ updateId: update.update_id }, 'Received Telegram update');

      const message = update.message;
      
      // Игнорируем обновления без текстовых сообщений
      if (!message?.text) {
        span.setAttribute('dispatch.result', 'ignored_no_text');
        this.logger.debug({ updateId: update.update_id }, 'Ignoring non-text update');
        return;
      }

      const text = message.text.trim();
      const handler = this.handlers.get(text);

      try {
        if (handler) {
          span.setAttribute('dispatch.result', 'handled');
          span.setAttribute('telegram.command', text);
          this.logger.info({ command: text }, 'Dispatching to command handler');
          
          // Вызываем хендлер. Его собственный спан станет дочерним этого спана.
          await handler.handle(update);
        } else {
          span.setAttribute('dispatch.result', 'unknown_command');
          this.logger.info({ text }, 'Received unknown command or plain text');
          await this.textHandler.handle(update);
        }
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2, message: 'Dispatch failed' });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}