import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

// Создаем ресурс правильно, используя класс Resource
const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'ai-business-assistant',
    [ATTR_SERVICE_VERSION]: '0.1.0',
});

const sdk = new NodeSDK({
    resource: resource,
    traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [
        new NestInstrumentation(),
        new HttpInstrumentation(),
    ],
});

sdk.start();

export const otelSDK = sdk;