import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface DetectionResult {
  workingDir: string;
  packageManager: PackageManager;
  packageManagerEvidence: string;
  storybookFound: boolean;
  storybookEvidence: string | null;
  storybookBuildScript: string | null;
  hasPackageJson: boolean;
}

const LOCKFILES: Array<{ file: string; pm: PackageManager }> = [
  { file: 'pnpm-lock.yaml', pm: 'pnpm' },
  { file: 'yarn.lock', pm: 'yarn' },
  { file: 'package-lock.json', pm: 'npm' },
];

export function detectPackageManager(workingDir: string): {
  pm: PackageManager;
  evidence: string;
} {
  for (const { file, pm } of LOCKFILES) {
    if (existsSync(join(workingDir, file))) {
      return { pm, evidence: `${file} present` };
    }
  }
  // Fallback: npm. We do not infer from `engines` or `packageManager` field —
  // the lockfile is the authoritative signal for which package manager
  // the team actually uses.
  return { pm: 'npm', evidence: 'no lockfile detected — defaulting to npm' };
}

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function readPackageJson(workingDir: string): PackageJson | null {
  const path = join(workingDir, 'package.json');
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }
}

export function detectStorybook(workingDir: string): {
  found: boolean;
  evidence: string | null;
  buildScript: string | null;
} {
  const sbDir = join(workingDir, '.storybook');
  const hasDir = existsSync(sbDir);
  const pkg = readPackageJson(workingDir);

  const buildScript = pkg?.scripts && typeof pkg.scripts['build-storybook'] === 'string'
    ? 'build-storybook'
    : null;

  const hasStorybookScript =
    pkg?.scripts && typeof pkg.scripts['storybook'] === 'string';

  const hasStorybookDep =
    !!pkg?.devDependencies?.['storybook'] ||
    !!pkg?.dependencies?.['storybook'] ||
    !!pkg?.devDependencies?.['@storybook/react'] ||
    !!pkg?.devDependencies?.['@storybook/react-vite'] ||
    !!pkg?.devDependencies?.['@storybook/web-components'] ||
    !!pkg?.devDependencies?.['@storybook/vue3'] ||
    !!pkg?.devDependencies?.['@storybook/svelte'];

  const found = hasDir || hasStorybookScript || hasStorybookDep;

  let evidence: string | null = null;
  if (hasDir) evidence = '.storybook/ directory present';
  else if (hasStorybookScript) evidence = "package.json has a 'storybook' script";
  else if (hasStorybookDep) evidence = 'storybook found in dependencies';

  return { found, evidence, buildScript };
}

export function detect(workingDir: string): DetectionResult {
  const pkg = readPackageJson(workingDir);
  const { pm, evidence: pmEvidence } = detectPackageManager(workingDir);
  const { found, evidence: sbEvidence, buildScript } = detectStorybook(workingDir);

  return {
    workingDir,
    packageManager: pm,
    packageManagerEvidence: pmEvidence,
    storybookFound: found,
    storybookEvidence: sbEvidence,
    storybookBuildScript: buildScript,
    hasPackageJson: pkg !== null,
  };
}

export function installCommand(pm: PackageManager): string[] {
  switch (pm) {
    case 'npm':
      return ['npm', 'install'];
    case 'yarn':
      return ['yarn', 'install'];
    case 'pnpm':
      return ['pnpm', 'install'];
  }
}
