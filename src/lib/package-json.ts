import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sortPackageJson from 'sort-package-json';

export interface PatchResult {
  changed: boolean;
  scriptsAdded: string[];
  scriptsConflicted: string[];
  devDepsAdded: string[];
}

const REQUIRED_SCRIPTS: Record<string, string> = {
  'vr:test': 'lost-pixel',
  'vr:baselines': 'bash scripts/docker-baselines.sh',
  'vr:update': 'lost-pixel update',
};

const REQUIRED_DEV_DEPS: Record<string, string> = {
  'lost-pixel': '^3.20.0',
};

interface PackageJsonShape {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Patch a consumer's package.json:
 *   - Add the vr:* scripts. If a script of the same name already exists with
 *     a different command, leave it alone and report the conflict.
 *   - Add `lost-pixel` to devDependencies if missing.
 *   - Preserve the existing key order for everything else, then sort the file
 *     with `sort-package-json` (which is stable and idempotent for already-sorted
 *     files — this is the de-facto standard for tooling that touches package.json).
 *   - Preserve the file's trailing newline and indentation (2 spaces).
 */
export function patchPackageJson(workingDir: string): PatchResult {
  const path = join(workingDir, 'package.json');
  if (!existsSync(path)) {
    throw new Error(
      `package.json not found in ${workingDir}. Run \`looksee init\` from a Node project root, or pass --working-dir.`,
    );
  }

  const original = readFileSync(path, 'utf8');
  const json = JSON.parse(original) as PackageJsonShape;

  const scriptsAdded: string[] = [];
  const scriptsConflicted: string[] = [];
  const devDepsAdded: string[] = [];

  json.scripts = json.scripts ?? {};
  for (const [name, cmd] of Object.entries(REQUIRED_SCRIPTS)) {
    const existing = json.scripts[name];
    if (existing === undefined) {
      json.scripts[name] = cmd;
      scriptsAdded.push(name);
    } else if (existing !== cmd) {
      scriptsConflicted.push(name);
    }
  }

  json.devDependencies = json.devDependencies ?? {};
  for (const [dep, version] of Object.entries(REQUIRED_DEV_DEPS)) {
    if (
      json.devDependencies[dep] === undefined &&
      json.dependencies?.[dep] === undefined
    ) {
      json.devDependencies[dep] = version;
      devDepsAdded.push(dep);
    }
  }

  if (scriptsAdded.length === 0 && devDepsAdded.length === 0) {
    return {
      changed: false,
      scriptsAdded,
      scriptsConflicted,
      devDepsAdded,
    };
  }

  const sorted = sortPackageJson(json);
  // Preserve indentation: detect from the original. Fall back to 2 spaces.
  const indent = detectIndent(original);
  const trailingNewline = original.endsWith('\n') ? '\n' : '';
  writeFileSync(path, JSON.stringify(sorted, null, indent) + trailingNewline, 'utf8');

  return {
    changed: true,
    scriptsAdded,
    scriptsConflicted,
    devDepsAdded,
  };
}

function detectIndent(jsonText: string): number | string {
  // Find the first nested line and read its leading whitespace.
  const match = jsonText.match(/\n([ \t]+)"/);
  if (!match || match[1] === undefined) return 2;
  const ws = match[1];
  if (ws.startsWith('\t')) return '\t';
  return ws.length;
}
