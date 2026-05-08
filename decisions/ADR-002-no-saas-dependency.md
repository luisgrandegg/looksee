# ADR-002 — No SaaS Dependency

**Status:** Accepted
**Date:** 2026-05-07

## Context

Visual regression testing has well-established commercial offerings: Chromatic, Percy, Applitools. They are reliable, polished, and feature-rich. They charge per snapshot or per seat, store baselines on their own infrastructure, and require accounts.

Looksee was created because the open-source primitives (Lost Pixel, Playwright, GitHub Actions) are now good enough to deliver the same value without the recurring cost. The hard parts — deterministic browser screenshots, pixel-diff algorithms, CI orchestration — already exist as MIT-licensed software.

The forces at play:

- A small startup pays $19/month for the cheapest commercial tier; the same team a year later pays $400+/month as story count and PR throughput grow.
- Baselines stored in a vendor's database are not portable. Migration is technically possible but rarely done because the tooling for it doesn't exist.
- Vendors' SLA, uptime, and policy changes affect every consumer. A vendor rate-limit change can break CI for thousands of teams overnight.
- A self-hosted toolkit can be deployed in any environment that has GitHub Actions — including air-gapped enterprise networks where SaaS is not allowed at all.
- Telemetry (even anonymous) collected by SaaS tools turns developer behaviour into a vendor-controlled dataset.

## Decision

Looksee has no SaaS dependency. The complete adoption surface is:

| Component | Provider |
|---|---|
| Screenshotting + diffing | Lost Pixel (MIT) — runs locally and in CI |
| Browser | Playwright Chromium (Apache-2.0) — installed by the Action |
| CI orchestration | GitHub Actions (consumer's existing CI) |
| Baseline storage | Consumer's own git repository |
| Diff artifacts | GitHub Actions artifacts (consumer's account) |
| Diff PR comment | `marocchino/sticky-pull-request-comment` (MIT, OSS) |
| Package distribution | npm public registry |

There is no `looksee.io`. There is no `looksee` server. There is no API key. There is no telemetry. No information leaves the consumer's GitHub account or their local machine.

If a future feature would require any of the above, it does not ship in looksee — it ships as a separate, opt-in companion that the consumer affirmatively installs.

## Alternatives Considered

**A free tier of a SaaS service that mirrors looksee's stack**

Rejected because "free tier" is a path to "paid tier" — the business model creates incentives to add friction to the free tier over time. We would not be in control of those incentives.

**A central looksee.io that aggregates anonymous telemetry to inform the roadmap**

Tempting but rejected on principle (Constitution principle 1). Aggregating telemetry shifts the project's relationship with its users — they become a data source. The cost of running the aggregator also creates a structural pressure to monetise. Better to have no telemetry than to have telemetry and resist the pressure.

**A central baseline storage CDN to reduce per-team git LFS usage**

Rejected for now because git LFS is well-established, supported by GitHub, and gives the consumer full ownership. If baseline storage becomes a real pain point for a real consumer (not a hypothetical one), we revisit with a new ADR — but the storage would still need to be hostable by the consumer themselves.

**A Discord/Slack notification integration as an opt-in feature**

Notifications are valuable but they are not part of the toolkit's core value proposition. They live downstream — the consumer's CI sends notifications already, looksee's failures show up there for free.

## Consequences

**Positive:**

- Zero recurring cost for the consumer. Forever.
- Air-gapped and on-prem consumers can adopt looksee without any networking exception.
- No dependency on looksee's maintainers being alive — even if this repo is abandoned, a fork keeps working.
- Easier to reason about: there is no service to monitor, no rate limit to hit, no API to mock in tests.
- Privacy by design: no opportunity for data to leak to a vendor.

**Negative:**

- We cannot offer features that genuinely require centralised state (e.g., cross-team baseline review, organisation-wide analytics). These are out of scope.
- We have no marketing channel to consumers — no in-product upsell, no email list, no telemetry to inform the roadmap. We rely on docs, GitHub stars, and word of mouth.
- The release pipeline is the maintainer's responsibility — there's no SaaS layer that provides "managed updates" to consumers. Consumers pin a version and update on their own schedule.

**Constraint introduced:**

Every PR that adds a new piece of the architecture must answer "Can this run on the consumer's GitHub Actions runner with no external service?" If not, it is rejected or scoped to an opt-in companion.
