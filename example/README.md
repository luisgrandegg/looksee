# looksee — example consumer

A real Storybook 8 project that exercises the looksee Action end-to-end. The `e2e.yml` workflow at the repo root uses this directory as the test consumer.

## Stories

| Title | What it demonstrates |
|---|---|
| `Components/Button` | A simple deterministic component with three states |
| `Components/Card` | A composed component with variants |
| `Demos/VolatileCounter` | Opting a story out of looksee with `parameters.lostPixel.disable` |
| `Demos/UserAvatar` | Masking a sub-element with `parameters.lostPixel.mask` |
| `Demos/Receipt` | Determinism: passing a fixed `Date` instead of `new Date()` |

## Running locally

```sh
npm install
npm run build-storybook
npm run vr:baselines       # regenerate baselines via Docker
npm run vr:test            # run lost-pixel against the built Storybook
```

## Why this directory exists

It is the smallest plausible consumer of looksee. CI builds it on every PR (`green` job in `e2e.yml`) to confirm the Action still works against a real Storybook. A second job (`red`) injects a deterministic visual change at runtime, runs the Action, and asserts that lost-pixel correctly catches it.

The change in the `red` job is **never committed** — `e2e.yml` runs `sed` against `src/Button.tsx` in the runner only.
