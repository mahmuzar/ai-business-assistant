// prisma/prisma.config.ts
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// Загружаем .env из корня проекта
dotenv.config({ path: '../.env' });

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: './migrations',
  },
});