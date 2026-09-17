import { Result } from '@shared/kernel/index.js';
import { User, UserRepository } from '@modules/users/domain/index.js';

export class FakeUserRepository implements UserRepository {
    private users: Map<string, User> = new Map();

    async findById(id: string): Promise<Result<User | null>> {
        const user = this.users.get(id);
        return Result.success(user || null);
    }

    async findByTelegramId(telegramId: number): Promise<Result<User | null>> {
        // Ищем пользователя по Telegram ID среди всех сохраненных
        const user = Array.from(this.users.values()).find(
            (u) => u.telegramId === telegramId
        );
        return Result.success(user || null);
    }

    async save(user: User): Promise<Result<void>> {
        this.users.set(user.id, user);
        return Result.success(undefined);
    }

    async delete(id: string): Promise<Result<void>> {
        this.users.delete(id);
        return Result.success(undefined);
    }

    // Вспомогательный метод для очистки между тестами
    clear(): void {
        this.users.clear();
    }
}