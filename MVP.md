# looksee — MVP Spec

> Visual regression testing for Storybook. Self-hosted, frictionless.
> Repo: `github.com/luisgrandegg/looksee`
> npm: `looksee`
> Action ref: `luisgrandegg/looksee@v1`

## Context

A public, self-hosted visual regression testing toolkit for any team using Storybook. Distributed as a single GitHub repo (`github.com/luisgrandegg/looksee`) that ships **both**:

1. A **CLI** (`npx looksee init`) published to npm — bootstraps a consumer repo in one command
2. A **composite GitHub Action** (`luisgrandegg/looksee@v1`) — the CI piece consumers reference in their workflow

The two are co-versioned and tested together. The CLI's templates always reference an Action version that exists.

No SaaS dependency. Built on Lost Pixel + Playwright + GitHub Actions + Docker.

## Adoption UX target

A consumer's full setup, from zero to first green CI run:

```sh
npx looksee init
npm run vr:baselines    # generates baselines in Docker
git add . && git commit -m "Add visual regression testing"
git push
```

That's it. Three commands. The `init` command does everything else (config, workflow, package.json scripts, .gitignore, dependency install).

## Stack

- **Lost Pixel** (OSS) — screenshotting + diffing
- **Playwright** (chromium only) — installed by the Action
- **GitHub Actions composite action** — CI orchestration
- **Docker** — deterministic baseline generation
- **CLI** — Node 20+, TypeScript, distributed via npm

## Repo structure

```
looksee/
├── action.yml                  # composite Action at repo root (so `uses: luisgrandegg/looksee@v1` works)
├── bin/
│   └── looksee.js              # CLI shim (calls dist/index.js)
├── src/                        # CLI TypeScript source
│   ├── index.ts                # arg parsing, command dispatch
│   ├── commands/
│   │   ├── init.ts             # bootstrap a consumer repo
│   │   └── doctor.ts           # diagnose common setup issues
│   ├── lib/
│   │   ├── detect.ts           # package manager + Storybook detection
│   │   ├── files.ts            # safe file copying with conflict prompts
│   │   ├── package-json.ts     # patch scripts/devDeps without clobbering
│   │   └── log.ts              # consistent CLI output
│   └── templates/              # source-of-truth template files
│       ├── lostpixel.config.ts
│       ├── visual-regression.yml
│       └── docker-baselines.sh
├── example/                    # reference consumer (real Storybook)
│   ├── .storybook/
│   ├── src/
│   ├── package.json
│   └── lostpixel.config.ts
├── docs/
│   ├── README.md               # repo entry: what + why + 3-command quickstart
│   ├── adoption.md             # full guide, including manual setup fallback
│   ├── troubleshooting.md
│   └── upgrade.md              # version compat + breaking changes log
├── .github/workflows/
│   ├── ci.yml                  # CLI unit + integration tests
│   ├── e2e.yml                 # runs Action against example/
│   └── release.yml             # publishes npm + creates GitHub release on tag
├── tsconfig.json
├── package.json
├── LICENSE                     # MIT
├── .gitignore
└── README.md                   # symlink or copy of docs/README.md
```

Single npm package (`looksee`). Single GitHub repo. The Action lives at the repo root so `uses: luisgrandegg/looksee@v1` resolves correctly.

## Components

### 1. CLI — `npx looksee`

Commands:

#### `looksee init`

Interactive by default; supports `--yes` for CI/scripted runs.

Sequence:
1. **Detect** — package manager from lockfile (`package-lock.json` → npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm); Storybook from `.storybook/` directory or `storybook` script in `package.json`
2. **Confirm** — show detected setup and proposed changes; prompt to proceed (`--yes` skips)
3. **Copy templates** — `lostpixel.config.ts` to repo root, `.github/workflows/visual-regression.yml`, `scripts/docker-baselines.sh` (chmod +x). For each, if the file exists, prompt: overwrite / skip / save-as-`.backup`
4. **Patch `package.json`** — add scripts (`vr:test`, `vr:baselines`, `vr:update`); add `lost-pixel` to `devDependencies`. Preserve formatting and existing keys
5. **Patch `.gitignore`** — append `.lost-pixel/current/` and `.lost-pixel/difference/` if not already present (idempotent — grep before append)
6. **Install** — run the detected package manager's install command, unless `--no-install`
7. **Print next steps** — exact commands to run baselines and push

Flags:
- `--yes` / `-y` — skip prompts, accept defaults
- `--no-install` — don't run install
- `--working-dir <path>` — for monorepos, target a subdirectory
- `--storybook-output <path>` — override Storybook build output (default `storybook-static`)
- `--action-version <ref>` — override the Action ref written into the workflow template (default: the CLI's own major version, e.g. CLI `1.x` writes `luisgrandegg/looksee@v1`)

CLI principles:
- **Idempotent** — re-running `init` is safe and reports what's already in place
- **No silent destructive writes** — always prompt or back up before overwriting
- **Clear failure modes** — if Storybook isn't detected, exit with a helpful error pointing to the manual setup section in `adoption.md`
- **Minimal deps** — `commander` (or `yargs`), `prompts`, `picocolors`, `execa`. Keep the install footprint small — every dep is paid for at every `npx` cold-start

#### `looksee doctor`

Diagnostic checks, exit 0 on healthy, non-zero on issues. Each check prints PASS/FAIL with remediation hint.

Checks:
- Storybook detected and `build-storybook` script works
- `lost-pixel` installed
- `lostpixel.config.ts` present and parseable
- Workflow file present at `.github/workflows/visual-regression.yml`
- `.gitignore` excludes `.lost-pixel/current/` and `.lost-pixel/difference/`
- `.lost-pixel/baseline/` exists and is non-empty (warn if empty — they need to run baselines)
- Docker available (warn, not fail — only needed for baseline generation)
- Action version in workflow file matches a tag that exists on the repo (skip if offline)

#### `looksee --version`, `looksee --help`

Standard.

### 2. Composite Action — `action.yml`

Inputs:

| Name | Default | Purpose |
|------|---------|---------|
| `node-version` | `20` | Node version to install |
| `storybook-build-script` | `build-storybook` | npm script that builds Storybook |
| `storybook-output-dir` | `storybook-static` | Where Storybook builds to |
| `working-directory` | `.` | For monorepo subdirs |
| `comment-on-pr` | `true` | Post sticky PR comment on failure |
| `artifact-retention-days` | `14` | Diff artifact retention |

Composite steps:
1. `actions/setup-node@v4` with the input version + cache detection
2. Detect package manager via lockfile and install deps with the right command (`npm ci` / `yarn install --frozen-lockfile` / `pnpm install --frozen-lockfile`)
3. `npx playwright install --with-deps chromium`
4. Run the consumer's storybook build script
5. `npx lost-pixel`
6. On failure: upload `.lost-pixel/difference/` and `.lost-pixel/current/` as artifact (retention from input)
7. On failure (and `comment-on-pr: true`): post sticky PR comment via `marocchino/sticky-pull-request-comment` with run URL + artifact link

The Action does **not** bring its own `lost-pixel` — it shells out to the consumer's locally-installed version. Avoids version mismatch and lets consumers control upgrade timing.

Checkout is the consumer's responsibility (`actions/checkout@v4`) before our Action. Document this in the workflow template.

### 3. Templates (copied by `init`)

**`templates/lostpixel.config.ts`**:

```ts
import type { CustomProjectConfig } from 'lost-pixel';

export const config: CustomProjectConfig = {
  storybookShots: { storybookUrl: './storybook-static' },
  imagePathBaseline: './.lost-pixel/baseline',
  imagePathCurrent: './.lost-pixel/current',
  imagePathDifference: './.lost-pixel/difference',
  threshold: 0.01,
  failOnDifference: true,
  shotConcurrency: 4,
  breakpoints: [375, 1280],
  timeouts: {
    fetchStories: 60_000,
    loadState: 30_000,
    networkRequests: 30_000,
  },
};
```

**`templates/visual-regression.yml`** — `<action-version>` placeholder is filled in by the CLI at copy time:

```yaml
name: Visual Regression
on:
  pull_request:
  push:
    branches: [main]

jobs:
  visual:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: luisgrandegg/looksee@<action-version>
```

**`templates/docker-baselines.sh`**:

```sh
#!/usr/bin/env bash
set -euo pipefail
docker run --rm \
  --platform linux/amd64 \
  -v "$(pwd):/workdir" \
  -w /workdir \
  lostpixel/lost-pixel:latest update
```

### 4. Docs

- **`README.md`** — what looksee is, why self-hosted, the 3-command quickstart (must be exact copy-paste, regularly tested), link to `adoption.md`, badge for npm version + GitHub release.
- **`adoption.md`** — pre-flight (Storybook builds, Docker installed); the CLI flow as the primary path; manual setup fallback for users who can't run the CLI; how to opt out volatile stories (`lostPixel.disable`); how to mask elements (`lostPixel.mask`); how to update baselines.
- **`troubleshooting.md`** — opens with the **font rendering / Docker-only-baselines** warning. Then: Apple Silicon Docker, flaky stories, monorepo setups, large baseline repos, fork-PR comment limitations, "what does `doctor` mean by X."
- **`upgrade.md`** — version compatibility table (CLI ↔ Action), breaking changes log, roadmap (cross-browser, monorepo, auto-update-baselines).

### 5. Example consumer (`example/`)

A real Storybook 8 project with ~5 stories:
- A button (default state)
- A card (default state)
- A story with `parameters.lostPixel.disable: true` — opt-out demo
- A story with `parameters.lostPixel.mask: [...]` — masking demo
- A story with mocked `Date` — determinism rules demo

Used by `e2e.yml` to test the Action against itself. Doubles as a reference consumers can read.

### 6. CI workflows

**`.github/workflows/ci.yml`** — on push/PR:
- CLI unit tests (file patching, package.json mutations, package manager detection)
- CLI integration test: run `init --yes` against a fixture project, snapshot the output

**`.github/workflows/e2e.yml`** — on push/PR, two jobs:
- **`green`** — runs the Action against `example/` with no changes; expects pass
- **`red`** — applies a deterministic visual change to a story via `sed`, runs the Action; expects failure with diff artifact uploaded

**`.github/workflows/release.yml`** — on tag push (`v*`):
- Build CLI
- Publish to npm as `looksee`
- Create GitHub release with auto-generated changelog
- Update the floating major tag (`v1` → latest `v1.x.x`)

## Tasks (sequential)

### Task 0: Pre-flight verification

Before writing any code, verify:
- `npm view looksee` returns 404 (name is available)
- `github.com/luisgrandegg/looksee` does not exist yet
- If either is taken, stop and report back — don't proceed with a colliding name

### Task 1: Repo skeleton
- Initialize repo with `package.json` (name: `looksee`, repo: `git+https://github.com/luisgrandegg/looksee.git`), TypeScript config, MIT license, .gitignore
- Set up Vitest for tests, tsup or unbuild for bundling the CLI to a single file

### Task 2: Example consumer
- Build `example/` as a working Storybook 8 project with the 5 stories described above
- Confirm `npm --prefix example run build-storybook` works locally

### Task 3: Composite Action
- Write `action.yml` with all inputs and steps
- Package manager detection as inline shell (no extra deps)
- Artifact upload + PR comment with `if: failure()` guards

### Task 4: CLI core
- `init` command end-to-end: detect → confirm → copy → patch → install → print
- File copy with conflict-handling (overwrite/skip/backup prompts)
- `package.json` patching that preserves existing formatting (use `sort-package-json` or careful mutation)
- `.gitignore` idempotent append
- Action version in workflow template filled from CLI's own major version

### Task 5: CLI doctor
- All checks listed above
- Clear PASS/FAIL output, exit codes

### Task 6: Templates
- Author the 3 template files in `src/templates/`
- The workflow template uses a placeholder for the Action ref, replaced at copy time

### Task 7: CLI tests
- Unit: file-patching primitives, package manager detection, idempotency
- Integration: spawn `init --yes` against a fixture, assert resulting file tree

### Task 8: E2E workflow
- `green` and `red` jobs
- `red` uses runtime `sed` to inject a deterministic visual change — never commit the change to `example/`

### Task 9: Docs
- `README.md` with copy-pasteable 3-command quickstart
- `adoption.md`, `troubleshooting.md`, `upgrade.md`
- Badges + a clear "how to contribute" section

### Task 10: Release pipeline
- `release.yml` triggered on `v*` tags
- Initial release: `0.1.0`. Templates reference `@v0` during pre-1.0
- Promote to `1.0.0` after one round of external feedback; switch templates to `@v1`

## Acceptance criteria

- [ ] A user with their own Storybook repo can adopt looksee in 3 commands using only the README quickstart.
- [ ] `npx looksee init` is fully idempotent — re-running it on the same repo reports no changes and writes nothing.
- [ ] `npx looksee init --yes` works headlessly (no prompts) — usable in scripts.
- [ ] `npx looksee doctor` correctly diagnoses missing baselines, missing Docker, missing Storybook, broken `.gitignore`, and Action version mismatch.
- [ ] CLI works against npm, yarn, and pnpm consumer repos.
- [ ] CLI never silently overwrites existing files.
- [ ] E2E workflow proves both passing run on no changes and failing run on intentional change with artifact + PR comment.
- [ ] Action inputs are documented in `action.yml` and visible in the GitHub Action UI.
- [ ] Templates reference a tagged Action version that exists at install time.
- [ ] `troubleshooting.md` opens with the Docker-only-baselines warning.
- [ ] Release pipeline publishes both npm package and GitHub release on tag push.

## Out of scope — do NOT build (note in `upgrade.md` roadmap)

- Cross-browser matrix (firefox, webkit)
- Monorepo-aware multi-Storybook discovery (`init --working-dir` is the manual fallback)
- Auto-update baselines via PR comment trigger
- Migration tools from Chromatic / Percy
- A web UI for diff review
- A shared config preset npm package — defaults live in the template directly until there's reason to extract them

## Gotchas to handle

1. **Action ref written by CLI must exist.** If CLI 1.x writes `@v1` into the workflow template, the v1 tag must exist before CLI 1.x is published. Bootstrap order: tag the Action first (or simultaneously via `release.yml`), then publish the CLI that references it. The release workflow must do both atomically.
2. **Package manager detection.** Three lockfiles to detect; install commands differ; `npx` works the same across them. Test all three in CI.
3. **Apple Silicon Docker.** `lostpixel/lost-pixel:latest` may lack arm64. The script must include `--platform linux/amd64`. Document the slowdown.
4. **Storybook 7 vs 8.** Test both. Document the supported range. If 7 breaks, drop it cleanly rather than papering over.
5. **First adoption run.** First CI run sees all stories as "new" with no baselines. Verify Lost Pixel treats this as additions, not failures. Document the expected behavior.
6. **PR comment permissions on fork PRs.** Public-repo fork PRs can't write comments — GitHub Actions security restriction. Document in `troubleshooting.md`. Consider a `pull_request_target` workaround in a follow-up, but not in MVP (security tradeoffs).
7. **`package.json` patching.** Don't clobber the consumer's formatting, comments-as-fields, or unknown keys. Use a minimal diff strategy.
8. **`init` running inside an existing visual-regression setup.** If `lostpixel.config.ts` already exists, prompt rather than overwriting. `doctor` should be the path for repairing an existing setup, not `init`.
9. **CLI bundle size.** Keep dependencies minimal; users hit `npx` cold-start every time. Bundle the CLI to a single file with esbuild/tsup/unbuild.
10. **GitHub Action permissions in template.** Must include `pull-requests: write` for the comment step. Easy to forget; e2e workflow should verify the comment actually posts.

## Verification before announcing v1

1. **Real-user test.** Find a teammate (or stranger from /r/reactjs) with a Storybook repo. Hand them only the README. Time the adoption. If it's over 10 minutes or requires you to explain anything, fix the docs and retry.
2. **Three package managers.** Adopt against one npm, one yarn, one pnpm consumer.
3. **E2E sanity.** Run e2e at the v1 tag. Both jobs must behave as expected.
4. **Cross-OS.** Run adoption on Mac and Linux. Baselines from Mac (via Docker) must match CI byte-for-byte.
5. **Re-adoption.** Run `init` twice on the same repo. Confirm idempotency.
6. **Doctor sanity.** Deliberately break each thing `doctor` checks. Confirm clear diagnostics for each.
