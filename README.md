# looksee

> Self-hosted visual regression testing for Storybook. Three commands and you're done.

[![npm version](https://img.shields.io/npm/v/looksee.svg)](https://www.npmjs.com/package/looksee)
[![GitHub release](https://img.shields.io/github/v/release/luisgrandegg/looksee.svg)](https://github.com/luisgrandegg/looksee/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## What is looksee?

A toolkit that wires [Lost Pixel](https://github.com/lost-pixel/lost-pixel) + Playwright + GitHub Actions + Docker into a complete visual regression testing setup for any Storybook project — with **no SaaS dependency**, no per-snapshot pricing, and no vendor lock-in.

Adoption is three commands. Baselines live in your own repo. Diffs upload as GitHub Action artifacts to your own account.

---

## Quickstart

```sh
npx looksee init
npm run vr:baselines
git add . && git commit -m "Add visual regression testing" && git push
```

That's it. Your next pull request will fail CI on any visual regression in your Storybook stories.

The `init` command:

1. Detects your package manager (`npm` / `yarn` / `pnpm`) from your lockfile.
2. Detects Storybook from your `.storybook/` directory or `package.json` `storybook` script.
3. Copies a `lostpixel.config.ts`, a `.github/workflows/visual-regression.yml`, and a `scripts/docker-baselines.sh`.
4. Patches your `package.json` to add `vr:test`, `vr:baselines`, `vr:update` scripts and `lost-pixel` to your devDependencies.
5. Patches your `.gitignore` to exclude runtime diff artifacts.
6. Installs.

Re-running `init` is safe — see [Constitution principle 3](./CONSTITUTION.md). It writes nothing if everything is already in place.

---

## Why self-hosted?

- **No recurring cost.** Forever.
- **No account.** Nothing to sign up for. No API key to manage.
- **No data leaves your account.** Baselines in your repo, diffs in your GitHub artifacts, comments on your PRs — all under your control.
- **No telemetry.** We don't know who's using looksee or how. We rely on docs and word of mouth.

See the [Constitution](./CONSTITUTION.md) for the full set of principles.

---

## What's inside

```
looksee/
├── action.yml                  # The composite Action consumed via `uses:`
├── bin/looksee.js              # CLI shim
├── src/                        # CLI TypeScript source
├── example/                    # Reference Storybook 8 consumer
├── docs/                       # adoption.md, troubleshooting.md, upgrade.md
└── ...
```

The CLI and the GitHub Action are **co-versioned** in this single repo (see [ADR-001](./decisions/ADR-001-co-versioned-cli-and-action.md)). When you install `looksee@1.x` from npm, the templates it writes reference `luisgrandegg/looksee@v1` — guaranteed to exist.

---

## Documentation

- **[Adoption guide](./docs/adoption.md)** — full walkthrough including the manual setup fallback
- **[Troubleshooting](./docs/troubleshooting.md)** — start here when something is wrong (especially baseline drift between local and CI)
- **[Upgrade guide](./docs/upgrade.md)** — version compatibility table, breaking changes, roadmap

---

## Commands

```sh
looksee init                # Bootstrap a Storybook repo for visual regression testing
looksee doctor              # Diagnose common setup issues
looksee --help              # Show help for any command
looksee --version           # Print version
```

Flags for `init`:

| Flag | Default | Effect |
|------|---------|--------|
| `--yes` / `-y` | `false` | Accept defaults, don't prompt |
| `--no-install` | `false` | Skip the package-manager install step |
| `--working-dir <path>` | `.` | Run against a subdirectory (monorepo support) |
| `--storybook-output <path>` | `storybook-static` | Override the Storybook build output dir |
| `--action-version <ref>` | CLI's own major | Override the Action ref written into the workflow template |

---

## Action inputs

When the `init` command writes your workflow file, the Action accepts these inputs:

| Input | Default | Purpose |
|-------|---------|---------|
| `node-version` | `20` | Node version to install |
| `storybook-build-script` | `build-storybook` | npm script that builds Storybook |
| `storybook-output-dir` | `storybook-static` | Where Storybook builds to |
| `working-directory` | `.` | For monorepo subdirs |
| `comment-on-pr` | `true` | Post sticky PR comment on failure |
| `artifact-retention-days` | `14` | Diff artifact retention |

---

## Contributing

See [`CLAUDE.md`](./CLAUDE.md) for the development lifecycle and [`backlog/backlog.md`](./backlog/backlog.md) for what's pending. New contributors: run `/setup-environment` from a Claude Code session for a guided OS-aware setup.

The full project spec is in [`MVP.md`](./MVP.md).

---

## Licence

MIT — see [`LICENSE`](./LICENSE).
