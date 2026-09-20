import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module.js';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { getOtelContext } from './shared/logging/otel-context.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { TelegramModule } from '@modules/telegram/telegram.module.js';
import { KnowledgeModule } from './modules/knowledge/knowledge.module.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.local',
        '.env',
      ],
      cache: true,
      validate: undefined,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        mixin: () => getOtelContext(),

        transport: {
          targets: [
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                messageFormat: '{msg} [trace={trace_id} span={span_id}]',
                customPrettifiers: {
                  'req.headers.x-trace-id': join(__dirname, '../logging/trace-prettifier.js')
                }
              }
            },
            {
              target: 'pino-loki',
              options: {
                host: 'http://localhost:3100',
                batching: true,
                interval: 5,
                labels: { app: 'ai-business-assistant' }
              }
            }
          ]
        },
        level: 'info',
      },
    }),
    DatabaseModule,
    UsersModule,
    TelegramModule,
    KnowledgeModule,
  ],
})
export class AppModule { }