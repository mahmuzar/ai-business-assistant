import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace } from '@opentelemetry/api';
import { Result } from '@shared/kernel/index.js';
import { User } from '@modules/users/domain/user.js';
import { UserRepository } from '@modules/users/domain/user.repository.js';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(PrismaUserRepository.name);
  }

  async save(user: User): Promise<Result<void>> {
    const tracer = trace.getTracer('ai-business-assistant');
    const span = tracer.startSpan('PrismaUserRepository.save');

    try {
      // Обогащаем спан контекстом для Jaeger
      span.setAttribute('user.id', user.id);

      this.logger.info({ userId: user.id }, 'Saving user to database');

      // TODO: Здесь будет реальный вызов Prisma
      // await this.prisma.user.create(...)

      return Result.success(undefined);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async findById(id: string): Promise<Result<User | null>> {
    const tracer = trace.getTracer('ai-business-assistant');
    const span = tracer.startSpan('PrismaUserRepository.findById');

    try {
      span.setAttribute('user.id', id);
      this.logger.debug({ userId: id }, 'Finding user by ID');

      // TODO: Реальная логика поиска

      return Result.success(null);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async findByTelegramId(telegramId: number): Promise<Result<User | null>> {
    const tracer = trace.getTracer('ai-business-assistant');
    const span = tracer.startSpan('PrismaUserRepository.findByTelegramId');

    try {
      span.setAttribute('user.telegramId', telegramId);
      this.logger.debug({ telegramId }, 'Finding user by Telegram ID');

      // TODO: Реальная логика поиска

      return Result.success(null);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async delete(id: string): Promise<Result<void>> {
    const tracer = trace.getTracer('ai-business-assistant');
    const span = tracer.startSpan('PrismaUserRepository.delete');

    try {
      span.setAttribute('user.id', id);
      this.logger.info({ userId: id }, 'Deleting user');

      // TODO: Реальная логика удаления

      return Result.success(undefined);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
}