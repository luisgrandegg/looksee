# Slash Commands — Contributor's Guide

These commands give you guided, step-by-step workflows. Type any command into Claude Code to get started.

---

## Working on the codebase

### `/discover`

**Use when:** You want a quick map of the project — what's where, how things connect, what the current state is.

> Example: `/discover cli` → "Where does `init` decide which package manager to use?"

---

### `/tackle-backlog`

**Use when:** Multiple features are pending in `backlog/todo/` and you want to make progress on several at once.

Claude reads the backlog, builds a dependency graph between features, and spawns one agent per independent feature (or a coordinator agent when features share foundation code).

---

### `/complete-feature`

**Use when:** You've finished a backlog feature and want to mark it as done.

Claude verifies the acceptance criteria are met, moves the feature file to `backlog/completed/`, removes it from the index, and creates the completion commit.

> Example: `/complete-feature` → "F-004 is done"

---

## Shipping work

### `/create-pr`

**Use when:** You're done with a piece of work and want to open a Pull Request.

Claude checks for uncommitted changes, syncs with main, pushes your branch, creates the PR with the right template, then immediately starts monitoring CI.

---

### `/watch-pr`

**Use when:** A PR is open and you want to know if CI has passed.

Claude polls GitHub every 30 seconds. If CI passes, it tells you the PR is ready to review. If something fails, it reads the logs and fixes it. If there are merge conflicts, it resolves them. It also addresses outstanding review comments.

---

### `/review-pr`

**Use when:** You want a thorough code review on a PR — yours or someone else's.

Claude reads every changed file, applies the project's review criteria (TypeScript strictness, security, code quality, testing), and posts inline comments per finding before submitting REQUEST_CHANGES.

> Example: `/review-pr 42` → reviews PR #42 in the current repo

---

## looksee-specific commands

### `/verify-templates`

**Use when:** You changed `action.yml`, a template file in `src/templates/`, or the CLI's template-handling code — and want to confirm the CLI–Action contract is still consistent.

Claude reads the action's inputs, the CLI's template files, the example consumer, and the docs, then reports any drift.

---

### `/test-init`

**Use when:** You changed the `init` command and want to verify it works against a clean fixture without affecting your working tree.

Claude builds the CLI, runs `init --yes` against a temporary fixture project, asserts the resulting file tree, and reports.

---

## Auditing AI rules

### `/rules-audit`

**Use when:** You've modified (or are about to modify) any of the AI-governing files — `CLAUDE.md`, `CONSTITUTION.md`, `decisions/`, or `.claude/commands/`.

Claude reads every rule source, scores 8 quality criteria from 0–10, and produces a concrete improvement report for anything below 8. For mechanical issues (stale command table, orphaned command file), Claude offers to apply fixes automatically.

---

## Environment setup

### `/setup-environment`

**Use when:** Setting up a new machine to work on this project.

Walks you through installing Node, npm, the GitHub CLI, Docker, and verifying all hooks are working — step by step, tailored to your OS.
