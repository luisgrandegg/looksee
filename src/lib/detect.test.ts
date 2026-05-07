import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { detectPackageManager, detectStorybook, detect } from './detect.js';

describe('detectPackageManager', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'looksee-detect-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('detects npm from package-lock.json', () => {
    writeFileSync(join(dir, 'package-lock.json'), '{}');
    expect(detectPackageManager(dir).pm).toBe('npm');
  });

  it('detects yarn from yarn.lock', () => {
    writeFileSync(join(dir, 'yarn.lock'), '');
    expect(detectPackageManager(dir).pm).toBe('yarn');
  });

  it('detects pnpm from pnpm-lock.yaml', () => {
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(dir).pm).toBe('pnpm');
  });

  it('prefers pnpm > yarn > npm when multiple lockfiles are present', () => {
    writeFileSync(join(dir, 'package-lock.json'), '{}');
    writeFileSync(join(dir, 'yarn.lock'), '');
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(dir).pm).toBe('pnpm');
  });

  it('falls back to npm when no lockfile is present', () => {
    const r = detectPackageManager(dir);
    expect(r.pm).toBe('npm');
    expect(r.evidence).toContain('no lockfile');
  });
});

describe('detectStorybook', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'looksee-detect-sb-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('detects via .storybook/ directory', () => {
    mkdirSync(join(dir, '.storybook'));
    expect(detectStorybook(dir).found).toBe(true);
  });

  it('detects via storybook script in package.json', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', scripts: { storybook: 'storybook dev' } }),
    );
    expect(detectStorybook(dir).found).toBe(true);
  });

  it('detects via storybook devDependency', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', devDependencies: { storybook: '^8.0.0' } }),
    );
    expect(detectStorybook(dir).found).toBe(true);
  });

  it('returns the build-storybook script name when present', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', scripts: { 'build-storybook': 'storybook build' } }),
    );
    expect(detectStorybook(dir).buildScript).toBe('build-storybook');
  });

  it('returns false when nothing matches', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'plain-node' }));
    const r = detectStorybook(dir);
    expect(r.found).toBe(false);
    expect(r.evidence).toBe(null);
  });
});

describe('detect (combined)', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'looksee-detect-combined-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('reports hasPackageJson=false when no package.json', () => {
    expect(detect(dir).hasPackageJson).toBe(false);
  });

  it('reports a complete result for a typical npm + Storybook 8 project', () => {
    writeFileSync(join(dir, 'package-lock.json'), '{}');
    mkdirSync(join(dir, '.storybook'));
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'x',
        scripts: { 'build-storybook': 'storybook build', storybook: 'storybook dev' },
        devDependencies: { storybook: '^8.0.0' },
      }),
    );
    const r = detect(dir);
    expect(r.packageManager).toBe('npm');
    expect(r.storybookFound).toBe(true);
    expect(r.storybookBuildScript).toBe('build-storybook');
    expect(r.hasPackageJson).toBe(true);
  });
});
