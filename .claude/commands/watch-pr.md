# /watch-pr

Monitor the CI status of the current branch's Pull Request. Poll until all checks pass or fail, then report and act.

---

## What to do

### Step 1 — Find the PR

```bash
gh pr view --json number,url,state,title,headRefName
```

If no PR exists for the current branch, tell the user and offer to create one (`/create-pr`).

### Step 1.5 — Check for merge conflicts

Before polling CI, check the PR's mergeability:

```bash
gh pr view --json mergeable,mergeStateStatus
```

**If `mergeable` is `CONFLICTING`:**

1. The branch has conflicts with main — resolve them before CI matters.
2. Run `git fetch origin main && git merge origin/main`.
3. Check which files conflict: `git diff --name-only --diff-filter=U`
4. Resolve each conflict using `Edit`:
   - Keep the feature branch's change unless the base introduced a token, convention, or structural update that should take precedence.
   - For `package-lock.json`: run `git checkout --theirs package-lock.json && npm install` to regenerate it.
5. Stage resolved files and commit the merge: `git commit -m "chore(merge): merge main into <branch>"`
6. Push the branch — CI will re-trigger.
7. Continue to Step 2.

**If `mergeable` is `MERGEABLE` or `UNKNOWN`:** proceed to Step 2.

### Step 2 — Poll CI checks and PR status together

```bash
gh pr checks --watch --interval 30
```

While waiting (or after each 30-second interval), also poll the PR mergeability:

```bash
gh pr view --json mergeable,mergeStateStatus
```

**If `mergeable` becomes `CONFLICTING` during polling:**

Stop the CI wait — conflicts must be resolved first, then CI re-runs. Go back to Step 1.5.

### Step 3 — Interpret the final result

After `gh pr checks --watch` exits:

```bash
gh pr checks
gh pr view --json mergeable,mergeStateStatus
```

**If all checks pass AND `mergeable` is `MERGEABLE`:** proceed to Step 3.5.

**If any CI check fails:**

1. Show which check failed and what the error was (`gh run view <run-id> --log-failed`)
2. Diagnose the failure from the log. Common patterns:
   - **Lint/typecheck:** fix the offending code
   - **Unit/integration tests:** read the failing test, fix the implementation
   - **e2e (`green` job failing):** the Action regressed against the example consumer. Read the run log for the exact `lost-pixel` output. If baselines drifted, the change is intentional — update the example baselines and commit. If unintentional, debug.
   - **e2e (`red` job not failing as expected):** the test mutation didn't produce a visual diff. Check the `sed` step in `e2e.yml`.
3. Fix the root cause in the code
4. Commit the fix on the same branch — the push will re-trigger CI
5. Re-run `/watch-pr` to monitor the new run

**If `mergeable` is `CONFLICTING` (even if CI passed):**

1. Run `git fetch origin main && git merge origin/main`
2. Resolve conflicts, push, re-run `/watch-pr`

---

### Step 3.5 — Resolve outstanding review comments

CI passed and the branch is mergeable. Before declaring done, check for unresolved review feedback:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments
```

**Determine which reviews need action:**

- Collect all reviews where `state` is `CHANGES_REQUESTED`.
- Skip any review submitted by the same login as the PR author (a self-review is informational).
- If none, skip to Step 4.

**For each unresolved inline comment:**

Read `path` and `line` to locate the file and line. Read the full file with the Read tool, then apply the fix using Edit:

- If the comment body contains a code block, use that as the replacement.
- If the comment describes a change in prose, apply the minimal fix that satisfies the request.
- If the fix is ambiguous or requires a design decision, skip it and flag it to the user at the end.

**After applying all fixes:**

```bash
git add <changed files>
git commit -m "fix(review): address PR review comments"
```

Push and re-run `/watch-pr` from Step 2.

---

### Step 4 — Done

Once CI passes, `mergeable` is `MERGEABLE`, and there are no outstanding `CHANGES_REQUESTED` reviews, notify the user:

"All CI checks passed and all review comments have been addressed — the PR is ready to merge."

Do not merge the PR unless the user explicitly asks.
