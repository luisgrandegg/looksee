import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import prompts from 'prompts';
import { log } from './log.js';

export type ConflictResolution = 'overwrite' | 'skip' | 'backup';

export interface CopyOptions {
  /** When true, never prompt — always skip if the file exists. */
  yes?: boolean;
  /** Optional file mode (e.g. 0o755 for a shell script). */
  mode?: number;
  /** Whether to mark the action as a no-op when content already matches byte-for-byte. */
  idempotent?: boolean;
}

export interface CopyResult {
  path: string;
  status: 'created' | 'overwritten' | 'skipped' | 'backed-up' | 'unchanged';
  backupPath?: string;
}

/**
 * Write `content` to `targetPath`. If a file already exists there:
 *   - If contents match exactly, return `unchanged` (idempotent).
 *   - Otherwise prompt overwrite/skip/backup. In `--yes` mode, always skip.
 */
export async function writeFileSafely(
  targetPath: string,
  content: string,
  opts: CopyOptions = {},
): Promise<CopyResult> {
  ensureDir(dirname(targetPath));

  if (existsSync(targetPath)) {
    const existing = readFileSync(targetPath, 'utf8');
    if (existing === content) {
      return { path: targetPath, status: 'unchanged' };
    }

    if (opts.yes) {
      log.warn(`Skipping ${targetPath} — file exists, --yes mode skips conflicts.`);
      return { path: targetPath, status: 'skipped' };
    }

    const resolution = await promptConflict(targetPath);
    switch (resolution) {
      case 'skip':
        return { path: targetPath, status: 'skipped' };
      case 'backup': {
        const backupPath = `${targetPath}.backup`;
        writeFileSync(backupPath, existing, 'utf8');
        writeFileSync(targetPath, content, 'utf8');
        if (opts.mode !== undefined) chmodSync(targetPath, opts.mode);
        return { path: targetPath, status: 'backed-up', backupPath };
      }
      case 'overwrite':
        writeFileSync(targetPath, content, 'utf8');
        if (opts.mode !== undefined) chmodSync(targetPath, opts.mode);
        return { path: targetPath, status: 'overwritten' };
    }
  }

  writeFileSync(targetPath, content, 'utf8');
  if (opts.mode !== undefined) chmodSync(targetPath, opts.mode);
  return { path: targetPath, status: 'created' };
}

async function promptConflict(path: string): Promise<ConflictResolution> {
  const response = await prompts({
    type: 'select',
    name: 'choice',
    message: `${path} already exists. What should I do?`,
    choices: [
      { title: 'Skip — leave the existing file untouched', value: 'skip' },
      { title: `Save as ${path}.backup, then overwrite`, value: 'backup' },
      { title: 'Overwrite — replace the existing file', value: 'overwrite' },
    ],
    initial: 0,
  });
  if (typeof response.choice !== 'string') {
    // User cancelled (Ctrl-C). Treat as skip — Constitution principle 4.
    return 'skip';
  }
  return response.choice as ConflictResolution;
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const GITIGNORE_LINES = [
  '# looksee — visual regression runtime artifacts',
  '.lost-pixel/current/',
  '.lost-pixel/difference/',
];

/**
 * Append looksee's required .gitignore entries idempotently.
 * Only writes if at least one line is missing. Preserves existing content.
 */
export function patchGitignore(workingDir: string): {
  status: 'created' | 'patched' | 'unchanged';
  added: string[];
} {
  const path = join(workingDir, '.gitignore');
  const existed = existsSync(path);
  const existing = existed ? readFileSync(path, 'utf8') : '';
  const lines = existing.split(/\r?\n/);

  const toAdd = GITIGNORE_LINES.filter((entry) => {
    if (entry.startsWith('#')) {
      // The header comment is added only if at least one of the patterns is missing,
      // and only if it isn't already there.
      return !existing.includes(entry);
    }
    return !lines.some((l) => l.trim() === entry);
  });

  // Drop the header if both patterns already exist (no patch needed).
  const patternsMissing = GITIGNORE_LINES.slice(1).filter(
    (p) => !lines.some((l) => l.trim() === p),
  );
  if (patternsMissing.length === 0) {
    return { status: 'unchanged', added: [] };
  }

  const trailing = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  const block = '\n' + toAdd.join('\n') + '\n';
  writeFileSync(path, existing + trailing + block, 'utf8');

  return { status: existed ? 'patched' : 'created', added: toAdd };
}
