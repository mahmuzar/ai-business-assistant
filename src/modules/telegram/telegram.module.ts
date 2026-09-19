import { Module } from '@nestjs/common';
import { WebhookController } from './presentation/controllers/webhook.controller.js';
import { UpdateDispatcherService } from './application/handlers/update-dispatcher.service.js';
import { StartCommandHandler } from './application/handlers/start-command.handler.js';
import { TelegramClientService } from './infrastructure/client.service.js';
import { UsersModule } from '@modules/users/users.module.js';
import { TextMessageHandler } from './application/handlers/text-message.handler.js';
import { AiModule } from '@modules/ai/ai.module.js';

@Module({
  imports: [UsersModule, AiModule],
  controllers: [WebhookController],
  providers: [
    UpdateDispatcherService,
    StartCommandHandler,
    TelegramClientService,
    TextMessageHandler,
  ],
})
export class TelegramModule {}