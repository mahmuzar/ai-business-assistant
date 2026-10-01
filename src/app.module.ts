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
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import './common/metrics/index.js';
import { HealthModule } from './common/health/health.module.js';

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
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true }, // Включает стандартные метрики Node.js (CPU, RAM, GC)
    }),
    HealthModule,
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
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
    DatabaseModule,
    UsersModule,
    TelegramModule,
    KnowledgeModule,
  ],
})
export class AppModule { }