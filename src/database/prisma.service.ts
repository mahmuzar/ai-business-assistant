import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('PRISMA_CLIENT') private readonly client: PrismaClient
  ) {}

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  // Проксируем все методы клиента
  get user() {
    return this.client.user;
  }
  
  // Добавь другие модели по мере необходимости
  // get order() { return this.client.order; }
}