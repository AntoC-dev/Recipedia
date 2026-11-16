# Key invariants

Must hold — violations cause subtle bugs or break CI. UI rules:
[ui-invariants.md](ui-invariants.md).

## Code

- **No `RecipeDatabase.getInstance()` in React components.** Use focused hooks
  (`useRecipes`, `useIngredients`, …). Direct calls bypass
  `useSyncExternalStore` subscriptions → stale UI.
- **No `useCallback`, `useMemo`, `React.memo`.** React Compiler (enabled in
  `app.config.ts`) memoizes; manual memoization interferes with its analysis and
  is dead code.
- **Path aliases, never relative cross-feature imports.**
  `@utils/RecipeDatabase`, `@hooks/useRecipes`,
  `@components/organisms/RecipeImage`, … (defined in `tsconfig.json`).
  `../../utils/RecipeDatabase` across feature boundaries is forbidden.
- **All user-facing strings via i18n.** `useI18n()`; keys in both `en/` and
  `fr/`. No hardcoded English in components.
- **New utility functions outside components need unit tests + TypeDoc.** See
  `CLAUDE.md`.

## Tests

- **Integration tests never mock hooks, DB, or any in-app layer.** Mock only
  irreducible native modules (e.g. `@react-native-ml-kit/text-recognition`).
  This is what separates them from unit tests.

## Database

- **Schema changes need a migration.** Column without a `PRAGMA`-guarded
  `ALTER TABLE` in `init()` breaks existing installs.
- **Recipe decoding resolves ingredients/tags from in-memory caches, never
  SQL.**
  - Load order in `init()`: `_ingredients`, `_tags` before any recipe decode;
    `_recipes` before menu.
  - Ingredient/tag mutation patches cached recipes in place — never reload all
    recipes from DB.
  - Any new mutation path must leave caches equal to a full reload; asserted for
    every mutation method by the table-driven test in
    `tests/unit/utils/RecipeDatabase.test.tsx`.

## Native / privacy

- **Google ML Kit telemetry stays off** (no public opt-out).
  - Android: `withMlKitTelemetryDisabled` removes the DataTransport CCT backend
    → silences _every_ SDK logging via CCT (e.g. future Crashlytics).
  - iOS: `@react-native-ml-kit/text-recognition` patch no-ops ML Kit's private
    Clearcut uploader and stats flags.
  - Both rely on ML Kit internals: re-check on every ML Kit bump.
- **GWP-ASan off on Android.** `withGwpAsanDisabled` sets
  `android:gwpAsanMode="never"` in every build. Hermes' vendored Boost.Context
  `make_fcontext` breaks GWP-ASan's frame-pointer stack walker → sampled
  `free()` SIGSEGV (facebook/hermes#2225). Remove once RN ships a fixed Hermes.
