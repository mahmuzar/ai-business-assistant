import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { UserService } from '../../../users/application/user.service.js';
import { TelegramClientService } from '../../infrastructure/client.service.js';
import { CommandHandler } from './command-handler.interface.js';
import { UpdateDto } from '../dto/update.dto.js';
import { recordExceptionSafe } from '../../../../common/utils/trace.utils.js';
import { USER_SERVICE_TOKEN } from '../../../users/application/user.service.token.js';

@Injectable()
export class StartCommandHandler implements CommandHandler {
    command = '/start';

    constructor(
        @Inject(USER_SERVICE_TOKEN) private readonly userService: UserService,
        private readonly telegramClient: TelegramClientService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(StartCommandHandler.name);
    }

    async handle(update: UpdateDto): Promise<void> {
        const message = update.message;
        if (!message?.from) return;

        const telegramId = message.from.id;
        const username = message.from.username;

        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('StartCommandHandler.handle', async (span: Span) => {
            span.setAttribute('telegram.command', '/start');
            span.setAttribute('user.telegramId', telegramId);

            this.logger.info({ telegramId, username }, 'Processing /start command');

            try {
                // 1. Сначала ищем пользователя
                const findResult = await this.userService.findByTelegramId(telegramId);
                let user = findResult.getValue();
                let isNewUser = false;

                if (findResult.isSuccess() && user) {
                    if (user.id === undefined) {
                        throw new Error('Пользователь без идентификатора');
                    }

                    span.setAttribute('user.action', 'found_existing');
                    span.setAttribute('user.id', user.id);
                    this.logger.info({ userId: user.id, telegramId }, 'Existing user started the bot');
                } else {
                    // 2. Если не нашли — регистрируем
                    span.setAttribute('user.action', 'registering_new');
                    this.logger.info({ telegramId }, 'New user detected, registering...');

                    const registerResult = await this.userService.registerUser(telegramId, username);

                    if (registerResult.isSuccess()) {
                        user = registerResult.getValue();
                        isNewUser = true;

                        const userId = user?.id || 'unknown-id';
                        span.setAttribute('user.id', userId);
                        this.logger.info({ userId, telegramId }, 'New user registered successfully');
                    } else {
                        const error = registerResult.getError();
                        if (error) {
                            recordExceptionSafe(span, error);
                            span.setStatus({ code: 2, message: 'Registration failed' });
                            this.logger.error({ error, telegramId }, 'Failed to register new user');
                        }
                        return; // Прерываем, если регистрация не удалась
                    }
                }

                // 3. Отправляем приветственное сообщение
                const welcomeText = isNewUser
                    ? `👋 Привет, ${username || 'друг'}! Добро пожаловать в AI Business Assistant.\n\nЯ помогу тебе автоматизировать бизнес и управлять лидами. Просто напиши свой вопрос!`
                    : `👋 С возвращением! Чем могу помочь сегодня?`;

                await this.telegramClient.sendMessage(telegramId, welcomeText);
                this.logger.info({ telegramId, isNewUser }, 'Welcome message sent successfully');

            } catch (error) {
                recordExceptionSafe(span, error);
                span.setStatus({ code: 2, message: (error as Error).message });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}