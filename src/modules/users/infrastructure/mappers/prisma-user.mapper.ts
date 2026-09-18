import { Injectable } from '@nestjs/common';
import { User } from '@modules/users/domain/index.js';
import { UserMapper, UserRecord } from './user.mapper.js';

@Injectable()
export class PrismaUserMapper implements UserMapper {
    toDomain(record: UserRecord): User {
        // Используем reconstitute, так как это загрузка существующей сущности
        return User.reconstitute({
            id: record.id,
            telegramId: record.telegramId,
            username: record.username ,
            status: record.status,
        });
    }

    toPersistence(user: User): UserRecord {
        return {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username ?? null,
            status: user.status,
        };
    }
}