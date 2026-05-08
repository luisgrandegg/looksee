# Upgrade Guide

> The CLI version (`looksee` on npm) and the GitHub Action major tag are co-versioned. See [ADR-001](../decisions/ADR-001-co-versioned-cli-and-action.md).
> When you upgrade the CLI, also update the action ref your workflow pins.

---

## Version compatibility table

| CLI version | Action ref | Status | Notes |
|---|---|---|---|
| `0.1.x` | `@v0` | Pre-1.0 — API may change | Initial public release |

---

## How to upgrade

### Within the same major (e.g. 1.2.x → 1.3.x)

```sh
npm install --save-dev looksee@^1
```

The action ref (`@v1`) is a floating major — your CI picks up the new version automatically on the next run. No workflow change needed.

### Across majors (e.g. 1.x → 2.x)

1. Read the breaking changes section below for the target major.
2. Bump the dev dependency:
   ```sh
   npm install --save-dev looksee@^2
   ```
3. Update the workflow ref:
   ```yaml
   - uses: luisgrandegg/looksee@v2
   ```
4. Re-run `npx looksee init` — it will detect existing files, prompt before overwriting, and patch your `package.json` and `.gitignore` if anything changed.
5. Run `npm run vr:test` once to confirm baselines still match. If a major bump changed snapshot dimensions or rendering defaults, regenerate baselines: `npm run vr:baselines`.

---

## Breaking changes log

### 0.x → 1.0 (planned)

Promotion to 1.0 happens after one round of external feedback. Expected changes:

- `action.yml` inputs may be renamed for consistency
- `lostpixel.config.ts` template may change defaults (threshold, breakpoints, timeouts)
- The PR comment format may change

The 1.0 release will ship with a migration script that the CLI runs automatically when an existing 0.x setup is detected.

---

## Roadmap (not in MVP — explicit out-of-scope items from `MVP.md`)

These are features that have been considered and **deliberately deferred**. Each will require its own ADR before implementation.

### Cross-browser matrix

Add Firefox and WebKit to the snapshot matrix. Risk: 3× the flake surface, 3× the CI time. We will revisit when:

1. There is documented Chromium–WebKit visual divergence in a real consumer's bug
2. Lost Pixel's WebKit support has matured beyond beta
3. We have a credible plan to keep flake rates below the current Chromium-only baseline

### Monorepo-aware multi-Storybook discovery

Currently the CLI runs against a single Storybook (`--working-dir` is the workaround). Auto-discovery across pnpm/yarn workspaces is on the roadmap. Will require:

1. A workspace detection layer (read `pnpm-workspace.yaml`, `package.json` `workspaces`)
2. A multi-config emission layer (one workflow per workspace, or a single matrix workflow)
3. A new ADR — current consumer adoption assumes one workflow file, and a matrix could break that contract

### Auto-update baselines via PR comment trigger

Letting a PR author comment `/update-baselines` to regenerate baselines and push back to the PR. Tempting but blocks on:

1. Security: arbitrary comment-triggered writes to a PR is a permission escalation surface
2. Conflict with the existing `vr:baselines` flow — the consumer's local Docker run is the source of truth today

### Migration tools from Chromatic / Percy

A `looksee migrate` command that ingests existing baselines from another vendor. Blocks on:

1. Chromatic and Percy don't expose baseline images via a stable API; the migration would need scraping or a vendor partnership
2. Vendor-specific story metadata (skip lists, mask configs) doesn't map cleanly to lost-pixel parameters
3. The Constitution principle 8 question: even if we could migrate, does the migration code create lock-in for us (commitment to track vendor API changes)?

### Web UI for diff review

A web app where reviewers can step through diffs and accept/reject. Blocks on:

1. Constitution principle 1 — would require either a service we host (no SaaS) or a self-hosted server (real friction). The current GitHub UI flow (artifacts + PR comment) is the closest "no-server" approximation.
2. The cost of building and maintaining a web UI is high relative to the marginal value over downloading the diff artifact.

### Shared config preset npm package

A `@looksee/preset` package consumers extend. Defaults live in the template directly until there is reason to extract them. The MVP rule is: **extract when at least three consumers have customised the same field in the same way**.
