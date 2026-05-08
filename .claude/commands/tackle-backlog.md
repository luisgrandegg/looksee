# /tackle-backlog

Read the active backlog, analyse dependencies between features, then spawn one agent per independent feature — or a coordinator agent when features share foundation code. Monitor until all agents complete.

---

## What to do

### Step 1 — Read the backlog

Read `backlog/backlog.md` and all files in `backlog/todo/` to understand:
- Which features are pending
- Their acceptance criteria and technical notes
- Which area each feature touches (CLI, Action, templates, example, docs, release pipeline)

### Step 2 — Build the dependency graph

For each pending feature, determine:
- Which files it creates or modifies
- Which other features create files it depends on
- Whether it shares foundation code (e.g., a new helper in `src/lib/`) with other features

Classify features as:
- **Independent** — touches only its own files, no shared foundation
- **Dependent** — requires foundation code built by another feature, OR shares files with other features

### Step 3 — Decide on agents

**For independent features:** spawn one `general-purpose` agent per feature with `isolation: "worktree"`. Each agent works on its own branch.

**For dependent features:** spawn one coordinator `general-purpose` agent that:
1. Builds the shared foundation first (committed to the branch)
2. Builds each dependent feature on top, in dependency order
3. Opens a single PR covering all features in the group

When spawning agents, include in the prompt:
- The full contents of the relevant `backlog/todo/` feature file(s)
- The relevant section of `MVP.md` and `CLAUDE.md`
- The branch name to use: `feature/F-XXX-short-name`
- The instruction to run `npm run typecheck && npm run lint && npm test` before committing
- The instruction to complete the backlog item(s) before running `/create-pr`

### Step 4 — Spawn agents

Call the Agent tool for each planned agent. Independent agents can be launched in parallel (`run_in_background: true`). The coordinator agent must run first if its foundation output is needed before independent agents can start.

### Step 5 — Report results

When all agents complete, summarise:
- Which features were implemented
- Which PRs were opened
- Any failures or gaps that need follow-up
