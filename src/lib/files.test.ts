import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { writeFileSafely, patchGitignore } from './files.js';

describe('writeFileSafely', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'looksee-files-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('creates a file when none exists', async () => {
    const path = join(dir, 'a', 'b', 'file.txt');
    const r = await writeFileSafely(path, 'hello', { yes: true });
    expect(r.status).toBe('created');
    expect(readFileSync(path, 'utf8')).toBe('hello');
  });

  it('reports unchanged when contents already match', async () => {
    const path = join(dir, 'file.txt');
    writeFileSync(path, 'same');
    const r = await writeFileSafely(path, 'same', { yes: true });
    expect(r.status).toBe('unchanged');
  });

  it('skips when --yes mode and content differs (Constitution principle 4)', async () => {
    const path = join(dir, 'file.txt');
    writeFileSync(path, 'existing');
    const r = await writeFileSafely(path, 'new', { yes: true });
    expect(r.status).toBe('skipped');
    expect(readFileSync(path, 'utf8')).toBe('existing');
  });
});

describe('patchGitignore', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'looksee-gi-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('creates .gitignore when missing', () => {
    const r = patchGitignore(dir);
    expect(r.status).toBe('created');
    const content = readFileSync(join(dir, '.gitignore'), 'utf8');
    expect(content).toContain('.lost-pixel/current/');
    expect(content).toContain('.lost-pixel/difference/');
  });

  it('appends to an existing .gitignore', () => {
    writeFileSync(join(dir, '.gitignore'), 'node_modules\n');
    const r = patchGitignore(dir);
    expect(r.status).toBe('patched');
    const content = readFileSync(join(dir, '.gitignore'), 'utf8');
    expect(content).toContain('node_modules');
    expect(content).toContain('.lost-pixel/current/');
  });

  it('is idempotent — running twice produces no further change', () => {
    patchGitignore(dir);
    const before = readFileSync(join(dir, '.gitignore'), 'utf8');
    const second = patchGitignore(dir);
    expect(second.status).toBe('unchanged');
    const after = readFileSync(join(dir, '.gitignore'), 'utf8');
    expect(after).toBe(before);
  });

  it('does not add patterns that are already present', () => {
    writeFileSync(
      join(dir, '.gitignore'),
      'node_modules\n.lost-pixel/current/\n.lost-pixel/difference/\n',
    );
    const r = patchGitignore(dir);
    expect(r.status).toBe('unchanged');
  });
});

// Sanity test: paths get created even when nested.
describe('writeFileSafely deep paths', () => {
  it('creates intermediate directories', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'looksee-deep-'));
    try {
      const path = join(dir, 'one', 'two', 'three', 'file.txt');
      await writeFileSafely(path, 'x', { yes: true });
      expect(existsSync(path)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
