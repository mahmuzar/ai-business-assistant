# AI Business Assistant 🚀

Интеллектуальная RAG-система для бизнеса на NestJS. Загружает документы из различных источников, векторизует их и предоставляет точные ответы через Telegram-бота с полной наблюдаемостью.

## 🛠 Технологический стек

- **Backend:** NestJS (TypeScript, ESM)
- **Database:** PostgreSQL + pgvector
- **ORM:** Prisma
- **AI:** GigaChat Embeddings / Ollama
- **Messenger:** Telegram (Telegraf)
- **Observability:** OpenTelemetry, Prometheus, Grafana, Loki, Jaeger
- **Logging:** Pino (structured JSON + trace context)

## 🚀 Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Конфигурация

```bash
cp .env.example .env
# Заполните DATABASE_URL, TELEGRAM_BOT_TOKEN и ключи AI API
```

### 3. Инфраструктура

```bash
docker compose -f docker-compose.observability.yml up -d
```

### 4. База данных

```bash
npx prisma migrate dev
```

### 5. Запуск

```bash
npm run start:dev
```

## 📊 Наблюдаемость

| Сервис | URL | Описание |
| :--- | :--- | :--- |
| **Grafana** | http://localhost:3001 | Дашборды метрик и логов |
| **Prometheus** | http://localhost:9090 | Метрики и алерты |
| **Jaeger** | http://localhost:16686 | Distributed tracing |
| **Health** | http://localhost:3000/health | Liveness / Readiness probes |

## 🏗 Архитектура проекта

```text
src/
├── common/           # Метрики Prometheus, health checks, утилиты
├── database/         # Конфигурация подключения к БД
├── logging/          # Pino + Loki transport + OTel context mixin
├── shared/           # Общие компоненты (OpenTelemetry, трассировка)
├── workers/          # Фоновые задачи
├── modules/
│   ├── ai/           # GigaChat / Ollama, RAG pipeline
│   ├── conversation/ # История диалогов, персистентность сообщений
│   ├── knowledge/    # Загрузка документов, чанкинг, эмбеддинги, поиск
│   ├── telegram/     # Telegram бот, webhook, команды
│   └── users/        # Регистрация и управление пользователями
├── app.module.ts
├── main.ts
└── observability.ts  # Инициализация OpenTelemetry SDK
```

## 🧪 Тестирование

Проект разрабатывается с использованием TDD (19+ unit тестов).

```bash
npm run test
```

## 📬 Контакты

| Канал | Ссылка |
| :--- | :--- |
| **GitHub** | [@mahmuzar](https://github.com/mahmuzar) |
| **Telegram** | [@mahmuzar](https://t.me/mahmuzar) |
| **Email** | mahmuzar@example.com |

> 💡 По вопросам сотрудничества, баг-репортам и предложениям пишите в Telegram — это самый быстрый способ связи.

---

*Разработано и поддерживается Мурадом (@mahmuzar)*