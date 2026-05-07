#!/usr/bin/env node
// CLI shim. The real implementation lives in dist/index.js (built from src/).
// This file exists so that `npx looksee` works without depending on a postinstall step.
import('../dist/index.js').catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[looksee] Failed to start the CLI. Did you run `npm run build`?');
  // eslint-disable-next-line no-console
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
