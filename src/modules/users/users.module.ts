import { Module } from "@nestjs/common";
import { UserServiceImpl } from "@modules/users/application/index.js";
import { USER_REPOSITORY } from "@modules/users/domain/user.repository.token.js";
import { UserController } from "@modules/users/presentation/index.js";
import { PrismaUserRepository, PrismaUserMapper } from "@modules/users/infrastructure/index.js";
import { DatabaseModule } from "../../database/database.module.js";
import { USER_SERVICE_TOKEN } from "./application/user.service.token.js";

@Module({
    controllers: [UserController],
    imports: [DatabaseModule],
    providers: [
        UserServiceImpl,
        PrismaUserMapper,
        {
            provide: USER_REPOSITORY,
            useClass: PrismaUserRepository, // Здесь мы меняем реализацию при необходимости
        },
        {
            provide: USER_SERVICE_TOKEN, // <-- Регистрируем по токену
            useClass: UserServiceImpl,
        },
    ],
    exports: [
        UserServiceImpl,
        USER_SERVICE_TOKEN,
    ],
})
export class UsersModule { }