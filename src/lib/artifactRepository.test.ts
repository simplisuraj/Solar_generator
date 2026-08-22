import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { ArtifactRepository } from './artifactRepository';

test('successful page artifacts are cached and failures cannot replace them', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'solar-artifacts-'));
  const repo = new ArtifactRepository(root);
  await repo.initialize('case-a', { id: 'DOC-001', filename: 'source.pdf', totalPages: 2 });
  await repo.savePage('case-a', 'DOC-001', 1, { markdown: '# cached page', parser: 'pdfjs', parserVersion: '4' });
  const retried = await repo.savePage('case-a', 'DOC-001', 1, { parser: 'pdfjs', parserVersion: '4', error: 'temporary failure' });
  assert.equal(retried.pages[0].status, 'SUCCESS');
  assert.equal(await repo.readPage('case-a', 'DOC-001', 1), '# cached page');
  assert.match(await readFile(path.join(root, 'case-a/documents/DOC-001/pages/000001.md'), 'utf8'), /cached/);
});

test('retry candidates include only failed, missing, or invalid pages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'solar-artifacts-'));
  const repo = new ArtifactRepository(root);
  await repo.initialize('case-a', { id: 'DOC-001', filename: 'source.pdf', totalPages: 3 });
  await repo.savePage('case-a', 'DOC-001', 1, { markdown: '# one', parser: 'pdfjs', parserVersion: '4' });
  await repo.savePage('case-a', 'DOC-001', 2, { parser: 'pdfjs', parserVersion: '4', error: 'failed' });
  const manifest = await repo.get('case-a', 'DOC-001');
  assert.deepEqual(manifest?.pages.filter((page) => ['FAILED', 'MISSING', 'INVALID'].includes(page.status)).map((page) => page.page), [2, 3]);
});
