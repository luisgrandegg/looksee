import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { patchPackageJson } from './package-json.js';

describe('patchPackageJson', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'looksee-pkg-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function writePkg(p: object): void {
    writeFileSync(join(dir, 'package.json'), JSON.stringify(p, null, 2) + '\n');
  }
  function readPkg(): Record<string, unknown> {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  }

  it('throws if package.json is missing', () => {
    expect(() => patchPackageJson(dir)).toThrow(/package\.json not found/);
  });

  it('adds vr scripts and lost-pixel devDep on a clean project', () => {
    writePkg({ name: 'x', version: '1.0.0' });
    const result = patchPackageJson(dir);
    expect(result.changed).toBe(true);
    expect(result.scriptsAdded).toEqual(['vr:test', 'vr:baselines', 'vr:update']);
    expect(result.devDepsAdded).toEqual(['lost-pixel']);
    const pkg = readPkg();
    expect((pkg.scripts as Record<string, string>)['vr:test']).toBe('lost-pixel');
    expect((pkg.scripts as Record<string, string>)['vr:baselines']).toBe('bash scripts/docker-baselines.sh');
    expect((pkg.devDependencies as Record<string, string>)['lost-pixel']).toMatch(/^\^/);
  });

  it('is idempotent — second run reports no changes', () => {
    writePkg({ name: 'x', version: '1.0.0' });
    patchPackageJson(dir);
    const second = patchPackageJson(dir);
    expect(second.changed).toBe(false);
    expect(second.scriptsAdded).toEqual([]);
    expect(second.devDepsAdded).toEqual([]);
  });

  it('preserves existing unrelated scripts', () => {
    writePkg({
      name: 'x',
      scripts: { test: 'jest', lint: 'eslint .' },
    });
    patchPackageJson(dir);
    const pkg = readPkg();
    expect((pkg.scripts as Record<string, string>)['test']).toBe('jest');
    expect((pkg.scripts as Record<string, string>)['lint']).toBe('eslint .');
  });

  it('reports a conflict when a vr:* script exists with a different command', () => {
    writePkg({
      name: 'x',
      scripts: { 'vr:test': 'percy snapshot' },
    });
    const result = patchPackageJson(dir);
    expect(result.scriptsConflicted).toEqual(['vr:test']);
    expect(result.scriptsAdded).toEqual(['vr:baselines', 'vr:update']);
    const pkg = readPkg();
    // The conflicting script must NOT be overwritten.
    expect((pkg.scripts as Record<string, string>)['vr:test']).toBe('percy snapshot');
  });

  it('does not add lost-pixel if it is already in dependencies', () => {
    writePkg({
      name: 'x',
      dependencies: { 'lost-pixel': '^3.0.0' },
    });
    const result = patchPackageJson(dir);
    expect(result.devDepsAdded).toEqual([]);
  });

  it('preserves indentation', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', version: '1.0.0' }, null, 4) + '\n',
    );
    patchPackageJson(dir);
    const raw = readFileSync(join(dir, 'package.json'), 'utf8');
    expect(raw).toMatch(/\n {4}"/); // 4-space indent preserved
  });
});
