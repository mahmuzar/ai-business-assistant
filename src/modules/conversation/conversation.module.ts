import { Module } from '@nestjs/common';
import { ConversationRepository } from './infrastructure/conversation.repository.js';
import { ConversationService } from './application/conversation.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [ConversationRepository, ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}