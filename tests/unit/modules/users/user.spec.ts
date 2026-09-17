import { User } from "@modules/users/index.js";

describe('User', () => {
    it('should create a user with valid data', () => {
        const result = User.create({
            id: 'user-123',
            telegramId: 123456789,
            username: 'mahmuzar',
            status: 'active',
        });

        expect(result.isOk()).toBe(true);
        expect(result.unwrap().id).toBe('user-123');
        expect(result.unwrap().telegramId).toBe(123456789);
    });

    it('should fail if telegramId is missing', () => {
        // Используем as any, чтобы намеренно передать неполные данные для теста валидации
        const result = User.create({
            id: 'user-123',
            username: 'mahmuzar',
            status: 'active',
        } as any);

        expect(result.isErr()).toBe(true);
        expect(result.getError()).toBe('Telegram ID is required');
    });
});