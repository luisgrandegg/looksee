# /rules-audit

Audits the quality of the AI rules that govern this project — `CLAUDE.md`, `CONSTITUTION.md`, `decisions/`, and `.claude/` configuration. Produces a scored report (0–10 per criterion) with concrete improvement actions.

**Run this command as: `/rules-audit`**
No arguments needed. Reads all rule sources automatically.

---

## What to do

### Step 1 — Read all rule sources

Read these files in full before scoring anything:

- `CONSTITUTION.md`
- `CLAUDE.md`
- `MVP.md`
- All files in `decisions/`
- All files in `.claude/commands/`
- `.claude/settings.json`

### Step 2 — Score each of the 8 criteria

Score 0–10. Record specific evidence (file name, section, or line) for every score — never score without citing something concrete.

---

#### C1 — Clarity
Are instructions specific and unambiguous? Penalise vague qualifiers ("as needed", "when appropriate", "consider").

| Score | Meaning |
|-------|---------|
| 0–2 | Rules are abstract — agents must guess intent |
| 3–5 | Mix of clear and vague; key actions underspecified |
| 6–8 | Most rules are actionable; a few edge cases left to interpretation |
| 9–10 | Every rule has a testable, specific condition |

---

#### C2 — Completeness
Do the rules cover all the key scenarios an agent encounters in this project? Check coverage for each:

- Adding a CLI command or flag
- Adding an Action input
- Adding or modifying a template
- Adding a new dependency to the CLI
- Updating the example consumer
- Cutting a release (CLI + Action together)
- Reviewing a PR
- Working with the backlog

| Score | Meaning |
|-------|---------|
| 0–2 | Major categories uncovered |
| 3–5 | Core scenarios covered; release and dependency-budget rules missing |
| 6–8 | Good coverage; minor gaps |
| 9–10 | Every common agent task has explicit guidance |

---

#### C3 — Consistency
Do rules across files agree? Look for contradictions, undefined precedence, or duplicated rules that say different things.

| Score | Meaning |
|-------|---------|
| 0–2 | Direct contradictions between files |
| 3–5 | No direct conflicts but overlapping rules with no clear priority |
| 6–8 | Rules are aligned; scoping mostly clear |
| 9–10 | Each file adds unique scope and never overrides without an explicit note |

---

#### C4 — Actionability
Can an agent take immediate, correct action from the rules without interpretation? Check: code examples present, do/don't pairs, exact commands cited.

| Score | Meaning |
|-------|---------|
| 0–2 | All prose — no examples, no commands, no code snippets |
| 3–5 | Some examples; core workflows lack concrete steps |
| 6–8 | Most rules have examples or commands; a few abstract sections remain |
| 9–10 | Every rule has a code example, a command to run, or an explicit do/don't pair |

---

#### C5 — Enforcement
Are rules backed by automated checks? Would an agent — or a CI run — catch a violation?

| Score | Meaning |
|-------|---------|
| 0–2 | All honour system — no automated gates |
| 3–5 | Some CI gates exist; no pre-commit or slash-command enforcement |
| 6–8 | CI + pre-commit hooks + some slash commands; not all rules gated |
| 9–10 | Every critical rule has a mechanical gate (CI job, hook, or slash command) |

---

#### C6 — Mission alignment
Do technical rules connect back to principles in `CONSTITUTION.md`? Can you trace a technical decision to a named principle?

| Score | Meaning |
|-------|---------|
| 0–2 | Technical rules disconnected from project mission |
| 3–5 | Constitution exists but technical rules don't reference it |
| 6–8 | Some connection; several technical decisions traceable to principles |
| 9–10 | Every significant technical rule traces to a named constitution principle |

---

#### C7 — `.claude/` coverage
Do commands, settings, and hooks in `.claude/` support all workflows described in the rules?

Verify:
- Every command in `CLAUDE.md`'s Custom Commands table has a matching file in `.claude/commands/`
- Every file in `.claude/commands/` is referenced in `CLAUDE.md` (no orphans)
- `settings.json` permissions cover the bash commands the project actually runs
- If any rule describes an automated behaviour (pre-commit, on-merge), check whether it is wired as a hook or workflow

| Score | Meaning |
|-------|---------|
| 0–2 | Commands listed in CLAUDE.md don't exist on disk; settings not configured |
| 3–5 | Core commands present; orphaned or undocumented files; no hooks |
| 6–8 | Good coverage; minor gaps |
| 9–10 | Every listed command exists, every file is documented, settings are appropriate |

---

#### C8 — Freshness
Do the rules match the current state of the codebase? Are there stale references?

Verify:
- Every command in `CLAUDE.md` has a corresponding `.claude/commands/` file
- Every CI gate cited in `CLAUDE.md` matches an actual job in `.github/workflows/`
- ADRs in `decisions/` reference tools and decisions that are still in use
- The Custom Commands table mentions every workflow that has an entry in `.claude/commands/`

| Score | Meaning |
|-------|---------|
| 0–2 | Rules reference non-existent commands or tools |
| 3–5 | Mostly current; a few stale references |
| 6–8 | Rules are current; minor drift |
| 9–10 | Rules perfectly reflect current codebase |

---

### Step 3 — Print the scored report

Use this exact format:

```
/rules-audit — looksee

  C1  Clarity              X/10  [✅|⚠️|❌]
  C2  Completeness         X/10  [✅|⚠️|❌]
  C3  Consistency          X/10  [✅|⚠️|❌]
  C4  Actionability        X/10  [✅|⚠️|❌]
  C5  Enforcement          X/10  [✅|⚠️|❌]
  C6  Mission alignment    X/10  [✅|⚠️|❌]
  C7  .claude/ coverage    X/10  [✅|⚠️|❌]
  C8  Freshness            X/10  [✅|⚠️|❌]

  Overall: X.X / 10

  Legend: ✅ ≥8   ⚠️ 6–7   ❌ <6
```

### Step 4 — Detail improvements for any criterion below 8

For each criterion scoring < 8:

```
─────────────────────────────────────────
IMPROVEMENTS

CX  Name — X/10
    Evidence: [file, section, or specific issue]
    → Action 1
    → Action 2
─────────────────────────────────────────
```

### Step 5 — Offer quick fixes

For mechanical issues (orphaned command file, missing entry in the Custom Commands table), ask:

> "Would you like me to apply these fixes now?"

Apply only if the user confirms. Never apply silently.
