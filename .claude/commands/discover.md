# /discover

Explore this repo — its CLI, Action, templates, and example consumer — and produce a structured discovery report.

---

## Arguments

```
/discover [scope] [free-text query]
```

- `[scope]` — optional. One of: `cli`, `action`, `templates`, `example`, `docs`, `all` (default: `all`).
- `[free-text query]` — optional. What to look for. If omitted, explore freely based on all available context.

---

## What to do

### Step 1 — Parse arguments

Split `$ARGUMENTS` on the first whitespace boundary:
- First token → `SCOPE` (default to `all` if missing or not a recognised scope)
- Everything after → `QUERY` (may be empty)

If the first token is not a known scope, treat the entire argument as `QUERY` and set `SCOPE` to `all`.

---

### Step 2 — Load project context

Read these in parallel (skip gracefully if a file is missing):

1. `CONSTITUTION.md` — repo mission and principles
2. `CLAUDE.md` — project-scoped rules
3. `MVP.md` — the spec
4. `package.json` — scripts, dependencies, version
5. `README.md`

Summarise internally what you learned (not printed yet) covering the project's stated purpose, its current maturity, and any constitution constraints relevant to the requested scope.

---

### Step 3 — Determine discovery files based on scope

| Scope | Files / globs |
|---|---|
| `cli` | `bin/looksee.js`, `src/**/*.ts` |
| `action` | `action.yml`, `.github/workflows/**/*.yml` |
| `templates` | `src/templates/*` |
| `example` | `example/**/*` |
| `docs` | `docs/**/*.md`, `README.md` |
| `all` | everything above |

Use Glob to enumerate matching files. Read each file in parallel.

---

### Step 4 — If a query is provided, focus the exploration

Examples:
- "where does init decide which package manager to use?" → trace `src/lib/detect.ts` and where `init.ts` calls it
- "what does the Action do on failure?" → read `action.yml` step by step
- "where does the action version placeholder get replaced?" → grep for `<action-version>`

---

### Step 5 — Static code exploration

Use Read, Grep, and Glob to explore the relevant files. Collect facts:

- **CLI structure:** which files implement which commands? Which library does each command depend on?
- **Action structure:** what inputs does it accept? What conditional steps does it have?
- **Templates:** what placeholders need filling? Who fills them?
- **Example:** how does it exercise the Action? What stories does it ship with?
- **Docs:** what's the canonical 3-command quickstart? Does troubleshooting open with the Docker warning?
- **Gaps / TODOs:** search for `TODO`, `FIXME`, `XXX`, `HACK`

Do not limit yourself to a fixed list — follow the code.

---

### Step 6 — Produce the discovery report

Output a structured report. Tailor depth to what was found:

```markdown
## Discovery Report — looksee (<SCOPE>)

**Date:** <today's date>
**Query:** <QUERY or "free exploration">

---

### Overview
<2–4 sentences: what this scope covers, how mature it is, how it aligns with the constitution>

### Structure
<File map for the scope, with one-line descriptions>

### CLI–Action Contract
<For all/cli/action scopes: how the CLI fills in the action version, where the contract is enforced, where it could drift>

### Templates
<For all/templates scopes: the three templates, what each needs from the CLI at copy time, how they're tested>

### Example Consumer
<For all/example scopes: the stories that ship, the workflows it uses, what it proves>

### Current State
<What's built and working, what's stubbed or pending — cross-reference backlog>

### Gaps & TODOs
<Stubs, MOCK data, FIXME comments, missing pieces>

### Constitution Alignment
<How well this scope honours the relevant principles>
<Flag any violations or risks>
```

If the discovery was focused on a `QUERY`, include:

```markdown
### Answer to: "<QUERY>"
<Direct answer, with file references and line numbers where relevant>
```

---

### Step 7 — Offer next steps

After the report, suggest 1–3 follow-up actions. Examples:

- "There are 2 stubbed tests in `src/commands/init.test.ts` — fill them in before the next release."
- "The example consumer's workflow references `@v0` but the CLI is now writing `@v1` — fix the example."
- "`docs/troubleshooting.md` doesn't open with the Docker-only-baselines warning — Constitution principle 10."
