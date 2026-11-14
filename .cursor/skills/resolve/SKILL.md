---
name: resolve
description: Work a GitHub issue (bugfix, feature, refactor, exploration) autonomously in an isolated worktree — implement, audit tests, review, validate on E2E. Use when told to fix/implement/refactor/evaluate and given an issue number or URL.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, Skill, WebFetch, Monitor, TaskStop, EnterWorktree, ExitWorktree, AskUserQuestion, mcp__github__issue_read, mcp__maestro__list_devices, mcp__maestro__inspect_screen, mcp__maestro__take_screenshot, mcp__maestro__run, mcp__maestro__cheat_sheet
---

Take a GitHub issue, work it end-to-end **without the user**. Only user interaction: ONE batched question in
Step 1, and the final report. All edits land in the worktree — never the main checkout. Never commit, push or open
a PR: the user reviews the diff first.

Subagents (any step): give the absolute worktree path, work only under it, Opus for edits/review, Sonnet for
read-only, report ≤ 5 bullets. A skill's output is not the end of resolve — continue at the next step.

## Step 1 — Read issue, decide, ask once

```bash
gh issue view <issue#> --json number,title,body,labels,state
```
`gh` unavailable → `mcp__github__issue_read`. No arg → ask which issue (only allowed extra question).

Type (`feature | bugfix | docs | refactor`, never `fix`/`feat`):
- `bug` / crash / regression → `bugfix`
- `enhancement` / new capability → `feature`
- `refactor` / cleanup / `test` / `ci` / `dependencies` → `refactor`
- `documentation` → `docs`
- `exploration` / spike / evaluate → `docs` + exploration scope

Branch: `<type>/<issue#>-<2-4-word-kebab-slug>` (e.g. `bugfix/358-editrecipe-verify-tags`).

Ask **one** `AskUserQuestion` with only the applicable questions: exploration scope (a) evaluate only, (b)
implement safe items + evaluate rest, (c) implement all; closed issue → continue?; type only if ambiguous.
After this: **never ask again** — pick the conservative default, note it in the report.

**Skips are decided from the diff, not the type:** no `src/` change → skip Steps 4–5; no UI change → skip the
UI review and Step 7. Exploration (a) → skip Steps 2 and 4–8; do Step 3 exploration + Step 9.

## Step 2 — Worktree

`<repo>` = main checkout (`git rev-parse --path-format=absolute --git-common-dir`, minus `/.git`). Never
`EnterWorktree(name: ...)` (prefixes branch with `worktree-`). From `<repo>`:
```bash
git fetch origin main
git worktree add -b <branch> .claude/worktrees/<branch with / → +> origin/main
```
Branch/worktree already exists → reuse via `EnterWorktree(path)`, skip `add`, note in report.
Then `EnterWorktree(path: "<repo>/.claude/worktrees/<branch with +>")`; verify `pwd` + `git branch --show-current`.
`npm ci` in the worktree (never hardlink-copy `node_modules`). Copy the gitignored Pyodide bundle (without it:
no scraper, no bulk-import thumbnails):
```bash
mkdir -p modules/recipe-scraper/assets
cp <repo>/modules/recipe-scraper/assets/pyodide-bundle.html modules/recipe-scraper/assets/   # plain cp, never cp -l
```
Missing in main too → note in report; scraper-dependent E2E = env, not regression.

**Path trap:** Read/Edit/Write need absolute paths. Always root them at the worktree path, never `<repo>/src/...`
(silently edits main).

## Step 3 — Implement

- **bugfix** — TDD: failing test under `tests/unit/` mirroring `src/`, run
  `npm run test:unit -- --testPathPattern="<File>.test"`, confirm it fails for the right reason, fix, keep test.
- **feature** — non-UI functions outside components, TSDoc, unit tests.
- **refactor** — behavior-preserving; tests green before and after.
- **docs** — doc changes only.
- **exploration (a)** — zero repo changes. Ground claims in `package.json` versions + official docs (WebFetch).
  Per item: where it applies, benefit/cost/risk, verdict adopt/defer/skip/blocked. Chat report: summary table,
  short section per item, overall recommendation.

**Plan check (feature / refactor, large only)** — > 3 files, or new provider / DB operation / hook category /
navigation change / cross-layer. Spawn one `Plan` subagent (issue + relevant files) → files, approach, risks,
code to reuse. Adopt unless it contradicts AGENTS.md. Small change → skip.

### 3b — E2E coverage gap (bugfix / feature)
Would an existing case in `tests/e2e/cases/<feature>/` have caught this / exercise this feature?
- User-visible symptom (screen unreachable, wrong UI state, hang) or issue found via E2E/CI, and no case asserts
  it → extend the case that already walks the path, else add one per `tests/e2e/E2E_TESTING.md` → Adding Tests
  (raw case + `ci/` wrapper + suite `flowsOrder`). Assert the regression (tight `extendedWaitUntil`,
  `assertVisible` on the fixed state), not just a walk-through.
- Not deterministically reproducible via UI → add a guard only if it asserts something the fix guarantees; else
  skip and say why.
- Pure logic / non-UI → no E2E.

## Step 4 — Test audit and docs

Goal: reviewers see code with complete tests. Changed files =
`git diff --name-only origin/main -- src` + `git ls-files -o --exclude-standard src`. Invoke
`Skill(check-tests, args: <those files>)` — no-arg mode only sees committed changes, useless here. Then
`npm run test:unit`; fix until green.

Exported function/type/class changed in `src/utils/` or `src/hooks/` → spawn `typedoc-documentation-writer`, then
`npm run docs:build` with no warnings. Update `ARCHITECTURE.md` / `guides/` per `.claude/rules/documentation.md`.

## Step 5 — Review passes

Run when `git diff --numstat origin/main -- src` added+deleted > 50 lines (always for feature / refactor).
Sequential — each pass edits the worktree:

1. **UI review** — only if diff touches `src/components/`, `src/screens/` or `src/styles/`. Read-only subagent
   with the diff and `.claude/rules/design.md` as criteria → findings `file:line — issue — fix`. Apply valid
   ones, drop false positives.
2. `Skill(code-review, args: "high --fix")`
3. `Skill(simplify)`

Conflicting suggestions → keep the simpler. One round only.

## Step 6 — Quality gate

```bash
npm run test:unit
npm run quality   # lint + format:check + typecheck + knip + expo:doctor
```
Fix until green. Review-induced logic change without coverage → `check-tests` on those files.

## Step 7 — E2E on device dev build

UI change only. Follow `.claude/docs/device-dev-build.md` (free device, Metro from worktree, rules, teardown). No
free device → list impacted cases as "not run".

**Pick cases:** changed files (list as in Step 4) → grep their testID prefixes (e.g. `RecipeTags::`) in
`tests/e2e/cases`, `asserts`, `flows`; map hits back to calling cases. Keep the 3–6 most direct raw
`cases/<feature>/N_*.yaml` (never `ci/`). No hit → one smoke case of the closest suite. Always include cases from 3b.

**Run:** `run { device_id, files: [<absolute case path>] }` per case. Failure → `inspect_screen` +
`take_screenshot`, classify:
- **regression** → fix code (Fast Refresh), re-run Step 4 + Step 6 on touched files, re-run case. Max 2 attempts,
  then report fail.
- **flow outdated by intended UI change** → update the case per `tests/e2e/E2E_TESTING.md` (never prettier E2E YAML).
- **env / flaky** → re-run once; still failing → report, don't chase.

## Step 8 — Isolation and teardown

`git -C <repo> status --porcelain` shows none of your files; worktree `git status` lists all changes. Stop your
Metro per `device-dev-build.md`.

## Step 9 — Report and stop

≤ 5 bullets, ≤ 80 words, no file lists/diffs/paths unless asked:
- `#<issue> <type> → <branch>` (worktree path)
- `tests: +N, unit/quality green|red · review: n fixes applied`
- `E2E: n pass / n fail (<case>) / n env / not run` (+ case added/extended in 3b)
- `defaults/blockers:` only if any
- `next: review diff`

Exploration (a) → the findings report is the output; offer implementing a subset or posting it as an issue comment.

Stay in the worktree; user removes it after merge/abandon (`git worktree remove <dir>` from `<repo>`).
