import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module.js';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot(), 
    UsersModule,
  ],
})
export class AppModule {}