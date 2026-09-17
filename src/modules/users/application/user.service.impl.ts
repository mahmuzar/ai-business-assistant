import { Inject, Injectable } from '@nestjs/common';
import { Result } from '@shared/kernel/index.js';
import { User } from '../domain/user.js';
import { UserRepository } from '../domain/user.repository.js';
import { UserService } from './user.service.js';
import { USER_REPOSITORY } from '../domain/user.repository.token.js'; // Импортируем токен

@Injectable()
export class UserServiceImpl implements UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository // <-- Добавили @Inject
  ) {}

  async registerUser(telegramId: number, username?: string): Promise<Result<User>> {
    const existingResult = await this.userRepository.findByTelegramId(telegramId);
    if (existingResult.isOk() && existingResult.getValue()) {
      return Result.failure('User with this Telegram ID already exists');
    }

    const newUserResult = User.create({
      id: crypto.randomUUID(),
      telegramId,
      username,
      status: 'active',
    });

    if (newUserResult.isErr()) {
      return Result.failure(newUserResult.getError() || 'Failed to create user');
    }

    const user = newUserResult.unwrap();
    await this.userRepository.save(user);
    
    return Result.success(user);
  }
}