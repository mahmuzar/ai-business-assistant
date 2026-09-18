import { User } from "@modules/users/domain/index.js";

/**
 * Техническая модель записи в PostgreSQL.
 * Не является DTO. Не используется вне infrastructure слоя.
 */
export interface UserRecord {
    id: string;
    telegramId: number;
    username: string | null; // В БД нет undefined, только null
    status: string;
}

export interface UserMapper {
    toDomain(record: any): User;
    toPersistence(user: User): UserRecord;
}