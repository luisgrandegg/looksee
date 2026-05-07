import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  shims: true,
  minify: false,
  // Keep dependencies external so node resolves them at runtime.
  // Bundling CJS deps (commander, prompts, execa) into ESM hits dynamic-require
  // issues. Constitution principle 5 (minimal install footprint) is enforced
  // by keeping the runtime dep list small in package.json — see ADR-002 / Constitution.
  banner: { js: '#!/usr/bin/env node' },
});
