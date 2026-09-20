import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service.js';


@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;

        if (!userId) {
            throw new ForbiddenException('Не авторизован');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN') {
            throw new ForbiddenException('Доступ запрещён. Требуются права администратора.');
        }

        return true;
    }
}