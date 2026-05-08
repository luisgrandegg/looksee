import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execa } from 'execa';

import { detect } from '../lib/detect.js';
import { log, colors } from '../lib/log.js';
import { defaultActionVersionFromCliVersion } from '../lib/templates.js';

export interface DoctorOptions {
  workingDir: string;
  cliVersion: string;
}

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
  remediation?: string;
}

export async function runDoctor(opts: DoctorOptions): Promise<number> {
  const workingDir = resolve(opts.workingDir);
  log.blank();
  log.step('looksee doctor');
  log.dim(`working directory: ${workingDir}`);
  log.blank();

  const detection = detect(workingDir);
  const checks: CheckResult[] = [];

  checks.push(checkStorybook(workingDir, detection));
  checks.push(checkLostPixelInstalled(workingDir));
  checks.push(checkLostPixelConfig(workingDir));
  checks.push(checkWorkflowFile(workingDir));
  checks.push(checkGitignore(workingDir));
  checks.push(checkBaselines(workingDir));
  checks.push(await checkDocker());
  checks.push(checkActionVersion(workingDir, opts.cliVersion));

  for (const c of checks) printCheck(c);

  log.blank();
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warned = checks.filter((c) => c.status === 'warn').length;
  if (failed === 0 && warned === 0) {
    log.success(`All ${checks.length} checks passed.`);
    return 0;
  }
  if (failed === 0) {
    log.warn(`${warned} warning${warned === 1 ? '' : 's'} — review above.`);
    return 0;
  }
  log.error(
    `${failed} check${failed === 1 ? '' : 's'} failed${warned > 0 ? `, ${warned} warning${warned === 1 ? '' : 's'}` : ''}.`,
  );
  return 1;
}

function checkStorybook(workingDir: string, detection: ReturnType<typeof detect>): CheckResult {
  if (!detection.storybookFound) {
    return {
      name: 'Storybook installed',
      status: 'fail',
      detail: 'No .storybook/ directory, no `storybook` script, no storybook dep.',
      remediation:
        'Install Storybook 8 (https://storybook.js.org/docs/get-started/install) and re-run doctor.',
    };
  }
  if (!detection.storybookBuildScript) {
    return {
      name: 'Storybook build script',
      status: 'fail',
      detail: 'No `build-storybook` script in package.json.',
      remediation:
        'Add `"build-storybook": "storybook build"` to package.json scripts (the default Storybook 8 generator does this for you).',
    };
  }
  return {
    name: 'Storybook installed',
    status: 'pass',
    detail: `${detection.storybookEvidence}; build script: \`build-storybook\`.`,
  };
}

function checkLostPixelInstalled(workingDir: string): CheckResult {
  const pkgPath = join(workingDir, 'package.json');
  if (!existsSync(pkgPath)) {
    return {
      name: '`lost-pixel` installed',
      status: 'fail',
      detail: 'No package.json.',
      remediation: 'Run `looksee init` to bootstrap.',
    };
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (pkg.devDependencies?.['lost-pixel'] || pkg.dependencies?.['lost-pixel']) {
    return {
      name: '`lost-pixel` installed',
      status: 'pass',
      detail: `lost-pixel version pin: ${pkg.devDependencies?.['lost-pixel'] ?? pkg.dependencies?.['lost-pixel']}`,
    };
  }
  return {
    name: '`lost-pixel` installed',
    status: 'fail',
    detail: 'lost-pixel not in dependencies or devDependencies.',
    remediation: 'Run `looksee init` (it adds lost-pixel to devDependencies and installs).',
  };
}

function checkLostPixelConfig(workingDir: string): CheckResult {
  const candidates = ['lostpixel.config.ts', 'lostpixel.config.js', 'lostpixel.config.mjs'];
  const found = candidates.find((c) => existsSync(join(workingDir, c)));
  if (!found) {
    return {
      name: 'lostpixel config',
      status: 'fail',
      detail: `No ${candidates.join(' / ')} at the project root.`,
      remediation:
        'Run `looksee init` to copy the default config, or copy `src/templates/lostpixel.config.ts` from the looksee repo manually.',
    };
  }
  return {
    name: 'lostpixel config',
    status: 'pass',
    detail: `${found} present.`,
  };
}

function checkWorkflowFile(workingDir: string): CheckResult {
  const path = join(workingDir, '.github', 'workflows', 'visual-regression.yml');
  if (!existsSync(path)) {
    return {
      name: 'Workflow file',
      status: 'fail',
      detail: 'No .github/workflows/visual-regression.yml.',
      remediation: 'Run `looksee init` to copy the workflow template.',
    };
  }
  const content = readFileSync(path, 'utf8');
  if (content.includes('<action-version>')) {
    return {
      name: 'Workflow file',
      status: 'fail',
      detail: 'visual-regression.yml still contains the `<action-version>` placeholder.',
      remediation:
        'Replace `<action-version>` with the matching major (e.g. `v1`) — or re-run `looksee init`.',
    };
  }
  return {
    name: 'Workflow file',
    status: 'pass',
    detail: '.github/workflows/visual-regression.yml present.',
  };
}

function checkGitignore(workingDir: string): CheckResult {
  const path = join(workingDir, '.gitignore');
  if (!existsSync(path)) {
    return {
      name: '.gitignore excludes runtime diffs',
      status: 'warn',
      detail: 'No .gitignore.',
      remediation:
        'Add `.lost-pixel/current/` and `.lost-pixel/difference/` to a .gitignore at the project root.',
    };
  }
  const content = readFileSync(path, 'utf8');
  const missing: string[] = [];
  if (!content.includes('.lost-pixel/current/')) missing.push('.lost-pixel/current/');
  if (!content.includes('.lost-pixel/difference/')) missing.push('.lost-pixel/difference/');
  if (missing.length > 0) {
    return {
      name: '.gitignore excludes runtime diffs',
      status: 'fail',
      detail: `Missing patterns: ${missing.join(', ')}`,
      remediation: 'Run `looksee init` to patch .gitignore, or add the patterns manually.',
    };
  }
  return {
    name: '.gitignore excludes runtime diffs',
    status: 'pass',
    detail: '.gitignore includes both .lost-pixel/current/ and .lost-pixel/difference/.',
  };
}

function checkBaselines(workingDir: string): CheckResult {
  const dir = join(workingDir, '.lost-pixel', 'baseline');
  if (!existsSync(dir)) {
    return {
      name: 'Baselines exist',
      status: 'warn',
      detail: 'No .lost-pixel/baseline/ directory yet.',
      remediation: 'Generate baselines: `npm run vr:baselines` (requires Docker).',
    };
  }
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    /* empty */
  }
  const pngCount = entries.filter((e) => e.toLowerCase().endsWith('.png')).length;
  if (pngCount === 0) {
    return {
      name: 'Baselines exist',
      status: 'warn',
      detail: 'baseline/ directory exists but contains no PNGs.',
      remediation: 'Generate baselines: `npm run vr:baselines`.',
    };
  }
  return {
    name: 'Baselines exist',
    status: 'pass',
    detail: `${pngCount} baseline image${pngCount === 1 ? '' : 's'} in .lost-pixel/baseline/.`,
  };
}

async function checkDocker(): Promise<CheckResult> {
  try {
    await execa('docker', ['version'], { timeout: 5000 });
    return {
      name: 'Docker available',
      status: 'pass',
      detail: 'docker version reports successfully.',
    };
  } catch {
    return {
      name: 'Docker available',
      status: 'warn',
      detail: 'Docker is not available on this machine.',
      remediation:
        'Docker is only required to generate baselines locally; CI does not need it. Install Docker Desktop if you plan to update baselines from this machine.',
    };
  }
}

function checkActionVersion(workingDir: string, cliVersion: string): CheckResult {
  const workflowPath = join(workingDir, '.github', 'workflows', 'visual-regression.yml');
  if (!existsSync(workflowPath)) {
    return {
      name: 'Action version matches CLI major',
      status: 'fail',
      detail: 'No workflow file to check.',
    };
  }
  const content = readFileSync(workflowPath, 'utf8');
  const match = content.match(/luisgrandegg\/looksee@(v\d+|main|[a-f0-9]{7,40})/);
  if (!match) {
    return {
      name: 'Action version matches CLI major',
      status: 'warn',
      detail: 'No `uses: luisgrandegg/looksee@<ref>` line in the workflow.',
      remediation: 'Re-run `looksee init` to write the standard workflow.',
    };
  }
  const ref = match[1];
  const expected = defaultActionVersionFromCliVersion(cliVersion);
  if (ref !== expected) {
    return {
      name: 'Action version matches CLI major',
      status: 'warn',
      detail: `Workflow references @${ref}; this CLI's major is ${expected}.`,
      remediation:
        'This is fine if you are intentionally pinning to a different major. Otherwise re-run `looksee init` or update the ref manually.',
    };
  }
  return {
    name: 'Action version matches CLI major',
    status: 'pass',
    detail: `@${ref} matches the CLI's major version.`,
  };
}

function printCheck(c: CheckResult): void {
  const tag =
    c.status === 'pass'
      ? colors.green('PASS')
      : c.status === 'warn'
        ? colors.yellow('WARN')
        : colors.red('FAIL');
  log.raw(`  [${tag}] ${colors.bold(c.name)}`);
  log.raw(`         ${colors.dim(c.detail)}`);
  if (c.remediation && c.status !== 'pass') {
    log.raw(`         ${colors.dim('→')} ${c.remediation}`);
  }
}

// Used internally to keep the checks self-contained.
export const _internal = { statSync };
