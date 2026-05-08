# /verify-templates

Sanity-check that the templates copied by `looksee init` are consistent with the current `action.yml`, the example consumer's workflow, the docs, and the CLI's package version.

Run this whenever you change one of:
- `action.yml`
- `src/templates/*`
- `src/lib/files.ts` or any code that reads/writes templates
- `package.json` `version`
- `example/.github/workflows/visual-regression.yml`
- `docs/adoption.md` or `docs/upgrade.md`

---

## What to do

### Step 1 — Read all the contract surfaces

Read in parallel:

- `package.json` — record the `version` and `name`
- `action.yml` — record `inputs` (name, default, description) and the action name
- `src/templates/lostpixel.config.ts`
- `src/templates/visual-regression.yml`
- `src/templates/docker-baselines.sh`
- `src/lib/files.ts` (or wherever templates are copied) — record what gets substituted
- `example/.github/workflows/visual-regression.yml`
- `docs/README.md`
- `docs/adoption.md`
- `docs/upgrade.md`

---

### Step 2 — Check the action version invariant

Extract the major version from `package.json`:

```
PKG_MAJOR = first integer of version, e.g. "1" for "1.2.3", "0" for "0.5.0"
```

For each of these files, find any reference to `luisgrandegg/looksee@v<n>` and assert `<n> === PKG_MAJOR`:

- `src/templates/visual-regression.yml` — should contain the placeholder `<action-version>`, **not** a hardcoded `@v<n>`. Flag if it is hardcoded.
- `example/.github/workflows/visual-regression.yml` — should be `luisgrandegg/looksee@v<PKG_MAJOR>`
- `docs/adoption.md` and `docs/README.md` — quickstart / install snippets should reference `@v<PKG_MAJOR>`
- `docs/upgrade.md` — the latest entry's "Action ref" column should be `@v<PKG_MAJOR>`

Report any mismatch.

---

### Step 3 — Check the action input invariant

Extract every input name from `action.yml`'s `inputs:` block.

For each input, check whether it is documented in `docs/adoption.md` (in a table or list of inputs). Flag any input present in `action.yml` but undocumented, or any documented input that no longer exists.

---

### Step 4 — Check the template content invariant

Confirm:

- `lostpixel.config.ts` exports `config: CustomProjectConfig` (the spec uses this exact name).
- `visual-regression.yml` includes `permissions: pull-requests: write` for the comment step.
- `docker-baselines.sh` includes `--platform linux/amd64` (see Constitution principle 9 / Gotcha 3 in MVP).
- The `vr:test`, `vr:baselines`, and `vr:update` scripts referenced in the templates match what `init` patches into the consumer's `package.json`.

---

### Step 5 — Check the CLI fills in the placeholder

Read `src/lib/files.ts` (or wherever the workflow template is copied) and confirm:

- It reads `visual-regression.yml` from `src/templates/`
- It substitutes `<action-version>` with `v<PKG_MAJOR>` (or the value of `--action-version` if provided)
- It writes to `.github/workflows/visual-regression.yml` in the consumer

Flag if the substitution is missing, or if the placeholder string drifted.

---

### Step 6 — Print the report

```
/verify-templates — looksee

  Action version invariant:    ✅ / ❌
  Action input documentation:  ✅ / ❌
  Template content invariant:  ✅ / ❌
  Placeholder substitution:    ✅ / ❌

  Overall: PASS / FAIL
```

For each ❌, include the file path and the exact discrepancy.

---

### Step 7 — Offer fixes

For mechanical drift (e.g., bumped CLI major but forgot to update `example/`'s workflow), ask:

> "Apply these fixes now?"

If the user confirms, apply them. Never apply silently.
