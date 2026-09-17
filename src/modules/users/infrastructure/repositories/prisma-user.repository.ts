import { Result } from '@shared/kernel/index.js';
import { User } from '../../domain/user.js';
import { UserRepository } from '../../domain/user.repository.js';

export class PrismaUserRepository implements UserRepository {
  async findById(_id: string): Promise<Result<User | null>> {
    return Result.success(null);
  }

  async findByTelegramId(_telegramId: number): Promise<Result<User | null>> {
    return Result.success(null);
  }

  async save(user: User): Promise<Result<void>> {
    console.log(`Saving user ${user.id} to database...`);
    return Result.success(undefined);
  }

  async delete(_id: string): Promise<Result<void>> {
    return Result.success(undefined);
  }
}