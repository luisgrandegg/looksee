import { describe, it, expect } from 'vitest';

import {
  fillWorkflowTemplate,
  defaultActionVersionFromCliVersion,
} from './templates.js';

describe('fillWorkflowTemplate', () => {
  it('replaces all <action-version> placeholders', () => {
    const tmpl = '- uses: luisgrandegg/looksee@<action-version>\n# also: <action-version>';
    expect(fillWorkflowTemplate(tmpl, 'v1')).toBe(
      '- uses: luisgrandegg/looksee@v1\n# also: v1',
    );
  });

  it('returns input unchanged when placeholder is absent', () => {
    const tmpl = 'no placeholder here';
    expect(fillWorkflowTemplate(tmpl, 'v3')).toBe(tmpl);
  });
});

describe('defaultActionVersionFromCliVersion', () => {
  it('returns v1 for 1.x.y', () => {
    expect(defaultActionVersionFromCliVersion('1.2.3')).toBe('v1');
  });
  it('returns v0 for 0.x.y', () => {
    expect(defaultActionVersionFromCliVersion('0.1.0')).toBe('v0');
  });
  it('returns v10 for 10.0.0', () => {
    expect(defaultActionVersionFromCliVersion('10.0.0')).toBe('v10');
  });
  it('throws for non-semver input', () => {
    expect(() => defaultActionVersionFromCliVersion('not-a-version')).toThrow();
  });
});
