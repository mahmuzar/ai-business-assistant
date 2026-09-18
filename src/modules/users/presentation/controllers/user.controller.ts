import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { trace } from '@opentelemetry/api';
import { UserServiceImpl } from '@modules/users/application/index.js';

class RegisterUserDto {
    telegramId!: number;
    username?: string;
}

@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserServiceImpl,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(UserController.name);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterUserDto) {
        const tracer = trace.getTracer('ai-business-assistant');
        const span = tracer.startSpan('UserController.register');

        try {
            span.setAttribute('user.telegramId', dto.telegramId);
            if (dto.username) span.setAttribute('user.username', dto.username);

            this.logger.info({ telegramId: dto.telegramId }, 'Received user registration request');

            const result = await this.userService.registerUser(dto.telegramId, dto.username);

            if (result.isErr()) {
                this.logger.warn({ error: result.getError(), telegramId: dto.telegramId }, 'Registration failed');
                return {
                    success: false,
                    error: result.getError()
                };
            }

            const user = result.unwrap();
            this.logger.info({ userId: user.id }, 'User registration completed successfully');

            return {
                success: true,
                data: {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    status: user.status,
                },
            };
        } catch (error) {
            span.recordException(error as Error);
            throw error;
        } finally {
            span.end();
        }
    }
}