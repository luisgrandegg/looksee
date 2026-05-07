# /create-pr

Create a Pull Request for the current branch, then monitor CI until it passes.

---

## What to do

### Step 1 — Complete any finished backlog items

Before creating the PR, check whether this branch implements any feature in `backlog/todo/` or currently listed as Planned in `backlog/backlog.md`.

For each feature completed by this branch:

1. Read the feature file from `backlog/todo/`
2. Append the completion block (date, PR title placeholder, commit SHA, notes)
3. Write the file to `backlog/completed/`
4. Delete the original from `backlog/todo/`
5. Remove the row from `backlog/backlog.md`
6. Commit: `git commit -m "feat(backlog): complete F-XXX — <feature name>"`

**Do not skip this step.** The PR cannot represent done work if the backlog still says Planned.

### Step 2 — Verify gates

Run the local lifecycle gates:

```bash
npm run typecheck
npm run lint
npm test
```

If any fail, stop and ask the user to fix before continuing.

If you changed templates, `action.yml`, or the CLI's template-handling code, also run `/verify-templates` and resolve any drift.

### Step 3 — Verify branch

```bash
git rev-parse --abbrev-ref HEAD
```

If on `main`, stop and tell the user: "You are on the main branch. Create a feature branch first with `git checkout -b feature/description`."

### Step 4 — Ensure changes are committed

```bash
git status
```

If there are uncommitted changes, ask the user if they want to commit them before opening the PR. If yes, stage and commit with an appropriate message.

### Step 5 — Sync with main before pushing

Check whether the branch is behind main and resolve any conflicts before creating the PR:

```bash
git fetch origin main
git merge origin/main
```

**If there are conflicts:**

1. Check conflicting files: `git diff --name-only --diff-filter=U`
2. Resolve each one with `Edit` — keep the feature branch's change unless the base introduced a token, convention, or structural update.
3. For `package-lock.json`: run `git checkout --theirs package-lock.json && npm install`.
4. Commit the resolution: `git commit -m "chore(merge): merge main into <branch>"`

**If there are no conflicts:** proceed directly to push.

```bash
git push -u origin HEAD
```

### Step 6 — Check for existing PR

```bash
gh pr view --json number,url 2>/dev/null
```

If a PR already exists, skip to Step 8.

### Step 7 — Create the PR

Use the PR template from `.github/pull_request_template.md` if it exists. Fill in:

- **Title:** concise, follows conventional commits style (`feat:`, `fix:`, `chore:`)
- **Body:** fill in the template sections based on what changed; include test plan and the impact on the CLI–Action contract if relevant

```bash
gh pr create --title "<title>" --body "<filled template>" --base main
```

### Step 8 — Monitor CI

After the PR is created (or already exists), immediately run `/watch-pr` to monitor CI status.
