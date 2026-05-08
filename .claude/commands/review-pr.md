# /review-pr

Perform a thorough code review on a Pull Request, post an inline comment for each finding, and submit the review requesting changes.

**Usage:** `/review-pr <PR>` where `<PR>` is one of:
- A full GitHub PR URL: `https://github.com/owner/repo/pull/123`
- A shorthand repo + number: `owner/repo#123`
- A plain PR number (uses current repo): `123`

---

## What to do

### Step 1 — Parse the PR reference

From `$ARGUMENTS`, extract:
- `OWNER` — GitHub org or username
- `REPO` — repository name
- `PR_NUMBER` — pull request number

**Parsing rules:**

- If it matches `https://github.com/<owner>/<repo>/pull/<number>`, extract all three.
- If it matches `<owner>/<repo>#<number>`, extract all three.
- If it is a plain integer, set `PR_NUMBER` to that integer and resolve `OWNER`/`REPO` from the current repo:
  ```bash
  gh repo view --json owner,name
  ```

If the input is empty or cannot be parsed, ask the user: "Please provide a PR reference — a GitHub URL, `owner/repo#number`, or a plain PR number."

---

### Step 2 — Fetch PR metadata

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER
```

Record:
- `title` — PR title
- `body` — PR description
- `head.sha` — head commit SHA (needed for review comments)
- `base.ref` — base branch
- `head.ref` — feature branch
- `user.login` — PR author

If the PR is not found (404), tell the user and stop.

---

### Step 3 — Fetch the changed files and diff

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/files
```

Record `filename`, `status`, `patch` for each. Read the full content of each non-binary, non-removed file using the Read tool.

If a file is too large to read fully, read the changed hunks from `patch` only.

---

### Step 4 — Fetch PR comments and existing reviews

Check what has already been flagged so you don't duplicate findings:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews
```

---

### Step 5 — Perform the review

Review every changed file against the criteria below. For each finding, record:

- `path` — file path (exactly as returned by the files API)
- `line` — the line number on the **right (new) side** of the file
- `side` — always `"RIGHT"`
- `summary` — one sentence: what is wrong
- `detail` — concrete solution: what to change and how

**Review criteria:**

**TypeScript / correctness**
- `any` types or implicit `any` — require explicit types
- Missing return types on exported functions
- Non-null assertions (`!`) without a justifying comment
- `as` casts that bypass safety (prefer type guards)
- Unused imports or variables

**looksee-specific** (for files in `src/`, `bin/`, `action.yml`, or `src/templates/`)
- A new CLI prompt without a `--yes` default
- A non-idempotent code path (two runs would produce different output)
- A new runtime dependency added to `package.json` `dependencies` (each one is paid for at every `npx` cold-start — see Constitution principle 5)
- A breaking change to the CLI–Action contract without a corresponding update to `MVP.md`, the example consumer, or `docs/upgrade.md`
- A template that uses `<action-version>` placeholder but the CLI doesn't fill it in
- A change to `action.yml` inputs that breaks consumers of v1
- An overwriting file write without a confirmation prompt (Constitution principle 4)

**Security**
- `dangerouslySetInnerHTML` (N/A here — flag if introduced)
- `eval()` or `new Function()`
- User-controlled values interpolated into shell commands without quoting
- Secrets leaked into logs, error messages, or artifacts

**Code quality**
- `console.log` left in production CLI code (use the project's log helpers)
- Dead code or commented-out blocks
- Logic that can be simplified significantly
- Missing error handling at system boundaries (subprocess calls, file I/O, network)

**Testing**
- A new code path without a corresponding test
- Tests using `getByTestId` instead of semantic queries (N/A for CLI; flag if introduced for example consumer)
- Implementation-detail assertions

**Do not flag:**
- Style preferences (formatting, naming) enforced by the linter
- Issues already flagged in existing review comments
- Files with `status: "removed"`

---

### Step 6 — Self-assign as reviewer

Resolve the current GitHub user and attempt to add them as a reviewer:

```bash
CURRENT_USER=$(gh api user --jq .login)
```

If `CURRENT_USER` is empty, log "Warning: could not resolve GitHub username — skipping self-assignment" and continue.

Otherwise post the reviewer request:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/requested_reviewers \
  --method POST \
  --field "reviewers[]=$CURRENT_USER"
```

If this returns 422 `"Review cannot be requested from pull request author"`, log "Skipping self-assignment — you are the PR author" and continue. Other errors: report and stop.

Compare `CURRENT_USER` against `user.login` from Step 2. If they match, set `IS_AUTHOR=true`; otherwise `IS_AUTHOR=false`.

If there are **no findings**, tell the user: "No issues found in this PR. You've been added as a reviewer — submit an approval manually if you're satisfied." Stop without posting any review.

---

### Step 7 — Build and post the review

If there are findings, determine the review event:

- `IS_AUTHOR=false`: use `"event": "REQUEST_CHANGES"`
- `IS_AUTHOR=true`: use `"event": "COMMENT"` and prepend this sentence to the review `body`: _"Findings posted as comments — REQUEST_CHANGES is not available when the reviewer is the PR author."_

Post via heredoc:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/reviews \
  --method POST \
  --input - <<'REVIEW_EOF'
{
  "event": "<REQUEST_CHANGES or COMMENT>",
  "commit_id": "<HEAD_SHA from Step 2>",
  "body": "<overall summary — 2–4 sentences>",
  "comments": [
    {
      "path": "<path>",
      "line": <line>,
      "side": "RIGHT",
      "body": "**Issue:** <summary>\n\n**Suggestion:** <detail>\n\n---\n*Co-authored-by: Claude <noreply@anthropic.com>*"
    }
  ]
}
REVIEW_EOF
```

Rules:
- `commit_id` must be set to the `head.sha` value recorded in Step 2.
- `body` at the top level is the overall review summary — write it as prose.
- Each comment `body` must contain the issue, the concrete suggestion, and the `Co-authored-by` attribution footer.
- `line` must be an integer. Verify each line number is within the file's current line count.

If 422 `"pull_request_review_thread.line is not part of the diff"`, re-read the patch for that file, correct the line number, rebuild the heredoc, retry once.

---

### Step 8 — Confirm and report

After a successful post:

```
Review submitted on PR #PR_NUMBER — <REQUEST_CHANGES or COMMENT>

  N comments posted:
  - path/to/file.ts:42 — <one-line summary>
  ...

  View the review: https://github.com/OWNER/REPO/pull/PR_NUMBER
```
