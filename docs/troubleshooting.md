# Troubleshooting

> ⚠️ **Read this first.** The single most common adoption failure is **baselines that drift between local and CI**. The fix is one rule:
>
> **Always generate baselines inside Docker.** Never with `lost-pixel update` on your host machine. Use `npm run vr:baselines` (which calls the Docker script for you).
>
> CI runs in a Linux container with predictable font rendering. Your laptop renders fonts differently — sub-pixel anti-aliasing, hinting, system fallbacks. Baselines generated on macOS or Windows will diff against CI for reasons that have nothing to do with your code. Docker eliminates this.
>
> If your `npm run vr:baselines` is producing baselines that fail in CI, **check that `scripts/docker-baselines.sh` is what's running** — not a stale `lost-pixel update` in another script.

---

## Apple Silicon Docker

`lostpixel/lost-pixel:latest` is built for `linux/amd64`. On Apple Silicon (M1/M2/M3/M4), Docker emulates this via QEMU — slower but functionally identical to CI.

The `scripts/docker-baselines.sh` template includes `--platform linux/amd64` for this reason. Do not remove it.

If the Docker step is unbearably slow on your machine, generate baselines on a Linux box (laptop, VM, or shared dev machine) and commit from there. The cost of one slow baseline run is small compared to the cost of a flaky CI gate.

---

## "lost-pixel reports differences but my code didn't change"

In order of how often it happens:

1. **You generated baselines outside Docker.** Re-generate with `npm run vr:baselines`. Re-commit.
2. **A new Storybook addon changed the canvas chrome.** Storybook's preview iframe sometimes ships a small visual change in a minor upgrade — backgrounds, focus rings. Run `npm run vr:update` once after a Storybook upgrade.
3. **A font is loading at different times.** `lostpixel.config.ts` has a `timeouts.networkRequests` that defaults to 30s. If your Storybook has many fonts, increase it.
4. **A story has time- or random-dependent content.** Pass a fixed `Date` in stories (see `example/src/Receipt.stories.tsx`). Mock `Math.random()` with a Storybook decorator if needed.
5. **A user-uploaded image varies per render.** Mask it with `parameters.lostPixel.mask` (see `example/src/UserAvatar.stories.tsx`).

If you exhaust the list and still see drift, open an issue with the diff artifact attached.

---

## "First CI run reports every story as new"

Expected. The first run uploads every story as a new baseline. The diff is empty because there's nothing to diff against. The Action passes.

The second run (and onward) actually compares against your committed baselines.

If your first run is **failing** instead of passing, you didn't commit the `.lost-pixel/baseline/` directory. Run `npm run vr:baselines`, commit the result, and push again.

---

## "Action says `npx playwright install` failed"

The runner needs system packages for Chromium. The Action runs `npx playwright install --with-deps chromium`, which requires `apt-get` access — included on Ubuntu runners by default.

If you're using a **self-hosted runner**, ensure the runner image has the Playwright dependencies installed. See the [Playwright docs](https://playwright.dev/docs/cli#install-system-dependencies) for the package list.

---

## "PR comment didn't post"

Three possible causes, in order of probability:

1. **The PR is from a fork.** GitHub Actions has a security restriction: workflows triggered by `pull_request` from a fork run with read-only `GITHUB_TOKEN`. The comment step (which writes to the PR) silently no-ops. This is by design — we don't bypass it. Use a `pull_request_target` workflow as a follow-up only if you understand the security tradeoffs (see [GitHub's docs](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/)).
2. **The workflow is missing `pull-requests: write` permission.** The CLI's template includes it; if you copied the file by hand, double-check.
3. **The Action input `comment-on-pr` is `false`.** Default is `true`; verify your workflow.

---

## "Action passes locally but fails in CI"

This is almost always **baselines were not generated in Docker**. See the warning at the top of this doc.

Other less likely causes:

- **Different Node version.** The Action installs Node 20 by default; if you've overridden `node-version` to something exotic, your Storybook build might emit different output.
- **Different `storybook-build-script`.** If your local script does extra work (e.g. running tests first), but the CI invocation skips that, the built Storybook differs.

---

## "Workflow can't find lost-pixel"

The Action shells out to the consumer's locally-installed `lost-pixel` (via `npx`). If the consumer's `node_modules` lookup doesn't include `lost-pixel`, this fails.

Check:
- `lost-pixel` is in `devDependencies` of the package at `working-directory`.
- The install step succeeded — look for the `Install dependencies` step in the run log.
- If you're using Yarn PnP or pnpm with strict hoisting, you may need to expose lost-pixel explicitly.

---

## Large baselines (`.lost-pixel/baseline/` is hundreds of megabytes)

The MVP commits PNG baselines directly to the repo. For very large component libraries this can bloat the repo.

Options:
- Use [git-lfs](https://git-lfs.com/) for `.lost-pixel/baseline/*.png`.
- Reduce snapshot count: drop redundant breakpoints, drop autodocs-only stories.
- Reduce snapshot dimensions: smaller breakpoints in `lostpixel.config.ts` mean smaller PNGs.

A "baselines as artifacts" mode (separate from the consumer's repo) is on the [roadmap](./upgrade.md#roadmap) but not in MVP — it would compromise Constitution principle 8 (no vendor lock-in) if implemented carelessly, so it needs an ADR first.

---

## What does `doctor` mean by …

| Check | What's being verified |
|---|---|
| **Storybook installed** | Either `.storybook/`, a `storybook` script, or a storybook devDep |
| **Storybook build script** | A `build-storybook` script in package.json (the default Storybook 8 generator adds this) |
| **lost-pixel installed** | `lost-pixel` in `dependencies` or `devDependencies` |
| **lostpixel config** | A `lostpixel.config.ts` / `.js` / `.mjs` at the project root |
| **Workflow file** | `.github/workflows/visual-regression.yml` exists and the `<action-version>` placeholder is filled in |
| **.gitignore excludes runtime diffs** | `.lost-pixel/current/` and `.lost-pixel/difference/` both present |
| **Baselines exist** | `.lost-pixel/baseline/` exists and contains at least one PNG |
| **Docker available** | `docker version` succeeds (warn-only — CI doesn't need Docker on the consumer's machine) |
| **Action version matches CLI major** | The `@v<n>` in the workflow matches the CLI's `package.json` major |
