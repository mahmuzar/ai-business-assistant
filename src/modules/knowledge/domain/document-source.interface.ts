export interface SourceDocument {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  updatedAt: Date;
}

export interface DownloadedFile {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface IDocumentSource {
  readonly name: string;

  /** Получить список доступных документов */
  listDocuments(): Promise<SourceDocument[]>;

  /** Скачать конкретный документ */
  downloadDocument(documentId: string): Promise<DownloadedFile>;

  /** Проверить доступность источника */
  healthCheck(): Promise<boolean>;
}

export const DOCUMENT_SOURCE = Symbol('DOCUMENT_SOURCE');