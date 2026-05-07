# ADR-003 — CLAUDE.md Context Files for AI Sessions

**Status:** Accepted
**Date:** 2026-05-07

## Context

Looksee is maintained partly by Claude Code sessions and partly by humans. Without persistent project context, every Claude Code session would start cold — risking:

- Inventing dependencies instead of using the five-direct-deps budget.
- Adding a CLI flag without a `--yes` default.
- Hardcoding the action version in the workflow template instead of using the placeholder.
- Missing the Docker-only-baselines warning when writing the troubleshooting doc.

The context injection mechanism must:
- Work out of the box with any Claude Code installation.
- Be readable and editable by anyone, no developer tooling required.
- Be versioned alongside the code it describes.
- Not require external services, authentication, or infrastructure.
- Stay in sync with the codebase — drift is the failure mode.

## Decision

Use **CLAUDE.md** at the repo root as the context-injection surface. Claude Code automatically reads `CLAUDE.md` at session start. The file is plain Markdown, versioned in git, and readable by anyone.

Supporting files live alongside:

- `CONSTITUTION.md` — the guiding principles. Referenced from the top of `CLAUDE.md`.
- `MVP.md` — the spec. Source of truth for what's being built.
- `decisions/` — ADRs (this directory). Referenced from `CLAUDE.md`'s decisions table.
- `.claude/commands/` — slash commands that codify multi-step workflows.

`CLAUDE.md` is short by design — long files don't get read in full. It points to the deeper sources (`CONSTITUTION.md`, `MVP.md`, `decisions/`) rather than duplicating them. The Custom Commands table is the routing layer — agents follow links to the relevant slash command for each workflow.

## Alternatives Considered

**Custom MCP (Model Context Protocol) server**

Would allow querying the action's inputs, the CLI's flag set, or the package version programmatically. Rejected because it requires running a local server process, maintaining server code, and configuring Claude Code to connect to it. Looksee is a developer tool — adding MCP infrastructure on top of it for AI context is more complexity than the project warrants.

**Single global system prompt (injected via Claude API or settings)**

A system prompt is not visible in the repository, not versioned with the code, and cannot be reviewed in a PR. A maintainer modifying conventions would have to update the system prompt separately from the code — the two would drift.

**VSCode workspace settings (`.vscode/settings.json`)**

Editor-specific. Not read by Claude Code's web interface or other editors.

**Comments scattered through source files**

Too scattered. A new contributor would have to read dozens of files to reconstruct what `CLAUDE.md` summarises in one place.

## Consequences

**Positive:**

- Zero infrastructure dependency — no server, no API key, no extra config.
- Works with any Claude Code installation out of the box.
- Versioned in git — convention changes are tracked alongside the code changes they affect.
- Anyone can read and edit `CLAUDE.md` without developer tooling.
- Human-readable — a new contributor can read `CLAUDE.md` as documentation.
- The `/rules-audit` command provides a feedback loop on whether the rules are still working.

**Negative:**

- Context must be maintained manually — when conventions evolve, `CLAUDE.md` must be updated separately from the code. The `/rules-audit` Freshness criterion is the mitigation.
- `CLAUDE.md` can drift from reality if not kept in sync.
- No structured querying — Claude Code reads the file as prose, not as a machine-readable schema.
- Large `CLAUDE.md` files can push toward the context window limit. Mitigation: keep `CLAUDE.md` short and use slash commands for multi-step workflows.
- No programmatic enforcement — `CLAUDE.md` is advisory; Claude Code can still deviate if a user prompt conflicts. Mitigation: critical rules are also enforced by CI gates (lint, typecheck, e2e), pre-commit hooks (backlog consistency), and the `/verify-templates` slash command.
