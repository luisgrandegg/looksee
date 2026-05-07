import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInit } from './commands/init.js';
import { runDoctor } from './commands/doctor.js';
import { log } from './lib/log.js';

function readPackageVersion(): string {
  // dist/index.js is one level above package.json after build; src/index.ts during dev.
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, '..', 'package.json'),
    join(here, '..', '..', 'package.json'),
  ];
  for (const c of candidates) {
    try {
      const json = JSON.parse(readFileSync(c, 'utf8'));
      if (typeof json.version === 'string') return json.version;
    } catch {
      /* try next */
    }
  }
  return '0.0.0-unknown';
}

async function main(): Promise<void> {
  const version = readPackageVersion();
  const program = new Command();

  program
    .name('looksee')
    .description('Self-hosted visual regression testing for Storybook.')
    .version(version, '-v, --version', 'Print the looksee CLI version');

  program
    .command('init')
    .description('Bootstrap a Storybook repo for visual regression testing')
    .option('-y, --yes', 'Skip prompts and accept defaults', false)
    .option('--no-install', 'Skip the package manager install step', false)
    .option('--working-dir <path>', 'Run against a subdirectory (monorepo support)', '.')
    .option(
      '--storybook-output <path>',
      'Override the Storybook build output directory',
      'storybook-static',
    )
    .option(
      '--action-version <ref>',
      "Override the action ref written into the workflow template (default: this CLI's major)",
    )
    .action(async (opts: {
      yes: boolean;
      install: boolean;
      workingDir: string;
      storybookOutput: string;
      actionVersion?: string;
    }) => {
      try {
        const code = await runInit({
          yes: opts.yes,
          install: opts.install,
          workingDir: opts.workingDir,
          storybookOutput: opts.storybookOutput,
          ...(opts.actionVersion !== undefined ? { actionVersion: opts.actionVersion } : {}),
          cliVersion: version,
        });
        process.exit(code);
      } catch (err) {
        reportFatal(err);
        process.exit(2);
      }
    });

  program
    .command('doctor')
    .description('Diagnose common setup issues')
    .option('--working-dir <path>', 'Run against a subdirectory', '.')
    .action(async (opts: { workingDir: string }) => {
      try {
        const code = await runDoctor({
          workingDir: opts.workingDir,
          cliVersion: version,
        });
        process.exit(code);
      } catch (err) {
        reportFatal(err);
        process.exit(2);
      }
    });

  await program.parseAsync(process.argv);
}

function reportFatal(err: unknown): void {
  if (err instanceof Error) {
    log.error(err.message);
    if (process.env['LOOKSEE_DEBUG']) {
      log.dim(err.stack ?? '(no stack)');
    } else {
      log.dim('Re-run with LOOKSEE_DEBUG=1 to see the stack trace.');
    }
  } else {
    log.error(String(err));
  }
}

main().catch((err) => {
  reportFatal(err);
  process.exit(2);
});
