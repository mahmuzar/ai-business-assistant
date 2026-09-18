import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module.js';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { getOtelContext } from './shared/logging/otel-context.js'; // <-- Импорт утилиты

const __dirname = fileURLToPath(new URL('.', import.meta.url));

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // mixin вызывается синхронно при каждом логе в основном потоке
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
        // hooks.logMethod удален, так как mixin делает то же самое надежнее
      },
    }),
    UsersModule,
  ],
})
export class AppModule {}