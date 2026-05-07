# looksee — Constitution

> This document governs every product, design, and technical decision in this repo.
> Agents: read this before acting. If a request conflicts with these principles, flag it before proceeding.

---

## Mission

**Visual regression testing should be free, frictionless, and self-hosted.**

Every team using Storybook has the same problem: a tiny CSS change one floor over silently breaks a dozen components two floors away. Visual regression testing solves that — but the tools that solve it well are commercial SaaS products that charge per snapshot, lock teams into proprietary baselines, and require accounts with a third party that has nothing to do with the code being tested.

There is no technical reason this should cost money. The hard parts — screenshotting, diffing, deterministic browsers — are open source (Lost Pixel, Playwright). The orchestration is free (GitHub Actions). The storage is free (the consumer's own repo). What is missing is the *glue*: a tool that wires these pieces together with such low friction that teams adopt it instead of paying for the SaaS alternative.

**looksee is that glue.** Three commands, no account, no monthly bill, no vendor.

---

## The Problem

Commercial visual regression services follow a familiar arc:

1. Solve a real problem (catch UI regressions before they ship)
2. Lock teams in: baselines stored in the vendor's database, integrations bound to the vendor's API, snapshot history not portable
3. Price per snapshot — making the cost compound with team size, story count, and PR throughput
4. Become hard to leave: migration tools don't exist, baselines must be re-captured, CI integration must be rebuilt

The harm is not incidental. It is the business model. A small startup signs up for $19/month and a year later finds itself paying $4,000/month with no clean exit.

Open-source tooling has existed for years (Lost Pixel, Playwright, BackstopJS). What has been missing is an *adoption experience* good enough that teams choose self-hosted over SaaS without engineer time as a tax. That is what looksee delivers.

---

## Core Principles

Every change in this repository must follow all of these principles. No exceptions without a new ADR.

### 1. No SaaS dependency

The toolkit must work end-to-end with only:
- A consumer's GitHub repo
- GitHub Actions (free for public repos, included in standard plans for private)
- npm (the public registry, no private package server)
- Docker (locally on the consumer's machine, for baseline generation)

No looksee server. No looksee account. No looksee API key. No telemetry sent anywhere. If a feature would require any of these, it does not ship in looksee — it ships as a separate, opt-in companion.

### 2. Frictionless adoption

A consumer must be able to adopt looksee in **three commands**:

```sh
npx looksee init
npm run vr:baselines
git add . && git commit -m "Add visual regression testing" && git push
```

If a feature would add a fourth command, a manual step, or a separate config file, it must justify itself against the friction it adds. Defaults must be the right defaults; flags exist for the minority of consumers whose situation departs from the default.

The README's quickstart must be **exact copy-paste**. It is regularly tested against a real Storybook repo. If the quickstart breaks, the next release fixes it before any other work.

### 3. Idempotent operations

`looksee init` and `looksee doctor` must be safe to re-run any number of times. Re-running `init` reports what is already in place and writes nothing if everything is correct. Re-running `doctor` is read-only by default.

This is enforced by integration tests: every command runs twice in CI. The second run must produce no diffs in the working tree.

### 4. No silent destructive writes

The CLI never overwrites a consumer's existing file without explicit confirmation. For each file that already exists at a target path, the CLI prompts: **overwrite / skip / save-as-`.backup`**. In `--yes` mode, the default is **skip** — never overwrite.

This is non-negotiable. Consumers will adopt the tool only if they trust it not to clobber their work.

### 5. Minimal install footprint

Every dependency in the CLI's runtime is paid for at every `npx` cold-start. The dependency budget is **five direct runtime deps** for the CLI:

- An argument parser
- A prompt library
- A colour library
- A subprocess runner
- One package-json patcher

Adding a sixth requires an ADR. Bundle the CLI to a single file with `tsup` (or equivalent) so the runtime tree is the bundle, not the `node_modules` graph.

### 6. Co-versioned CLI and Action

The CLI and the GitHub Action are co-versioned in this single repo. CLI `1.x` writes templates that reference `luisgrandegg/looksee@v1`; the v1 tag must exist when CLI 1.x is published. The release workflow tags both atomically. See [ADR-001](./decisions/ADR-001-co-versioned-cli-and-action.md).

A change that breaks the CLI–Action contract is a breaking change. It requires a major version bump, a migration note in `docs/upgrade.md`, and an updated example consumer.

### 7. Open source, MIT, public infrastructure

All code is MIT-licensed. Anyone — a freelancer, a 100-person team, a Fortune 500 — can adopt, fork, deploy, and modify the toolkit without paying a fee or asking permission. Governance of the upstream codebase is open. Issues and PRs are visible to all.

The roadmap is also public: it lives in `docs/upgrade.md` and `backlog/backlog.md`. Items not on the roadmap are not silently planned.

### 8. No vendor lock-in for consumers

Baselines live in the consumer's own git repository. Diffs upload as standard GitHub Action artifacts. PR comments use a stock community Action (`marocchino/sticky-pull-request-comment`). Nothing in looksee's design prevents a consumer from migrating to another tool — they own all their data, in standard formats.

If we ever introduce a feature that increases lock-in for the consumer, it must be optional and clearly labelled.

### 9. Determinism above feature breadth

Visual regression testing is only useful if the diffs are real. A flaky baseline is worse than no baseline — it trains teams to ignore the tool. We choose determinism every time it conflicts with feature breadth:

- **One browser (Chromium)** until cross-browser delivers more value than the flake risk it adds
- **Docker for baseline generation** to remove host-OS font rendering differences
- **A single platform (`linux/amd64`)** for both baseline and CI, even when the consumer is on Apple Silicon
- **Threshold defaults tuned conservatively** (`0.01`) — better a few false positives than a missed regression

Every feature that touches determinism must list its flake risk explicitly in the PR description.

### 10. Honest failure modes

When something breaks, the tool must say what broke and how to fix it. `doctor` checks each part of the setup separately and reports remediation per failure. Templates include comments pointing to `docs/troubleshooting.md` for the gotchas (font rendering, Apple Silicon, fork PRs).

No silent fallbacks. No fallthrough behaviour that makes the consumer wonder why their CI run took 30 minutes when nothing was actually checked.

---

## Rules for Agents

When working in this repository, apply the following checks before implementing any feature, change, or refactor.

**On every feature:**
- Ask: "Does this add friction to the three-command quickstart?"
- Ask: "Does this introduce a runtime dependency the consumer didn't have before?"
- Ask: "Does this make the CLI–Action contract harder to verify?"
- Ask: "Does this make the `doctor` output more or less actionable?"

**On the CLI:**
- Confirm any new prompt has a sensible `--yes` default
- Confirm idempotency: a second run on the same input must produce zero diffs
- Confirm the new code path is exercised by an integration test
- Confirm the install footprint hasn't grown without an ADR

**On the Action:**
- Confirm the input is documented in `action.yml` (description, default, required)
- Confirm the new step has an `if:` guard appropriate to the failure surface
- Confirm the consumer doesn't need to change anything about their workflow to keep working

**On templates:**
- Confirm the template is referenced from at least one test
- Confirm any version placeholder is filled in by the CLI at copy time, not at runtime
- Confirm the file copies cleanly into the example consumer

**On docs:**
- Confirm the README quickstart still works exactly as written
- Confirm `docs/troubleshooting.md` opens with the Docker-only-baselines warning
- Confirm `docs/upgrade.md` records any breaking change

**On scope:**
- The scope of looksee is defined by `MVP.md` and the ADRs
- Out-of-scope items (cross-browser matrix, monorepo discovery, auto-update baselines, web UI for diff review, migration from Chromatic/Percy, shared config preset) live in `docs/upgrade.md` under "Roadmap"
- Do not silently begin work on a roadmap item without first opening a backlog entry and an ADR if it changes architecture

---

## Modifying AI Rules

**This block is active only when the current task modifies this file, `CLAUDE.md`, or any file in `decisions/`. Skip it otherwise.**

Run `/rules-audit` before and after any change to AI-governing files. Changes to these files must not reduce any criterion score without an explicit explanation in the PR description.
