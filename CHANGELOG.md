# Changelog

All notable changes to looksee are recorded here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The CLI version (`package.json`) and the GitHub Action major tag (`v<MAJOR>`) are co-versioned. See [ADR-001](./decisions/ADR-001-co-versioned-cli-and-action.md).

---

## [Unreleased]

### Added

- Initial repo scaffold ported from `luisgrandegg/public-internet`'s Claude Code AI system, adapted to the looksee toolkit domain.
- CLI commands: `init`, `doctor`, `--help`, `--version`.
- Composite GitHub Action at `action.yml`.
- Templates: `lostpixel.config.ts`, `visual-regression.yml`, `docker-baselines.sh`.
- Example consumer at `example/` — Storybook 8 with five reference stories.
- CI workflows: `ci.yml` (lint/typecheck/test), `e2e.yml` (green + red), `release.yml` (npm publish + tag bump).
- Docs: `README.md`, `docs/adoption.md`, `docs/troubleshooting.md`, `docs/upgrade.md`.

## [0.1.0] — 2026-05-07

Pre-1.0 initial release. Templates pin the action ref at `@v0`. The API and the action surface are subject to change before 1.0; consumers adopting at this stage should pin `looksee@~0.1.0` in their dev dependencies and pin the action at `@v0`.
