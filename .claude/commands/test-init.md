# /test-init

Run `looksee init --yes` against a temporary fixture project and assert the resulting file tree matches expectations. Doesn't touch your working copy.

Run this whenever you change `init` or any file under `src/lib/`.

---

## What to do

### Step 1 — Build the CLI

```bash
npm run build
```

If the build fails, stop and report the errors.

### Step 2 — Create a fixture project in a temporary directory

Use Node to create a temp dir (don't shell out to `mktemp` — it's not in the allow list):

```bash
node -e "const os=require('os');const fs=require('fs');const path=require('path');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'looksee-fixture-'));console.log(dir)"
```

Capture the path as `FIXTURE`.

Inside `FIXTURE`, write a minimal Storybook project skeleton using the `Write` tool:

- `package.json` with `name`, `version`, a `build-storybook` script, and `storybook` in devDependencies
- `package-lock.json` (empty `{}` — enough to mark this as npm)
- `.storybook/main.ts` (empty stub — enough for detection)
- A `src/` directory with one trivial `Button.stories.tsx`

### Step 3 — Run `init` against the fixture

```bash
node bin/looksee.js init --working-dir "$FIXTURE" --yes --no-install
```

(`--no-install` skips the package-manager install so the test runs in seconds and offline.)

### Step 4 — Assert the resulting tree

Verify each of the following exists in `FIXTURE` after `init`:

- `lostpixel.config.ts` — content matches `src/templates/lostpixel.config.ts`
- `.github/workflows/visual-regression.yml` — content matches `src/templates/visual-regression.yml` with `<action-version>` substituted to `v<MAJOR>` from `package.json`
- `scripts/docker-baselines.sh` — exists and is executable (or chmod is at least called)
- `package.json` — has scripts `vr:test`, `vr:baselines`, `vr:update`; has `lost-pixel` in `devDependencies`
- `.gitignore` — contains both `.lost-pixel/current/` and `.lost-pixel/difference/`

Read each file with the Read tool and check the contents.

### Step 5 — Idempotency check

Run `init` a second time:

```bash
node bin/looksee.js init --working-dir "$FIXTURE" --yes --no-install
```

The second run must produce no diffs:

- Re-read every file and compare against the snapshot from Step 4 (byte-for-byte equality).
- Print the count of files re-checked.

If anything changed on the second run, that is an idempotency violation — fail the test and report which files differ.

### Step 6 — Clean up

Remove the fixture directory:

```bash
node -e "require('fs').rmSync('$FIXTURE',{recursive:true,force:true})"
```

### Step 7 — Print the report

```
/test-init — looksee

  Build:                       ✅
  Fixture created:             ✅ (<FIXTURE>)
  init --yes ran cleanly:      ✅
  Expected files present:      ✅ / ❌
  Package.json patched:        ✅ / ❌
  Workflow placeholder filled: ✅ / ❌
  Idempotency (2nd run):       ✅ / ❌
  Cleanup:                     ✅

  Overall: PASS / FAIL
```

For each ❌, include the file path and the exact discrepancy.
