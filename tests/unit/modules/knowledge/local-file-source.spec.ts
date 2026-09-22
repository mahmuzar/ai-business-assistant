import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LocalFileDocumentSource } from '../../../../src/modules/knowledge/infrastructure/sources/local-file.source.js';

describe('LocalFileDocumentSource', () => {
    let source: LocalFileDocumentSource;
    let tmpDir: string;

    beforeEach(() => {
        // Создаём временную папку с тестовыми файлами
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-test-'));

        // Создаём тестовые файлы
        fs.writeFileSync(path.join(tmpDir, 'doc1.txt'), 'Hello World');
        fs.writeFileSync(path.join(tmpDir, 'doc2.pdf'), Buffer.from('fake-pdf-content'));
        fs.mkdirSync(path.join(tmpDir, 'subdir'));
        fs.writeFileSync(path.join(tmpDir, 'subdir', 'doc3.txt'), 'Nested file');

        source = new LocalFileDocumentSource(tmpDir);
    });

    afterEach(() => {
        // Удаляем временную папку
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe('name', () => {
        it('should return "local-file" as name', () => {
            expect(source.name).toBe('local-file');
        });
    });

    describe('healthCheck', () => {
        it('should return true when directory exists', async () => {
            const result = await source.healthCheck();
            expect(result).toBe(true);
        });

        it('should return false when directory does not exist', async () => {
            const badSource = new LocalFileDocumentSource('/nonexistent/path/xyz');
            const result = await badSource.healthCheck();
            expect(result).toBe(false);
        });
    });

    describe('listDocuments', () => {
        it('should list all files recursively', async () => {
            const docs = await source.listDocuments();

            expect(docs).toHaveLength(3);
            expect(docs.map(d => d.filename).sort()).toEqual(['doc1.txt', 'doc2.pdf', 'doc3.txt']);
        });

        it('should return correct metadata for each file', async () => {
            const docs = await source.listDocuments();
            const doc1 = docs.find(d => d.filename === 'doc1.txt');

            expect(doc1).toBeDefined();
            expect(doc1!.size).toBe(11); // 'Hello World'.length
            expect(doc1!.mimeType).toBe('text/plain');
            expect(doc1!.id).toBeDefined();
            expect(new Date(doc1!.updatedAt).getTime()).not.toBeNaN();
        });

        it('should return empty array for empty directory', async () => {
            const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-test-'));
            const emptySource = new LocalFileDocumentSource(emptyDir);

            const docs = await emptySource.listDocuments();
            expect(docs).toHaveLength(0);

            fs.rmSync(emptyDir, { recursive: true, force: true });
        });
    });

    describe('downloadDocument', () => {
        it('should download file by id and return buffer', async () => {
            const docs = await source.listDocuments();
            const doc1 = docs.find(d => d.filename === 'doc1.txt')!;

            const file = await source.downloadDocument(doc1.id);

            expect(file.filename).toBe('doc1.txt');
            expect(file.buffer.toString()).toBe('Hello World');
            expect(file.mimeType).toBe('text/plain');
        });

        it('should throw error for non-existent document', async () => {
            await expect(source.downloadDocument('nonexistent-id')).rejects.toThrow();
        });
    });
});
