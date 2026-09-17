import { UserServiceImpl } from '@modules/users/application/index.js';
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';


class RegisterUserDto {
    telegramId!: number;
    username?: string;
}

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserServiceImpl) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterUserDto) {
        const result = await this.userService.registerUser(dto.telegramId, dto.username);

        if (result.isErr()) {
            return { success: false, error: result.getError() };
        }

        const user = result.unwrap();
        return {
            success: true,
            data: {
                id: user.id,
                telegramId: user.telegramId,
                username: user.username,
                status: user.status,
            },
        };
    }
}