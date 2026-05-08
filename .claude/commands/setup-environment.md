# /setup-environment

Guide the user through setting up their local development environment for this repo from scratch. Detect their OS and tailor every step accordingly. Be conversational — check in after each major step before proceeding.

---

## What to do

### Step 1 — Detect OS

Ask the user which OS they are on if not already known:

- **macOS** → use Homebrew / curl installer
- **Linux** → use the distro's package manager
- **Windows** → use winget or the MSI installer

---

### Step 2 — Install Node 20+

Looksee requires Node 20 or later. Recommend `nvm` (or `volta`) to pin versions per project.

**macOS / Linux (nvm):**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart terminal, then:
nvm install 20
nvm use 20
```

**Windows (winget):**

```powershell
winget install OpenJS.NodeJS.LTS
# Restart terminal to reload PATH
```

Verify:

```bash
node -v   # v20.x.x or higher
npm -v
```

---

### Step 3 — Install Docker

Docker is required only for generating baselines locally. CI does not need Docker on the consumer's machine.

**macOS:** Install Docker Desktop from `https://docs.docker.com/desktop/install/mac-install/`.

**Linux:** Follow the engine install for your distro (`https://docs.docker.com/engine/install/`).

**Windows:** Install Docker Desktop with WSL2 backend (`https://docs.docker.com/desktop/install/windows-install/`).

Verify:

```bash
docker version
docker info
```

---

### Step 4 — Install jq

`jq` is used by hooks and `gh` workflows for JSON parsing.

**macOS:** `brew install jq`
**Linux:** `apt install jq` / `dnf install jq` / `pacman -S jq`
**Windows:** `winget install jqlang.jq`

Verify: `jq --version` (1.6+)

---

### Step 5 — Install GitHub CLI and authenticate

The GitHub CLI (`gh`) is required for creating PRs, reviewing issues, and the release workflow.

**macOS (Homebrew):** `brew install gh`
**Linux:** see `https://github.com/cli/cli/blob/trunk/docs/install_linux.md`
**Windows (winget):** `winget install GitHub.cli`

Authenticate:

```bash
gh auth login
```

Follow the prompts:

1. Select **GitHub.com**
2. Select **HTTPS**
3. Select **Login with a web browser** (or paste a token if on a headless machine)
4. Copy the one-time code shown, press Enter — your browser will open
5. Paste the code and authorise

Verify: `gh auth status`

---

### Step 6 — Clone the repo and install dependencies

```bash
git clone https://github.com/luisgrandegg/looksee
cd looksee
npm install
```

Expected: no errors, `package-lock.json` unchanged.

---

### Step 7 — Build the CLI

```bash
npm run build
```

This bundles `src/index.ts` to `dist/index.js` via tsup.

---

### Step 8 — Install the git hooks path

```bash
git config core.hooksPath githooks
```

Test that the pre-commit hook rejects backlog inconsistencies:

```bash
git commit --allow-empty -m "chore(setup): verify hooks work"
# Expected: passes — then `git reset HEAD~1` to undo the test commit
```

---

### Step 9 — Verify lifecycle gates

```bash
npm run lint       # ESLint — should pass
npm run typecheck  # tsc --noEmit — should pass
npm test           # Vitest — should pass
```

---

### Step 10 — Try the example consumer

```bash
cd example
npm install
npm run build-storybook
```

Expected: Storybook builds to `example/storybook-static/`.

---

### Troubleshooting

| Problem                                       | Fix                                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `jq: command not found`                       | Restart the terminal; confirm with `where jq` (Windows) or `which jq` (macOS/Linux)                  |
| `docker: command not found`                   | Open Docker Desktop and wait for it to start; on Linux ensure your user is in the `docker` group     |
| `npm install` fails with `EACCES`             | Don't use `sudo`. Reinstall Node via `nvm` so npm runs in your home directory                        |
| `gh auth status` shows "not logged in"        | Re-run `gh auth login`; ensure you authorised the correct GitHub account                             |
| `npm run build` fails with TypeScript errors  | Re-run `npm install` — the dependency tree may be partial                                             |
| Pre-commit hook not running                   | Run `git config core.hooksPath githooks`                                                              |

---

### Done

When all steps pass, confirm:

- Node 20+ installed
- Docker Desktop running
- GitHub CLI authenticated
- Pre-commit hooks active
- The CLI builds and tests pass
- The example consumer builds Storybook

Suggest checking `backlog/backlog.md` for the next thing to work on.
