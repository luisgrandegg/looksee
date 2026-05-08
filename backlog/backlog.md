# looksee — Backlog

> Active features. See `backlog/todo/` for full feature specs and `backlog/completed/` for shipped work.
> Pre-commit hook (`scripts/check-backlog-consistency.js`) enforces that no file lives in both `todo/` and `completed/`.

---

## Status legend

- 🔲 **Planned** — not yet started
- 🟡 **In progress** — branch exists, work underway
- ✅ **Done** — shipped on `main`, file moved to `backlog/completed/`

---

## Active features

| ID    | Title                                         | Status   | Area      | Notes |
| ----- | --------------------------------------------- | -------- | --------- | ----- |
| F-001 | CLI: `init` command end-to-end                | 🟡        | CLI       | Detect → confirm → copy → patch → install → print |
| F-002 | CLI: `doctor` command with all checks         | 🟡        | CLI       | Storybook, lost-pixel, config, workflow, .gitignore, baselines, Docker, action ref |
| F-003 | Composite Action with all inputs and steps    | 🟡        | Action    | Node setup, package-manager detection, Playwright, lost-pixel, artifacts, PR comment |
| F-004 | Three template files in `src/templates/`      | 🟡        | Templates | lostpixel.config.ts, visual-regression.yml, docker-baselines.sh |
| F-005 | Example consumer (Storybook 8 with 5 stories) | 🟡        | Example   | Including disable + mask + mocked-Date demos |
| F-006 | E2E workflow (green and red jobs)             | 🔲        | CI        | `red` injects a deterministic visual change at runtime; never commits to `example/` |
| F-007 | Release pipeline (npm + GitHub release + tag) | 🔲        | CI        | `release.yml` triggered on `v*` tag push |
| F-008 | Docs: README, adoption, troubleshooting, upgrade | 🟡     | Docs      | `troubleshooting.md` opens with the Docker-only-baselines warning |
| F-009 | CLI: integration test against a fixture       | 🔲        | Tests     | `npm test` runs `init --yes` against a fixture, snapshots the output |

---

## How to work the backlog

1. Pick an item, branch from `main`: `git checkout -b feature/F-XXX-short-name`.
2. Read the corresponding file in `backlog/todo/` for full spec.
3. Implement and commit on the branch.
4. Run the local gates: `npm run typecheck && npm run lint && npm test`.
5. Run `/complete-feature F-XXX` to move the file and update this index.
6. Run `/create-pr`.
