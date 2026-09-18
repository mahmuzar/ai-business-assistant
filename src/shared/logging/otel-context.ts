// src/shared/logging/otel-context.ts
import { trace, context } from '@opentelemetry/api';

export function getOtelContext() {
  try {
    const span = trace.getSpan(context.active());
    if (!span) return {};

    const spanContext = span.spanContext();
    // Проверка на валидность контекста (иногда бывает INVALID_SPAN_ID)
    if (!spanContext.traceId || !spanContext.spanId) return {};

    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  } catch {
    // Fallback, если OTel API недоступен
    return {};
  }
}