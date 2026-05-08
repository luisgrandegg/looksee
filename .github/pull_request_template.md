<!--
  Thanks for contributing to looksee!
  Run `/create-pr` from a Claude Code session to fill this template automatically.
-->

## Summary

<!-- 1–3 sentences. What changed and why. -->

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Chore (refactor, infra, dep bump, docs)
- [ ] Breaking change (requires a major version bump — see ADR-001 and `docs/upgrade.md`)

## Affects the CLI–Action contract?

<!-- Tick if you changed any of: action.yml inputs, src/templates/*, src/lib/files.ts/templates.ts, package.json version, example/'s workflow file. -->

- [ ] Yes — I ran `/verify-templates` and the report is clean
- [ ] No

## Test plan

<!-- A bulleted markdown checklist a reviewer can run locally. -->

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] (if relevant) `/test-init` against a fresh fixture

## Backlog status

<!-- If this PR closes any backlog items, list them here.
     The pre-commit hook ensures backlog/todo and backlog/completed don't drift. -->

- Closes: F-XXX

## Documentation

- [ ] No docs change needed
- [ ] Updated `docs/adoption.md`
- [ ] Updated `docs/troubleshooting.md`
- [ ] Updated `docs/upgrade.md` (required for any breaking change)
- [ ] Updated `CHANGELOG.md`
