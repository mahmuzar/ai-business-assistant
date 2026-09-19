import { Span } from '@opentelemetry/api';

export function recordExceptionSafe(span: Span, error: unknown): void {
  if (error instanceof Error) {
    span.recordException(error);
  } else if (typeof error === 'string') {
    span.recordException(new Error(error));
  } else {
    // Если тип неизвестен, создаем общее исключение с сериализацией
    span.recordException(new Error(`Unknown error: ${JSON.stringify(error)}`));
  }
}