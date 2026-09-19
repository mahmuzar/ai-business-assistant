import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace } from '@opentelemetry/api';
import { Result } from '@shared/kernel/index.js';
import { User, UserRepository } from '@modules/users/domain/index.js';
import { UserService } from '@modules/users/application/index.js';
import { USER_REPOSITORY } from '@modules/users/domain/user.repository.token.js';

@Injectable()
export class UserServiceImpl implements UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(UserServiceImpl.name);
  }

  async getUserById(id: string): Promise<Result<User | null>> {
    const result = await this.userRepository.findById(id);

    if (result.isFailure() || !result.getValue()) {
      return Result.failure('User not found');
    }

    return Result.success(result.getValue());
  }
  async registerUser(telegramId: number, username?: string): Promise<Result<User>> {
    const tracer = trace.getTracer('ai-business-assistant');
    const span = tracer.startSpan('UserServiceImpl.registerUser');

    try {
      span.setAttribute('user.telegramId', telegramId);
      if (username) span.setAttribute('user.username', username);

      this.logger.info({ telegramId, username }, 'Starting user registration process');

      // 1. Проверка на существование
      const existingResult = await this.userRepository.findByTelegramId(telegramId);

      if (existingResult.isOk() && existingResult.getValue()) {
        this.logger.warn({ telegramId }, 'Registration failed: user already exists');
        return Result.failure('User with this Telegram ID already exists');
      }

      // 2. Создание доменной сущности
      const newUserResult = User.create({
        id: crypto.randomUUID(),
        telegramId,
        username,
        status: 'active',
      });

      if (newUserResult.isErr()) {
        this.logger.error({ error: newUserResult.getError(), telegramId }, 'Domain validation failed');
        return Result.failure(newUserResult.getError() || 'Failed to create user');
      }

      const user = newUserResult.unwrap();

      // 3. Сохранение
      this.logger.info({ userId: user.id }, 'Saving new user to repository');
      await this.userRepository.save(user);

      this.logger.info({ userId: user.id, telegramId }, 'User successfully registered and saved');
      return Result.success(user);

    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
}