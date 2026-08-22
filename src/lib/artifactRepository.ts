import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type PersistedPageStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'MISSING' | 'INVALID';

export interface PersistedPage {
  page: number;
  status: PersistedPageStatus;
  attempts: number;
  markdown_file: string | null;
  sha256?: string;
  parser: string;
  parser_version: string;
  model_version?: string;
  started_at?: string | null;
  completed_at?: string | null;
  error?: string | null;
}

export interface DocumentArtifactManifest {
  id: string;
  filename: string;
  total_pages: number;
  parser: string;
  parser_version: string;
  created_at: string;
  updated_at: string;
  pages: PersistedPage[];
}

const locks = new Map<string, Promise<unknown>>();
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const pageFilename = (page: number) => `${String(page).padStart(6, '0')}.md`;

/** Filesystem-backed, process-local artifact repository.  A per-document queue makes
 * read/modify/write transitions atomic even when pages finish concurrently. */
export class ArtifactRepository {
  constructor(private readonly root: string) {}

  private documentDir(caseId: string, documentId: string) {
    return path.join(this.root, caseId, 'documents', documentId);
  }

  private async exclusive<T>(key: string, work: () => Promise<T>): Promise<T> {
    const previous = locks.get(key) || Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    locks.set(key, previous.then(() => current));
    await previous;
    try { return await work(); } finally {
      release();
      if (locks.get(key) === current) locks.delete(key);
    }
  }

  private async atomicJson(filename: string, value: unknown) {
    await mkdir(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporary, filename);
  }

  private async readManifest(caseId: string, documentId: string): Promise<DocumentArtifactManifest | null> {
    try {
      return JSON.parse(await readFile(path.join(this.documentDir(caseId, documentId), 'manifest.json'), 'utf8'));
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null;
      throw error;
    }
  }

  async initialize(caseId: string, input: { id: string; filename: string; totalPages: number; parser?: string; parserVersion?: string }) {
    return this.exclusive(`${caseId}/${input.id}`, async () => {
      const existing = await this.readManifest(caseId, input.id);
      if (existing) return existing;
      const now = new Date().toISOString();
      const manifest: DocumentArtifactManifest = {
        id: input.id, filename: input.filename, total_pages: input.totalPages,
        parser: input.parser || 'pdfjs-dist', parser_version: input.parserVersion || '4.10.38',
        created_at: now, updated_at: now,
        pages: Array.from({ length: input.totalPages }, (_, index) => ({
          page: index + 1, status: 'MISSING', attempts: 0, markdown_file: null,
          parser: input.parser || 'pdfjs-dist', parser_version: input.parserVersion || '4.10.38'
        }))
      };
      const dir = this.documentDir(caseId, input.id);
      await mkdir(path.join(dir, 'pages'), { recursive: true });
      await this.atomicJson(path.join(dir, 'manifest.json'), manifest);
      await this.atomicJson(path.join(dir, 'page-status.json'), manifest.pages);
      return manifest;
    });
  }

  async get(caseId: string, documentId: string) { return this.readManifest(caseId, documentId); }

  async savePage(caseId: string, documentId: string, page: number, result: { markdown?: string; parser: string; parserVersion: string; modelVersion?: string; error?: string }) {
    return this.exclusive(`${caseId}/${documentId}`, async () => {
      const manifest = await this.readManifest(caseId, documentId);
      if (!manifest) throw new Error(`Document artifact ${documentId} was not initialized.`);
      const entry = manifest.pages.find((candidate) => candidate.page === page);
      if (!entry) throw new Error(`Page ${page} is outside document bounds.`);
      // Cached success is immutable: failed retries and concurrent completions cannot erase it.
      if (entry.status === 'SUCCESS') return manifest;
      const now = new Date().toISOString();
      entry.attempts += 1;
      entry.parser = result.parser;
      entry.parser_version = result.parserVersion;
      entry.model_version = result.modelVersion;
      entry.started_at = entry.started_at || now;
      entry.completed_at = now;
      if (result.markdown) {
        const filename = pageFilename(page);
        const artifact = path.join(this.documentDir(caseId, documentId), 'pages', filename);
        const temporary = `${artifact}.${process.pid}.${Date.now()}.tmp`;
        await writeFile(temporary, result.markdown, 'utf8');
        await rename(temporary, artifact);
        entry.status = 'SUCCESS'; entry.markdown_file = `pages/${filename}`;
        entry.sha256 = sha256(result.markdown); entry.error = null;
      } else {
        entry.status = 'FAILED'; entry.error = result.error || 'Page parser did not return Markdown.';
      }
      manifest.updated_at = now;
      const dir = this.documentDir(caseId, documentId);
      await this.atomicJson(path.join(dir, 'manifest.json'), manifest);
      await this.atomicJson(path.join(dir, 'page-status.json'), manifest.pages);
      return manifest;
    });
  }

  async readPage(caseId: string, documentId: string, page: number) {
    const manifest = await this.readManifest(caseId, documentId);
    const entry = manifest?.pages.find((candidate) => candidate.page === page);
    if (!entry?.markdown_file || entry.status !== 'SUCCESS') return null;
    const markdown = await readFile(path.join(this.documentDir(caseId, documentId), entry.markdown_file), 'utf8');
    return sha256(markdown) === entry.sha256 ? markdown : null;
  }

  async clear(rootCaseId: string) { await rm(path.join(this.root, rootCaseId), { recursive: true, force: true }); }
}
