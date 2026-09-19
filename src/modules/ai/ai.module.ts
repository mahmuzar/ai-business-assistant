import { Module } from '@nestjs/common';
import { GigaChatService } from './infrastructure/gigachat.service.js';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, ConfigModule, HttpModule],
  providers: [GigaChatService],
  exports: [GigaChatService],
})
export class AiModule {}