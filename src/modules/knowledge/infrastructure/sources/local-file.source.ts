import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IDocumentSource, SourceDocument, DownloadedFile } from '../../domain/document-source.interface.js';

@Injectable()
export class LocalFileDocumentSource implements IDocumentSource {
  readonly name = 'local-file';

  constructor(private readonly basePath: string) {}

  async healthCheck(): Promise<boolean> {
    try {
      const stats = fs.statSync(this.basePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async listDocuments(): Promise<SourceDocument[]> {
    const files = this.getFilesRecursive(this.basePath);

    return files.map((filePath) => {
      const stats = fs.statSync(filePath);
      const relativePath = path.relative(this.basePath, filePath);

      return {
        id: this.generateId(relativePath),
        filename: path.basename(filePath),
        size: stats.size,
        mimeType: this.getMimeType(filePath),
        updatedAt: stats.mtime,
      };
    });
  }

  async downloadDocument(documentId: string): Promise<DownloadedFile> {
    const filePath = this.resolvePathFromId(documentId);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const buffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);

    return {
      filename,
      buffer,
      mimeType: this.getMimeType(filePath),
    };
  }

  private getFilesRecursive(dir: string): string[] {
    const results: string[] = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...this.getFilesRecursive(fullPath));
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }

    return results;
  }

  private generateId(relativePath: string): string {
    // Используем относительный путь как ID (детерминированный)
    return Buffer.from(relativePath).toString('base64url');
  }

  private resolvePathFromId(documentId: string): string {
    const relativePath = Buffer.from(documentId, 'base64url').toString();
    return path.resolve(this.basePath, relativePath);
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.md': 'text/markdown',
    };

    return mimeMap[ext] || 'application/octet-stream';
  }
}