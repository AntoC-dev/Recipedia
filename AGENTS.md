# AGENTS.md

Guidance for AI coding agents in this repo — Claude Code, Cursor, and any tool that reads `AGENTS.md`.

/caveman ultra

Topic rules live in `.claude/rules/`: `testing.md`, `e2e.md`, `git-workflow.md`, `documentation.md`.

## Agent setup

- MCP servers live in `.mcp.json` (Claude Code) / `.cursor/mcp.json` (Cursor) — kept in sync by
  `scripts/sync-cursor.mjs` on pre-commit. Edit `.mcp.json`; Cursor copy is regenerated.
- The `github` server needs a personal token — export `GITHUB_MCP_PAT` (a GitHub PAT) in your shell env. Never commit
  it; the config references `${GITHUB_MCP_PAT}`.

## Commands

- Tests: `npm run test:unit` (`tests/unit/`), `test:unit:coverage`, `test:integration` (`tests/integration/`),
  `test:perf` (Reassure render benchmarks)
- Quality: `npm run quality` — lint + format:check + typecheck + knip + expo:doctor. Also `lint:fix`, `format`,
  `typecheck`, `knip:check` (dead code; CI-gated, config in `knip.json`), `security:audit`
- Build: `build:test:android` / `build:test:ios` (Maestro test APK/app), `build:prod:android` / `build:prod:ios`
  (store builds), `install:android`, `build:clean`
- Docs: `npm run docs:build` (TypeDoc), `docs:clean`

## Non-Obvious Architecture Rules

- **No `useCallback`, `useMemo`, `React.memo`** — React Compiler handles memoization automatically
- **DB access**: never call `RecipeDatabase.getInstance()` in components — use focused hooks (`useRecipes`,
  `useIngredients`, `useTags`, `useMenu`, `useShopping`, `useImportHistory`)
- **Path aliases**: always use `@components/*`, `@utils/*`, `@hooks/*`, `@screens/*`, `@context/*`, etc. — never
  relative imports across feature boundaries
- **State**: React Context + hooks only — no Redux

## Code Conventions

- TypeScript strict mode
- React Native Paper components preferred
- No comments unless the *why* is non-obvious — code self-documents via names
- TSDoc for exported functions/types in new files (`npm run docs:build` to verify)
