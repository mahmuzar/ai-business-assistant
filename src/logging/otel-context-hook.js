// src/logging/otel-context-hook.js
const { trace, context } = require('@opentelemetry/api');

function otelContextHook(log) {
  const span = trace.getSpan(context.active());
  if (span) {
    const spanContext = span.spanContext();
    log.trace_id = spanContext.traceId;
    log.span_id = spanContext.spanId;
  }
  return log;
}

module.exports = otelContextHook;