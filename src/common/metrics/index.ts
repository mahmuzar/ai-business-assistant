import { register, Histogram, Counter } from 'prom-client';

// Функция для безопасного создания метрик
function getOrCreateHistogram(name: string, help: string, buckets: number[]): Histogram {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as Histogram;
  return new Histogram({ name, help, buckets });
}

function getOrCreateCounter(name: string, help: string, labelNames?: string[]): Counter {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as Counter;
  return new Counter({ name, help, labelNames });
}

export const embeddingGenerationLatency = getOrCreateHistogram(
  'embedding_generation_latency_ms',
  'Time to generate embeddings for a batch of texts',
  [100, 500, 1000, 2000, 5000]
);

export const documentSyncErrors = getOrCreateCounter(
  'document_sync_errors_total',
  'Total document synchronization errors',
  ['source']
);

export const documentsSyncedTotal = getOrCreateCounter(
  'documents_synced_total',
  'Total successfully synced documents',
  ['source']
);