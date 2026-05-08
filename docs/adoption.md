# Adoption Guide

> The fastest path is the three-command quickstart in the [README](../README.md).
> This guide walks through the same flow with explanations, plus the manual
> setup fallback and the most common monorepo / configuration scenarios.

---

## Pre-flight

Before running `looksee init`, confirm:

1. **Storybook builds cleanly.** Run `npm run build-storybook` (or your equivalent) and check that `storybook-static/` is produced. Looksee runs against the built Storybook, so this is a hard prerequisite.
2. **Docker is installed.** Required only for `npm run vr:baselines`. CI does not need it. See [troubleshooting](./troubleshooting.md) for the Apple Silicon caveat.
3. **You're in a clean working tree.** `init` writes files; resolve any uncommitted changes first.

---

## The CLI flow (recommended)

```sh
npx looksee init
```

This is interactive. The CLI:

1. Detects your package manager from your lockfile (`package-lock.json` → npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm).
2. Detects Storybook from `.storybook/` or your `package.json` `storybook` script.
3. Asks to confirm before any writes.
4. Copies these files (with conflict prompts if anything already exists):
   - `lostpixel.config.ts` at the project root
   - `.github/workflows/visual-regression.yml`
   - `scripts/docker-baselines.sh` (chmod +x)
5. Patches `package.json` to add `vr:test`, `vr:baselines`, `vr:update` scripts and `lost-pixel` to `devDependencies`. Existing scripts with the same name but a different command are reported as conflicts and **left untouched**.
6. Patches `.gitignore` (idempotent — only adds patterns that aren't already there).
7. Installs.
8. Prints the next steps.

Then:

```sh
npm run vr:baselines       # regenerates baselines via Docker
git add . && git commit -m "Add visual regression testing"
git push
```

---

## Init flags

| Flag | Default | Effect |
|------|---------|--------|
| `--yes` / `-y` | `false` | Skip prompts, accept defaults. **In `--yes` mode, conflicts skip** — looksee never silently overwrites your files (Constitution principle 4). |
| `--no-install` | `false` | Skip the install step. Useful when you want to inspect the changes before committing dependencies. |
| `--working-dir <path>` | `.` | Run against a subdirectory. The detection, file writes, and patches all happen relative to this path. |
| `--storybook-output <path>` | `storybook-static` | Override the Storybook build output dir. |
| `--action-version <ref>` | CLI's own major | Override the action ref in the workflow template. Useful when you want to pin to a specific tag. |

---

## Doctor

After install — and any time something looks wrong — run:

```sh
npx looksee doctor
```

It reports PASS / WARN / FAIL for each check, with remediation when relevant:

- Storybook installed and `build-storybook` script present
- `lost-pixel` in `devDependencies`
- `lostpixel.config.ts` present
- `.github/workflows/visual-regression.yml` present and has no unfilled placeholder
- `.gitignore` excludes runtime artifacts
- Baselines exist in `.lost-pixel/baseline/` (warn if missing — generate them)
- Docker available (warn, not fail — only needed for `vr:baselines`)
- Action version in workflow matches the CLI's major

---

## Action inputs

The composite Action (`luisgrandegg/looksee@v0` for now, `@v1` after the first stable release) accepts:

| Input | Default | Purpose |
|-------|---------|---------|
| `node-version` | `20` | Node version installed by `setup-node`. |
| `storybook-build-script` | `build-storybook` | The npm script that builds Storybook. Override if you renamed it. |
| `storybook-output-dir` | `storybook-static` | Where Storybook builds to (relative to `working-directory`). |
| `working-directory` | `.` | For monorepos: the subdirectory that owns the Storybook. |
| `comment-on-pr` | `true` | Post a sticky PR comment on failure. No-op on `push` events. |
| `artifact-retention-days` | `14` | How long to keep the diff artifact uploaded on failure. |

---

## Opting stories out

### Disable an entire story

```ts
// MyStory.stories.tsx
export const Animated: Story = {
  parameters: {
    lostPixel: { disable: true },
  },
};
```

Use this for stories that are intrinsically non-deterministic — animations, timers, randomised content. **Prefer fixing determinism over disabling**; the escape hatch is here for cases where it isn't worth fixing.

### Mask a sub-element

```ts
export const WithUserAvatar: Story = {
  parameters: {
    lostPixel: {
      mask: [{ selector: '[data-testid="user-avatar"]' }],
    },
  },
};
```

Use this for content that legitimately varies per render (user-uploaded avatars, randomised IDs, "last seen" timestamps).

See `example/src/VolatileCounter.stories.tsx` and `example/src/UserAvatar.stories.tsx` in this repo for working examples.

---

## Updating baselines

When a visual change is intentional:

```sh
npm run vr:baselines       # regenerate via Docker
git add .lost-pixel/baseline
git commit -m "chore(vr): update baselines after design change"
git push
```

The next CI run will see the new baselines and the diff disappears.

---

## Monorepo setup

If your Storybook lives in a subdirectory (e.g. `apps/web/`), pass `--working-dir`:

```sh
npx looksee init --working-dir apps/web
```

The Action also accepts `working-directory`:

```yaml
- uses: luisgrandegg/looksee@v0
  with:
    working-directory: apps/web
```

For multiple Storybooks across multiple workspaces, run looksee independently in each — each gets its own workflow file. (Auto-discovery across workspaces is on the [roadmap](./upgrade.md#roadmap), not in MVP.)

---

## Manual setup fallback

If `looksee init` doesn't fit your situation (e.g. you're on a non-standard tooling combination), set up by hand:

1. **Install lost-pixel.**
   ```sh
   npm install --save-dev lost-pixel
   ```

2. **Create `lostpixel.config.ts`** at the project root. Copy the file from this repo's `src/templates/lostpixel.config.ts`.

3. **Create `.github/workflows/visual-regression.yml`**. Copy from `src/templates/visual-regression.yml` and replace `<action-version>` with the matching major (currently `v0`).

4. **Create `scripts/docker-baselines.sh`** and `chmod +x` it. Copy from `src/templates/docker-baselines.sh`.

5. **Patch your `package.json`:**
   ```json
   {
     "scripts": {
       "vr:test": "lost-pixel",
       "vr:baselines": "bash scripts/docker-baselines.sh",
       "vr:update": "lost-pixel update"
     }
   }
   ```

6. **Append to `.gitignore`:**
   ```
   .lost-pixel/current/
   .lost-pixel/difference/
   ```

7. **Generate baselines and commit.**

---

## What's next

- Read [troubleshooting.md](./troubleshooting.md) — start there when something is wrong, especially baseline drift between local and CI.
- Read [upgrade.md](./upgrade.md) — version compatibility and the (small, deliberate) roadmap.
