# Completed Features

This directory holds feature spec files for backlog items that have been shipped on `main`.

When `/complete-feature` runs, it moves a file from `backlog/todo/` to here, prepends a completion block, and removes the row from `backlog/backlog.md`.

---

## Completion block format

The block is prepended to the top of the moved file:

```markdown
---
**Completed:** 2026-MM-DD
**PR:** #NNN — short title
**Commits:** abc1234, def5678
**Notes:** 1–3 sentence summary of what was built, any deviations from the original spec, and any follow-ups created.
---
```

---

## Why we keep these files

- **Provenance.** A future contributor can trace why a feature was built the way it was, without reading the entire git log.
- **Consistency.** The pre-commit hook (`scripts/check-backlog-consistency.js`) blocks commits where the same feature file lives in both `todo/` and `completed/` — so once a file is here, it must not also be in `todo/`.
- **Searchable history.** Grep `backlog/completed/` for a keyword to find every related shipped feature.
