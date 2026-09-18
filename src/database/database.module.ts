import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
    imports: [ConfigModule], // Убедись, что ConfigModule доступен здесь
    providers: [
        {
            provide: 'PRISMA_CLIENT',
            useFactory: (config: ConfigService) => {
                const databaseUrl = config.getOrThrow<string>('DATABASE_URL');

                const adapter = new PrismaPg({
                    connectionString: databaseUrl
                });

                return new PrismaClient({ adapter });
            },
            inject: [ConfigService],
        },
        PrismaService
    ],
    exports: ['PRISMA_CLIENT', PrismaService],
})
export class DatabaseModule { }