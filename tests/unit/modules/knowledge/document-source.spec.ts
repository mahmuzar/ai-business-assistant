import { IDocumentSource, SourceDocument, DownloadedFile } from '../../../../src/modules/knowledge/domain/document-source.interface.js';

describe('IDocumentSource', () => {
  let source: IDocumentSource;

  // Создаём мок-реализацию для теста интерфейса
  beforeEach(() => {
    source = {
      name: 'test-source',
      listDocuments: jest.fn().mockResolvedValue([
        {
          id: 'doc-1',
          filename: 'test.txt',
          size: 1024,
          mimeType: 'text/plain',
          updatedAt: new Date('2026-09-22'),
        },
      ] as SourceDocument[]),
      downloadDocument: jest.fn().mockResolvedValue({
        filename: 'test.txt',
        buffer: Buffer.from('Hello World'),
        mimeType: 'text/plain',
      } as DownloadedFile),
      healthCheck: jest.fn().mockResolvedValue(true),
    };
  });

  describe('name', () => {
    it('should have a name property', () => {
      expect(source.name).toBe('test-source');
    });
  });

  describe('listDocuments', () => {
    it('should return array of SourceDocument', async () => {
      const docs = await source.listDocuments();

      expect(docs).toHaveLength(1);
      expect(docs[0]).toEqual({
        id: 'doc-1',
        filename: 'test.txt',
        size: 1024,
        mimeType: 'text/plain',
        updatedAt: new Date('2026-09-22'),
      });
    });

    it('should return empty array when no documents', async () => {
      (source.listDocuments as jest.Mock).mockResolvedValue([]);

      const docs = await source.listDocuments();
      expect(docs).toHaveLength(0);
    });
  });

  describe('downloadDocument', () => {
    it('should return DownloadedFile with buffer', async () => {
      const file = await source.downloadDocument('doc-1');

      expect(file.filename).toBe('test.txt');
      expect(file.buffer).toBeInstanceOf(Buffer);
      expect(file.buffer.toString()).toBe('Hello World');
      expect(file.mimeType).toBe('text/plain');
    });

    it('should be called with correct documentId', async () => {
      await source.downloadDocument('doc-1');

      expect(source.downloadDocument).toHaveBeenCalledWith('doc-1');
    });
  });

  describe('healthCheck', () => {
    it('should return true when source is available', async () => {
      const isHealthy = await source.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when source is unavailable', async () => {
      (source.healthCheck as jest.Mock).mockResolvedValue(false);

      const isHealthy = await source.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});