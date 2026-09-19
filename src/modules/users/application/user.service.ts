import { Result } from '@shared/kernel/index.js';
import { User } from '../domain/user.js';

export interface UserService {
    /**
     * Регистрирует нового пользователя.
     */
    registerUser(telegramId: number, username?: string): Promise<Result<User>>;

    /**
     * Ищет пользователя по его Telegram ID.
     */
    findByTelegramId(telegramId: number): Promise<Result<User | null>>;

    /**
     * Получает пользователя по внутреннему UUID.
     */
    getUserById(id: string): Promise<Result<User | null>>;
}