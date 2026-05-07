# /complete-feature

Mark a backlog feature as done. Moves it from `backlog/todo/` to `backlog/completed/`, removes it from the index, and commits.

---

## What to do

### Step 1 — Identify the feature

Ask the user for the feature ID (e.g. `F-004`) if not already provided.

Find the file: `backlog/todo/f-<NNN>-<slug>.md`

### Step 2 — Verify completion criteria

Read the feature file and check each acceptance criterion against the current state of the codebase. For each item:

- ✅ if verifiably done
- ❌ if not done — stop and tell the user what's missing before proceeding

Do not mark a feature complete if any acceptance criteria are unmet. Specifically:

- Code is committed on the current branch
- `npm run typecheck` and `npm run lint` report zero errors
- `npm test` passes
- If the feature touches the CLI–Action contract, `/verify-templates` reports clean

### Step 3 — Append the completion block

Add this block to the **top** of the feature file (before the `# F-XXX` heading):

```markdown
---
**Completed:** <ISO 8601 timestamp — use today's date>
**Notes:** <1–3 sentence summary of what was built, any deviations from spec, and the commit(s) where it landed>
---
```

Update the `**Status:**` line in the file from `🔲 Todo` to `✅ Done`.

### Step 4 — Move the file

Using the Write tool:

1. Write the updated file content to `backlog/completed/f-<NNN>-<slug>.md`
2. Remove the original from `backlog/todo/`:

```bash
git rm backlog/todo/f-<NNN>-<slug>.md
```

### Step 5 — Update the backlog index

Remove the feature's row from `backlog/backlog.md`.

### Step 6 — Commit

```bash
git add backlog/ && git commit -m "feat(backlog): complete F-<NNN> — <feature name>"
```

### Step 7 — Confirm

Tell the user the feature is marked complete and the commit is done. Suggest running `/create-pr` if they're ready to open a PR.
