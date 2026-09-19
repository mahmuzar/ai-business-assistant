import { User } from '@modules/users/domain/index.js';
import { UserResponseDto } from '../dto/user.response.dto.js';

export class UserResponseMapper {
    static toDto(user: User): UserResponseDto {
        return {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            status: user.status,
        };
    }
}