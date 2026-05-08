import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { execa } from 'execa';
import prompts from 'prompts';

import { detect, installCommand, type DetectionResult } from '../lib/detect.js';
import { writeFileSafely, patchGitignore, type CopyResult } from '../lib/files.js';
import { patchPackageJson, type PatchResult } from '../lib/package-json.js';
import {
  readTemplate,
  fillWorkflowTemplate,
  defaultActionVersionFromCliVersion,
} from '../lib/templates.js';
import { log, colors } from '../lib/log.js';

export interface InitOptions {
  yes: boolean;
  install: boolean;
  workingDir: string;
  storybookOutput: string;
  actionVersion?: string;
  cliVersion: string;
}

export async function runInit(opts: InitOptions): Promise<number> {
  const workingDir = resolve(opts.workingDir);
  const detection = detect(workingDir);

  log.blank();
  log.step('looksee init');
  log.dim(`working directory: ${workingDir}`);
  log.blank();

  // 1. Detect
  if (!detection.hasPackageJson) {
    log.error('No package.json found.');
    log.dim(
      'looksee init bootstraps an existing Storybook project. From the project root, run again, or pass --working-dir <path> if your package lives in a subdirectory.',
    );
    return 1;
  }

  log.info(`Package manager: ${colors.bold(detection.packageManager)} (${detection.packageManagerEvidence})`);
  if (detection.storybookFound) {
    log.info(`Storybook: ${colors.green('detected')} (${detection.storybookEvidence})`);
  } else {
    log.error('Storybook not detected.');
    log.dim(
      'looksee runs against a Storybook-built project. Add Storybook first (https://storybook.js.org/docs/get-started/install) and re-run, or see docs/adoption.md for the manual setup fallback.',
    );
    return 1;
  }
  log.blank();

  // 2. Confirm
  if (!opts.yes) {
    const proceed = await confirm(
      'Proceed with init? (Will copy templates, patch package.json, patch .gitignore.)',
    );
    if (!proceed) {
      log.warn('Aborted by user.');
      return 1;
    }
  }
  log.blank();

  // 3. Copy templates
  const actionVersion =
    opts.actionVersion ?? defaultActionVersionFromCliVersion(opts.cliVersion);
  const results: CopyResult[] = [];

  log.step('Writing templates');

  results.push(
    await writeFileSafely(
      join(workingDir, 'lostpixel.config.ts'),
      readTemplate('lostpixel.config.ts'),
      { yes: opts.yes },
    ),
  );

  const workflowSrc = readTemplate('visual-regression.yml');
  const workflowOut = fillWorkflowTemplate(workflowSrc, actionVersion);
  results.push(
    await writeFileSafely(
      join(workingDir, '.github', 'workflows', 'visual-regression.yml'),
      workflowOut,
      { yes: opts.yes },
    ),
  );

  results.push(
    await writeFileSafely(
      join(workingDir, 'scripts', 'docker-baselines.sh'),
      readTemplate('docker-baselines.sh'),
      { yes: opts.yes, mode: 0o755 },
    ),
  );

  for (const r of results) printCopyResult(r);
  log.blank();

  // 4. Patch package.json
  log.step('Patching package.json');
  const patch = patchPackageJson(workingDir);
  printPatchResult(patch);
  log.blank();

  // 5. Patch .gitignore
  log.step('Patching .gitignore');
  const giResult = patchGitignore(workingDir);
  if (giResult.status === 'unchanged') {
    log.success('.gitignore already excludes the lost-pixel runtime artifacts.');
  } else {
    log.success(
      `.gitignore ${giResult.status === 'created' ? 'created' : 'patched'}. Added: ${giResult.added.filter((l) => !l.startsWith('#')).join(', ') || '(none)'}`,
    );
  }
  log.blank();

  // 6. Install
  if (opts.install && (patch.devDepsAdded.length > 0 || results.some((r) => r.status === 'created'))) {
    const cmd = installCommand(detection.packageManager);
    log.step(`Running ${cmd.join(' ')}`);
    try {
      await execa(cmd[0]!, cmd.slice(1), { cwd: workingDir, stdio: 'inherit' });
      log.success('Dependencies installed.');
    } catch {
      log.error('Install failed. Re-run manually:');
      log.dim(`  ${cmd.join(' ')}`);
      // Continue — the rest of the report is still useful.
    }
  } else if (!opts.install) {
    log.dim('Skipped install (--no-install).');
  } else {
    log.dim('Nothing new to install.');
  }
  log.blank();

  // 7. Print next steps
  printNextSteps(detection, opts);
  return 0;
}

function printCopyResult(r: CopyResult): void {
  switch (r.status) {
    case 'created':
      log.success(`Created ${r.path}`);
      break;
    case 'overwritten':
      log.success(`Overwrote ${r.path}`);
      break;
    case 'backed-up':
      log.success(`Backed up to ${r.backupPath} and overwrote ${r.path}`);
      break;
    case 'unchanged':
      log.dim(`Already up to date: ${r.path}`);
      break;
    case 'skipped':
      log.warn(`Skipped ${r.path} (existing file left untouched)`);
      break;
  }
}

function printPatchResult(p: PatchResult): void {
  if (!p.changed) {
    log.dim('package.json already up to date.');
    return;
  }
  if (p.scriptsAdded.length > 0) {
    log.success(`Added scripts: ${p.scriptsAdded.join(', ')}`);
  }
  if (p.devDepsAdded.length > 0) {
    log.success(`Added devDependencies: ${p.devDepsAdded.join(', ')}`);
  }
  if (p.scriptsConflicted.length > 0) {
    log.warn(
      `Scripts already defined with a different command — left untouched: ${p.scriptsConflicted.join(', ')}`,
    );
    log.dim('Update them manually if you want them to point at lost-pixel.');
  }
}

async function confirm(message: string): Promise<boolean> {
  const r = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: true,
  });
  return r.value === true;
}

function printNextSteps(detection: DetectionResult, opts: InitOptions): void {
  log.step('Next steps');
  const baselineCmd =
    detection.packageManager === 'npm'
      ? 'npm run vr:baselines'
      : detection.packageManager === 'yarn'
        ? 'yarn vr:baselines'
        : 'pnpm vr:baselines';

  log.raw(`  1. Generate baselines locally (requires Docker):`);
  log.raw(colors.dim('     ') + colors.bold(baselineCmd));
  log.raw(`  2. Commit:`);
  log.raw(colors.dim('     ') + colors.bold("git add . && git commit -m 'Add visual regression testing'"));
  log.raw(`  3. Push and let CI take over.`);
  log.blank();
  log.dim('See docs/adoption.md for monorepo setups, masking, and opt-out per story.');
  log.dim('See docs/troubleshooting.md if baselines drift between local and CI.');

  // Sanity: warn if .github/workflows path may have been skipped
  if (!existsSync(join(opts.workingDir, '.github', 'workflows', 'visual-regression.yml'))) {
    log.warn(
      'visual-regression.yml not found at .github/workflows/. CI will not run until you add it.',
    );
  }
}
