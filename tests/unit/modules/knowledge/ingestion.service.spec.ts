import { IngestionService } from '../../../../src/modules/knowledge/application/ingestion.service.js';
import { IDocumentSource, SourceDocument, DownloadedFile } from '../../../../src/modules/knowledge/domain/document-source.interface.js';
import { ChunkingService } from '../../../../src/modules/knowledge/application/chunking.service.js';
import { FileParserService } from '../../../../src/modules/knowledge/application/file-parser.service.js';
import { KnowledgeRepository } from '../../../../src/modules/knowledge/infrastructure/knowledge.repository.js';
import { LocalEmbeddingsService } from '../../../../src/modules/ai/infrastructure/local-embeddings.service.js';

describe('IngestionService', () => {
  let service: IngestionService;
  let mockSource: jest.Mocked<IDocumentSource>;
  let mockChunking: jest.Mocked<Partial<ChunkingService>>;
  let mockParser: jest.Mocked<Partial<FileParserService>>;
  let mockRepo: jest.Mocked<Partial<KnowledgeRepository>>;
  let mockEmbeddings: jest.Mocked<Partial<LocalEmbeddingsService>>;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      setContext: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    };

    mockSource = {
      name: 'test-source',
      listDocuments: jest.fn(),
      downloadDocument: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    };

    mockChunking = {
      chunkText: jest.fn().mockReturnValue([
        { content: 'chunk 1', order: 0 },
        { content: 'chunk 2', order: 1 },
      ]),
    };

    mockParser = {
      parse: jest.fn().mockResolvedValue('parsed text content'),
      extractTextFromBuffer: jest.fn().mockResolvedValue('parsed text content'),
    };

    mockRepo = {
      createDocument: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      updateDocumentStatus: jest.fn().mockResolvedValue(undefined),
      saveChunks: jest.fn().mockResolvedValue(undefined),
      findDocumentBySourceId: jest.fn().mockResolvedValue(null),
    };

    mockEmbeddings = {
      embedTexts: jest.fn().mockResolvedValue([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]),
    };

    service = new IngestionService(
      mockRepo as any,
      mockChunking as any,
      mockParser as any,
      mockEmbeddings as any,
      mockLogger,
      mockSource,
    );
  });

  describe('syncFromSource', () => {
    it('should list documents from source and ingest each one', async () => {
      const docs: SourceDocument[] = [
        { id: 'doc-1', filename: 'test.txt', size: 100, mimeType: 'text/plain', updatedAt: new Date() },
      ];

      mockSource.listDocuments.mockResolvedValue(docs);
      mockSource.downloadDocument.mockResolvedValue({
        filename: 'test.txt',
        buffer: Buffer.from('file content'),
        mimeType: 'text/plain',
      });

      await service.syncFromSource();

      expect(mockSource.listDocuments).toHaveBeenCalledTimes(1);
      expect(mockSource.downloadDocument).toHaveBeenCalledWith('doc-1');
      expect(mockParser.extractTextFromBuffer).toHaveBeenCalled();
      expect(mockChunking.chunkText).toHaveBeenCalledWith('parsed text content');
      expect(mockEmbeddings.embedTexts).toHaveBeenCalled();
      expect(mockRepo.saveChunks).toHaveBeenCalled();
    });

    it('should skip already synced documents', async () => {
      const docs: SourceDocument[] = [
        { id: 'doc-1', filename: 'test.txt', size: 100, mimeType: 'text/plain', updatedAt: new Date() },
      ];

      mockSource.listDocuments.mockResolvedValue(docs);
      (mockRepo as any).findDocumentBySourceId = jest.fn().mockResolvedValue({ id: 'existing-doc', status: 'ready' });

      await service.syncFromSource();

      expect(mockSource.downloadDocument).not.toHaveBeenCalled();
    });

    it('should handle source health check failure', async () => {
      mockSource.healthCheck.mockResolvedValue(false);

      await expect(service.syncFromSource()).rejects.toThrow();
    });

    it('should update document status on failure', async () => {
      const docs: SourceDocument[] = [
        { id: 'doc-1', filename: 'test.txt', size: 100, mimeType: 'text/plain', updatedAt: new Date() },
      ];

      mockSource.listDocuments.mockResolvedValue(docs);
      mockSource.downloadDocument.mockRejectedValue(new Error('download failed'));
      (mockRepo as any).findDocumentBySourceId = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'new-doc', status: 'processing' });
      (mockRepo as any).createDocument = jest.fn().mockResolvedValue('new-doc');

      await service.syncFromSource();

      expect(mockRepo.updateDocumentStatus).toHaveBeenCalledWith('new-doc', 'failed');
    });
  });
});