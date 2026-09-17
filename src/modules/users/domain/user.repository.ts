import { Result } from '@shared/kernel/index.js';
import { User } from './user.js';

export interface UserRepository {
  findById(id: string): Promise<Result<User | null>>;
  findByTelegramId(telegramId: number): Promise<Result<User | null>>;
  save(user: User): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}