# AGENTS.md

Guidance for AI coding agents in this repo — Claude Code, Cursor, and any tool that reads `AGENTS.md`.

## Agent setup

- MCP servers live in `.mcp.json` (Claude Code) / `.cursor/mcp.json` (Cursor) — kept in sync by `scripts/sync-cursor.mjs` on pre-commit. Edit `.mcp.json`; Cursor copy is regenerated.
- The `github` server needs a personal token — export `GITHUB_MCP_PAT` (a GitHub PAT) in your shell env. Never commit it; the config references `${GITHUB_MCP_PAT}`.

## Commands

### Testing
- `npm run test:unit` — unit tests (`tests/unit/`)
- `npm run test:unit:coverage` — unit tests with coverage
- `npm run test:integration` — integration tests (`tests/integration/`)
- `npm run test:perf` — Reassure render benchmarks

### Quality
- `npm run quality` — full suite: lint + format:check + typecheck + expo:doctor
- `npm run lint:fix` — auto-fix lint
- `npm run format` — Prettier
- `npm run typecheck` — TypeScript
- `npm run security:audit` — security audit

### Build
- `npm run build:test:android` / `build:test:ios` — Maestro test APK/app
- `npm run build:prod:android` / `build:prod:ios` — store builds
- `npm run install:android` — install APK on device
- `npm run build:clean` — clean artifacts

### Docs
- `npm run docs:build` — generate TypeDoc
- `npm run docs:clean` — clean docs

## Non-Obvious Architecture Rules

- **No `useCallback`, `useMemo`, `React.memo`** — React Compiler handles memoization automatically
- **DB access**: never call `RecipeDatabase.getInstance()` in components — use focused hooks (`useRecipes`, `useIngredients`, `useTags`, `useMenu`, `useShopping`, `useImportHistory`)
- **Path aliases**: always use `@components/*`, `@utils/*`, `@hooks/*`, `@screens/*`, `@context/*`, etc. — never relative imports across feature boundaries
- **State**: React Context + hooks only — no Redux

## Testing Rules

- Unit tests: `tests/unit/` mirroring `src/` path — `src/foo/Bar.tsx` → `tests/unit/foo/Bar.test.tsx`
- Integration tests: real code paths, mock only native modules — no mocking of hooks, RecipeDatabase, or fuzzy index
- All mocks: `tests/mocks/` — never inline in test files, never mock custom hooks unless unavoidable
- Mock components must render all props: functional props as `<Button onPress={prop}>`, others as `<Text>{prop}</Text>`
- React Native Paper: globally mocked (jest config) — check before creating new mocks
- No comments in test files — names must self-document
- Coverage goal: 100% (excludes translations, assets, navigation boilerplate)

## E2E Tests (Maestro)

Test suites in `tests/e2e/` — see `tests/e2e/E2E_TESTING.md` for full guide.

CI artifacts: `maestro-logs-android-<suite>` / `maestro-logs-ios-<suite>`
- `maestro.log` — flow execution log
- `android-app-logs.txt` — logcat
- `ios-app-logs.txt` — iOS sim log

Use the `e2e-ci-debugger` agent or `/e2e-debug` skill for CI failure triage (Claude Code only).

## Git Workflow

- Branch names must follow `CONTRIBUTING.md` → Branch Naming: `<type>/<issue#>-<short-desc>`, type one of `feature`, `bugfix`, `docs`, `refactor` (e.g. `bugfix/358-editrecipe-verify`, not `fix-358-editrecipe-verify`)
- Applies to worktree branches too — check `CONTRIBUTING.md` before naming a branch in a spawned/worktree agent
- Remove worktree dirs when work is done — never leave orphaned worktrees behind

## Code Conventions

- TypeScript strict mode
- React Native Paper components preferred
- No comments unless the *why* is non-obvious — code self-documents via names
- TSDoc for exported functions/types in new files (`npm run docs:build` to verify)
- Conventional commits, semantic scopes
- Husky/lint-staged enforces quality on commit

## Documentation Rules

When to update TSDoc:
- Added or modified an exported function/type/class in `src/utils/` or `src/hooks/` → update its TSDoc block
- Changed a function signature → update `@param`/`@returns`
- After any TSDoc change → run `npm run docs:build` to verify no warnings

When to update `ARCHITECTURE.md`:
- New React Context provider added
- New architectural pattern introduced (new hook category, new DB operation type, new provider)
- Key invariant added or removed
- Navigation structure changed

When to add a file to `guides/`:
- New major workflow that spans multiple files/layers (e.g. new import pipeline, new form type)
- New dev setup requirement (new env var, new native dependency)

Never:
- Add inline comments inside React components unless the *why* is genuinely non-obvious
- Add TSDoc to non-exported (private) functions unless logic is complex and surprising
