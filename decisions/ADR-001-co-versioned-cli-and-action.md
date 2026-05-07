# ADR-001 — CLI and Action are Co-Versioned in a Single Repo

**Status:** Accepted
**Date:** 2026-05-07

## Context

Looksee ships two artifacts that consumers integrate together:

1. A **CLI** (`looksee init`) published to npm.
2. A **composite GitHub Action** (`luisgrandegg/looksee@v<MAJOR>`) consumed via `uses:` in a workflow.

These two surfaces are not independent. The CLI's templates contain `uses: luisgrandegg/looksee@v<MAJOR>`, so when the CLI runs against a fresh consumer repo, it writes a workflow that references a specific Action major version. If that Action tag does not exist when the CLI is published, the consumer's first CI run breaks immediately.

The forces at play:

- Publishing them as separate repos makes the contract harder to verify — drift between the CLI's expected Action surface and the Action's actual surface would be silent.
- Publishing them as separate npm packages adds a second package to maintain, version, and release.
- Consumers should not have to think about two separate version numbers.
- The Action's `action.yml` must live at the **root** of the repo it's referenced from, since `uses: owner/repo@ref` resolves to `<repo>/action.yml` at the given ref.

## Decision

The CLI and the Action live in a single GitHub repository (`luisgrandegg/looksee`). The repository's root contains `action.yml`. The CLI source lives in `src/`, the bundle in `dist/`, the bin in `bin/`. The npm package name is `looksee`.

**Versioning rule:** The CLI's `package.json` `version` and the Action's floating major tag are co-versioned. CLI `1.x.y` corresponds to Action `v1`. The release pipeline tags both atomically:

1. On `v*` tag push (e.g. `v1.2.0`), `release.yml` builds and publishes the CLI to npm.
2. The same workflow updates the floating major tag (`v1` → the new commit).
3. The same workflow creates a GitHub release.

If any of these steps fails, the others are not committed — there is no mid-release state where the CLI references a tag that doesn't exist.

**Templates rule:** The workflow template (`src/templates/visual-regression.yml`) contains the placeholder `<action-version>`, which the CLI fills in at copy time using its own major version (overridable via `--action-version`).

## Alternatives Considered

**Two separate repos: `luisgrandegg/looksee-cli` (CLI) and `luisgrandegg/looksee-action` (Action)**

Rejected because the contract between the two surfaces would have to be maintained by hand. A change to `action.yml` inputs in the action repo could silently break the CLI's templates in the CLI repo. Drift would not show up until a consumer ran `init` and got a workflow that referenced a non-existent input. Two-repo also doubles the release infrastructure (two `release.yml`, two changelogs, two npm packages or one + a tag) for no consumer benefit.

**Single repo, two npm packages (`@luisgrandegg/looksee` + `@luisgrandegg/looksee-action`)**

The Action doesn't need to be on npm — `uses:` resolves to a Git ref, not an npm package. Adding an npm-published wrapper around the Action would be redundant and would force consumers to think about two version numbers.

**Pin the Action ref to the exact CLI version (`@v1.2.0` instead of `@v1`)**

Rejected because pinning to a patch version means the CLI cannot ship a bug-fix release without re-running `init` for every consumer. Floating to the major version (`@v1`) gives consumers automatic patch + minor updates while still failing fast on a major version change.

## Consequences

**Positive:**

- One repo, one release pipeline, one source of truth for the CLI–Action contract.
- The release workflow can verify in a single job that the CLI's templates and `action.yml` are aligned before tagging anything.
- Consumers see a single version number — what they see in `package.json` matches what they see in their `.github/workflows/visual-regression.yml`.
- Internal contributors can update both surfaces in the same PR, and CI runs the e2e workflow against the proposed combined state.

**Negative:**

- An action surface change requires a CLI release to ship the matching templates. We cannot release Action-only fixes without bumping the CLI version.
- The repo root contains `action.yml`, which is unusual for a node project — newcomers may be confused. Mitigated by the README structure and `CLAUDE.md`.
- Floating major tags can in principle be force-moved by the release workflow. The release workflow must be the only writer; manual tag manipulation is forbidden in `CONSTITUTION.md` shell rules (no `git tag --force` etc. without explicit authorization).

**Constraint introduced:**

A change that touches **either** the CLI's templates **or** `action.yml` triggers the `/verify-templates` slash command as part of `/create-pr`. The release workflow rejects releases where the templates' placeholder is hardcoded or where `action.yml` inputs aren't documented.
