import { Module } from "@nestjs/common";
import { UserServiceImpl } from "@modules/users/application/index.js";
import { USER_REPOSITORY } from "@modules/users/domain/user.repository.token.js";
import { UserController } from "@modules/users/presentation/index.js";
import { PrismaUserRepository } from "@modules/users/infrastructure/index.js";

@Module({
    controllers: [UserController],
    providers: [
        UserServiceImpl,
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository, // Здесь мы меняем реализацию при необходимости
        },
    ],
})
export class UsersModule { }