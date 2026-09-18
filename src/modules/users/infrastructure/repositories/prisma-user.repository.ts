import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace } from '@opentelemetry/api';
import { Result } from '@shared/kernel/index.js';
import { User, UserRepository } from '@modules/users/domain/index.js';
import { PrismaUserMapper } from '@modules/users/index.js';
import { UserRecord } from '../mappers/user.mapper.js';
import { PrismaService } from '../../../../database/prisma.service.js';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly mapper: PrismaUserMapper
  ) {
    this.logger.setContext(PrismaUserRepository.name);
  }

  private mapToDomain(record: UserRecord): User {
    return User.reconstitute({
      id: record.id,
      telegramId: record.telegramId,
      username: record.username, // null из БД -> undefined для домена
      status: record.status,
    });
  }

  async save(user: User): Promise<Result<void>> {
    const tracer = trace.getTracer('ai-business-assistant');
    const span = tracer.startSpan('PrismaUserRepository.save');

    try {
      span.setAttribute('user.id', user.id);
      this.logger.info({ userId: user.id }, 'Saving user to database');

      const data = this.mapper.toPersistence(user);
      await this.prisma.user.create({ data: data });

      return Result.success(undefined);
    } catch (error) {
      span.recordException(error as Error);
      this.logger.error({ error, userId: user.id }, 'Failed to save user');
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

      const record = await this.prisma.user.findUnique({ where: { id } });

      if (!record) return Result.success(null);

      return Result.success(this.mapToDomain(record));
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

      const record = await this.prisma.user.findUnique({ where: { telegramId } });

      if (!record) return Result.success(null);

      return Result.success(this.mapToDomain(record));
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

      await this.prisma.user.delete({ where: { id } });

      return Result.success(undefined);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
}