# CLAUDE.md — looksee

> This file is automatically read by Claude Code at session start.
> It provides full project context so every session begins with shared understanding.
> **Read this before doing anything else.**

---

## Constitution

**Read [`CONSTITUTION.md`](./CONSTITUTION.md) before anything else.**
Every product, design, and technical decision in this repo is governed by the constitution.
If a request conflicts with the constitution's principles, flag it explicitly before proceeding.

---

## Project Overview

**looksee** is a self-hosted visual regression testing toolkit for any team using Storybook. It is distributed as a single GitHub repo (`github.com/luisgrandegg/looksee`) that ships **both**:

1. A **CLI** (`npx looksee init`) published to npm — bootstraps a consumer repo in one command
2. A **composite GitHub Action** (`luisgrandegg/looksee@v1`) — the CI piece consumers reference in their workflow

The two are co-versioned and tested together. The CLI's templates always reference an Action version that exists.

**Goal:** A team using Storybook can adopt visual regression testing in three commands — no SaaS account, no per-snapshot pricing, no vendor lock-in.

**Target adoption UX:**

```sh
npx looksee init
npm run vr:baselines
git add . && git commit -m "Add visual regression testing"
git push
```

**Stack:** Lost Pixel (OSS) for screenshotting + diffing, Playwright (chromium only) for browser, GitHub Actions composite for CI orchestration, Docker for deterministic baseline generation, Node 20+ TypeScript CLI distributed via npm.

The full spec lives in [`MVP.md`](./MVP.md). Read it before starting any task that touches the CLI, the Action, or the templates.

---

## Repo Structure

```
looksee/
├── action.yml                  # Composite Action at repo root (so `uses: luisgrandegg/looksee@v1` works)
├── bin/looksee.js              # CLI shim — calls dist/index.js
├── src/                        # CLI TypeScript source
│   ├── index.ts                # Arg parsing + command dispatch
│   ├── commands/
│   │   ├── init.ts             # Bootstrap a consumer repo
│   │   └── doctor.ts           # Diagnose common setup issues
│   ├── lib/
│   │   ├── detect.ts           # Package manager + Storybook detection
│   │   ├── files.ts            # Safe file copying with conflict prompts
│   │   ├── package-json.ts     # Patch scripts/devDeps without clobbering
│   │   └── log.ts              # Consistent CLI output
│   └── templates/              # Source-of-truth template files
│       ├── lostpixel.config.ts
│       ├── visual-regression.yml
│       └── docker-baselines.sh
├── example/                    # Reference consumer — real Storybook 8 project
├── docs/                       # README, adoption, troubleshooting, upgrade
├── .github/workflows/          # ci.yml, e2e.yml, release.yml
├── .claude/                    # AI rules — commands and settings
├── decisions/                  # Architecture Decision Records
├── backlog/                    # Active features (todo/, completed/)
├── githooks/                   # Tracked git hooks
├── scripts/                    # Build + consistency scripts
├── CLAUDE.md
├── CONSTITUTION.md
├── MVP.md                      # The full spec — source of truth for what's built
└── package.json
```

The Action lives at the repo root so `uses: luisgrandegg/looksee@v1` resolves correctly. Single npm package (`looksee`). Single GitHub repo.

---

## Architecture Decision Records

Significant architectural decisions are documented in [`decisions/`](./decisions/).
Before making a choice that touches the CLI–Action contract, the templating model, or the publishing pipeline, read the relevant ADR first.

| ADR | Decision |
| --- | -------- |
| [ADR-001](./decisions/ADR-001-co-versioned-cli-and-action.md) | CLI and Action are co-versioned in a single repo |
| [ADR-002](./decisions/ADR-002-no-saas-dependency.md) | No SaaS dependency — Lost Pixel + GitHub Actions only |
| [ADR-003](./decisions/ADR-003-claude-md-context-files.md) | CLAUDE.md context files for AI sessions |

If you are about to make a decision that contradicts an existing ADR, stop and flag it explicitly rather than silently overriding it. If the decision genuinely needs to change, write a new ADR that supersedes the old one.

---

## Development Lifecycle

**Never commit directly to `main`.** All changes go through a Pull Request. Branch protection enforces this.

### Branch Naming

| Type       | Pattern                     |
| ---------- | --------------------------- |
| Feature    | `feature/F-XXX-short-name`  |
| Fix        | `fix/short-description`     |
| Chore      | `chore/short-description`   |

### Workflow

1. **Sync main first** — `git checkout main && git pull origin main`
2. **Install dependencies** — `npm install`
3. **Start a branch** — `git checkout -b feature/F-XXX-description`
4. **Work and commit** — conventional commits on the branch
5. **Create a PR** — use `/create-pr` at the end of the session
6. **Wait for CI** — use `/watch-pr` to monitor; Claude polls every 30 seconds
7. **Merge** — only after CI passes and PR is approved

### CI Gates (run on every PR)

- `npm run lint` — zero ESLint errors
- `npm run typecheck` — zero TypeScript errors (strict mode)
- `npm run build` — CLI bundles cleanly with tsup
- `npm test` — Vitest unit + integration suite passes
- `e2e.yml` — runs the Action against `example/` (green and red jobs)

### Versioning and Release

- The CLI's `package.json` `version` and the Action's floating major tag (`v1`) are co-versioned. See [ADR-001](./decisions/ADR-001-co-versioned-cli-and-action.md).
- Templates copied by `init` reference `luisgrandegg/looksee@v<MAJOR>` where `<MAJOR>` matches the CLI version that wrote them.
- Releases are triggered by pushing a `v*` tag. `release.yml` publishes to npm, creates the GitHub release, and updates the floating major tag — all atomically.

---

## Custom Commands

Slash commands live in `.claude/commands/`. Use them to start guided workflows:

| Command                | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `/create-pr`           | Create a PR for the current branch and start CI watch                      |
| `/watch-pr`            | Poll CI on the current PR; fix failures automatically                      |
| `/review-pr`           | Review a PR, post inline comments per finding, submit REQUEST_CHANGES      |
| `/rules-audit`         | Score the quality of AI rules across 8 criteria                            |
| `/tackle-backlog`      | Spawn one agent per backlog feature                                        |
| `/complete-feature`    | Mark a backlog feature as done                                             |
| `/discover`            | Explore the project's structure and answer a focused question              |
| `/setup-environment`   | Set up a fresh dev machine                                                 |
| `/verify-templates`    | Sanity-check templates against `action.yml` and the docs                   |
| `/test-init`           | Run `looksee init` against a fixture and verify the output                 |

See `.claude/commands/commands-readme.md` for short descriptions intended for new contributors.

---

## Co-Versioning Rule

**The CLI and the Action must always reference each other consistently.** This is a hard rule — see [ADR-001](./decisions/ADR-001-co-versioned-cli-and-action.md).

A change is consistent when **all** of these are true:

1. `package.json` version matches the major tag the workflow template embeds (CLI `1.x` → template references `@v1`).
2. The Action `v<MAJOR>` tag exists at the time the CLI is published. The release workflow tags both atomically.
3. `src/templates/visual-regression.yml` uses the placeholder `<action-version>`, replaced by the CLI at copy time using the CLI's own major version (overridable via `--action-version`).
4. The `example/` consumer's workflow references the same major as the CLI's templates write.

If a task touches either the CLI's version or the Action surface, run `/verify-templates` before committing. The release workflow rejects mismatches.

---

## Backlog

Current feature status is always in [`backlog/backlog.md`](./backlog/backlog.md).
Check it before starting work to understand what's done, in progress, and pending.

### When to complete a backlog item

**"Completing a feature" means: all code for the feature is committed, all lifecycle gates pass locally, and you are about to open a PR.**

Specifically, complete the backlog item when **all of the following are true**:
- The feature's code is committed on the current branch
- `npm run typecheck` and `npm run lint` report zero errors
- `npm test` passes
- You are about to run `/create-pr`

If you forget and open the PR first, complete the backlog item in a follow-up commit on the same branch before it merges.

### How to complete a backlog item

Follow these steps **in order** — the pre-commit hook enforces consistency:

1. Append the completion block to the feature file (see `backlog/completed/README.md`)
2. Copy the file to `backlog/completed/`
3. **Delete** the original from `backlog/todo/` — leaving it in both places will block the commit
4. Remove the row from `backlog/backlog.md`
5. **Create a git commit** — every completed feature gets its own commit:
   ```
   git commit -m "feat(backlog): complete F-XXX — <feature name>"
   ```

> The pre-commit hook checks that no file exists in both `backlog/todo/` and `backlog/completed/`.
> If you see a backlog consistency error at commit time, delete the file from `backlog/todo/`.

---

## Shell Command Rules

This project's CI and dev workflow uses the npm ecosystem. **Follow these rules to avoid triggering permission prompts:**

- **Never prefix commands with `cd path && ...`** — run commands directly from the working directory.
  The shell is already in the project root; chaining `cd` causes the permission system to misclassify the command.
- **Use `git -C <path>`** if an explicit path is needed, not `cd <path> && git ...`.
- **Avoid shell builtins or utilities not in the allow list** (`cp`, `mv`, `mkdir`, `rm`, etc.).
  Use the dedicated file tools (`Write`, `Edit`, `Read`, `Glob`) instead — they never prompt.
- **Allowed Bash commands and the subcommands used in this project:**

  | Command  | Allowed subcommands |
  | -------- | ------------------- |
  | `git`    | `status`, `diff`, `add`, `commit`, `push`, `pull`, `fetch`, `merge`, `log`, `checkout`, `branch`, `rev-parse`, `stash`, `cherry-pick`, `config`, `rm`, `tag`, `-C` |
  | `npm`    | `install`, `ci`, `run`, `test`, `publish`, `version`, `pack`, `view` |
  | `npx`    | any — for running `tsup`, `tsc`, `vitest`, `lost-pixel`, `playwright` |
  | `gh`     | `pr view`, `pr create`, `pr checks --watch --interval 30`, `run view --log-failed`, `repo edit`, `api`, `release create`, `release list` |
  | `node`   | any |
  | `jq`     | any — for parsing JSON output from `gh` commands |
  | `chmod`  | `+x` |
  | `docker` | `run`, `pull`, `version`, `info` |

  Commands not in this table require user confirmation before running.

---

## Modifying AI Rules

**This section applies only when the current task involves editing one of these files:**
- `CLAUDE.md`
- `CONSTITUTION.md`
- Any file in `decisions/`
- Any file in `.claude/commands/`

**If none of those files are being modified, skip this section — it is irrelevant context.**

When modifying AI rules:

1. Run `/rules-audit` before making changes to record the baseline score.
2. Make your changes.
3. Run `/rules-audit` again to confirm the score improved or did not regress.
4. Include the before/after scores in the PR description.
