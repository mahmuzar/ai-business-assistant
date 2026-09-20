// src/modules/ai/application/embeddings.interface.ts
export const EMBEDDINGS_SERVICE = 'EMBEDDINGS_SERVICE';
export const LOCAL_EMBEDDINGS_SERVICE = 'LOCAL_EMBEDDINGS_SERVICE';

export interface IEmbeddingsService {
  embedTexts(texts: string[]): Promise<number[][]>;
  embedSingle(text: string): Promise<number[]>;
}