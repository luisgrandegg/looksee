import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve a template file path. Templates ship as plain files under `src/templates/`.
 * In dev (running from src/), `here` is `src/lib/`. In the published package,
 * `here` is `dist/` and templates are relative to the package root via the `files`
 * field. We try both resolutions and return whichever one exists.
 */
export function templatePath(name: string): string {
  // Production layout: dist/index.js, with src/templates/ shipped alongside.
  const fromPackage = join(here, '..', 'src', 'templates', name);
  // Dev layout: src/lib/templates.ts, templates next door at src/templates/.
  const fromDev = join(here, '..', 'templates', name);
  // Some bundlers preserve the import.meta.url to the source location.
  // Try both and return the first that exists.
  try {
    readFileSync(fromPackage, 'utf8');
    return fromPackage;
  } catch {
    return fromDev;
  }
}

export function readTemplate(name: string): string {
  return readFileSync(templatePath(name), 'utf8');
}

/**
 * Replace the `<action-version>` placeholder in the workflow template
 * with the given ref (e.g. `v1`, `v0`, or a custom override).
 */
export function fillWorkflowTemplate(template: string, actionVersion: string): string {
  return template.replace(/<action-version>/g, actionVersion);
}

/**
 * Compute the default action version from the CLI's own package version.
 * "1.2.3" → "v1". "0.1.0" → "v0". This is the major-tag convention enforced
 * by the release workflow (see ADR-001).
 */
export function defaultActionVersionFromCliVersion(cliVersion: string): string {
  const match = cliVersion.match(/^(\d+)\./);
  if (!match || match[1] === undefined) {
    throw new Error(
      `Could not parse CLI version "${cliVersion}" — expected semver like "1.2.3".`,
    );
  }
  return `v${match[1]}`;
}
