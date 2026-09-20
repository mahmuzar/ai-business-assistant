import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace, Span } from '@opentelemetry/api';
import { ConversationRepository, ChatMessage } from '../infrastructure/conversation.repository.js';
import { recordExceptionSafe } from '../../../common/utils/trace.utils.js';
import { UserService } from '@modules/users/index.js';
import { USER_SERVICE_TOKEN } from '@modules/users/application/user.service.token.js';

@Injectable()
export class ConversationService {
    private readonly HISTORY_LIMIT = 10;

    constructor(
        private readonly repo: ConversationRepository,
        @Inject(USER_SERVICE_TOKEN) private readonly usersService: UserService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ConversationService.name);
    }

    async getContextAndSave(
        telegramId: number,
        userMessage: string
    ): Promise<{ conversationId: string; history: ChatMessage[] }> {
        const tracer = trace.getTracer('ai-business-assistant');

        return tracer.startActiveSpan('ConversationService.getContextAndSave', async (span: Span) => {
            try {
                // Находим или создаём пользователя
                const user = (await this.usersService.findByTelegramId(telegramId)).getValue();
                if (!user) {
                    throw new Error(`User not found for telegramId: ${telegramId}`);
                }

                // Находим или создаём активный диалог
                const conversationId = await this.repo.findOrCreateActive(user.id, telegramId);

                // Сохраняем сообщение пользователя
                await this.repo.saveMessage(conversationId, 'USER', userMessage);

                // Загружаем историю (включая только что сохранённое сообщение)
                const history = await this.repo.getRecentMessages(conversationId, this.HISTORY_LIMIT);

                span.setAttribute('conversation.id', conversationId);
                span.setAttribute('history.length', history.length);

                this.logger.debug(
                    { conversationId, historyLength: history.length },
                    'Conversation context loaded'
                );

                return { conversationId, history };

            } catch (error) {
                recordExceptionSafe(span, error);
                this.logger.error({ error }, 'Failed to get conversation context');
                throw error;
            } finally {
                span.end();
            }
        });
    }

    async saveAssistantResponse(conversationId: string, response: string): Promise<void> {
        await this.repo.saveMessage(conversationId, 'ASSISTANT', response);
    }

    async resetConversation(telegramId: number): Promise<void> {
        const user = (await this.usersService.findByTelegramId(telegramId)).getValue();
        if (!user) return;

        const conversationId = await this.repo.findOrCreateActive(user.id, telegramId);
        await this.repo.endConversation(conversationId);
        this.logger.info({ telegramId }, 'Conversation reset');
    }
}