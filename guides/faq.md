# FAQ

## Architecture and data

### Where does local data live?

All recipe data is stored in a SQLite database on the device via `expo-sqlite`. There is no cloud backend, no sync, and no external server. The database file is managed by the `RecipeDatabase` singleton (`src/utils/RecipeDatabase.tsx`) and lives in the app's private storage directory.

User preferences (dark mode, default persons count, season filter) are stored separately via `@react-native-async-storage/async-storage`.

### Why no `useCallback`, `useMemo`, or `React.memo`?

The project has React Compiler enabled (`experiments.reactCompiler: true` in `app.config.ts`). The compiler automatically inserts memoization where it is beneficial. Manual memoization wrappers are redundant, add noise, and can interact badly with the compiler's own analysis. Do not add them.

### Why can't I call `RecipeDatabase.getInstance()` directly in a component?

The database singleton manages subscriptions via `useSyncExternalStore`. Components must subscribe through the focused hooks (`useRecipes`, `useIngredients`, `useTags`, `useMenu`, `useShopping`, `useImportHistory`) to receive reactive updates. Calling `getInstance()` directly in a component bypasses the subscription, so the component will not re-render when data changes. The one exception is non-React utility code (e.g. `datasetInitializer.ts`) that runs outside the component tree.

---

## Adding features

### How do I add a new recipe field?

A new field touches several layers:

1. **Type** — Add the field to `recipeTableElement` in `src/customTypes/DatabaseElementTypes.tsx`. If it needs to be persisted, also add an entry to `encodedRecipeElement` and `recipeColumnsEncoding`.

2. **Database** — Open `src/utils/RecipeDatabase.tsx`. Add encoding/decoding logic in the encode/decode methods and update the `addRecipe` / `editRecipe` SQL statements.

3. **Schema migration** — If an existing database already exists on a device, the new column must be added via a migration in the `init()` method using `ALTER TABLE ... ADD COLUMN ...`. Without a migration, existing installs crash on startup.

4. **Form schema** — Add the field to `recipeFormSchema` (`src/schemas/recipeFormSchema.ts`) with its validation rule and i18n error key, seed it in the relevant `src/screens/recipe/defaults/` builder(s), and add it to `createRecipeSnapshot()` (`src/screens/recipe/helpers/`).

5. **UI** — Add the relevant organism under `src/components/organisms/` plus a controller-bound field under `src/screens/recipe/fields/`, and wire it into `RecipeFormScreen` (`src/screens/recipe/RecipeFormScreen.tsx`).

6. **Tests** — Add unit tests for the encoding/decoding functions and an integration test that round-trips the field through the full DB pipeline.

### How do I add a new translation key?

1. Add the key and English string to the appropriate file in `src/translations/en/` (e.g. `recipe.ts`, `common.ts`).
2. Add the French translation to the matching file in `src/translations/fr/`.
3. Use the key in a component via the `useI18n` hook:
   ```typescript
   const { t } = useI18n();
   return <Text>{t('myNewKey')}</Text>;
   ```

To add an entirely new translation category file:

1. Create `src/translations/en/myCategory.ts` and `src/translations/fr/myCategory.ts`.
2. Export the object and merge it into `src/translations/en/index.ts` and the French equivalent.
3. No changes to the i18n setup are needed — the barrel export handles it.

See `src/translations/README.md` for full details and examples.

### How do I add a new recipe source provider?

1. Create a new class in `src/providers/` that extends `BaseRecipeProvider` (`src/providers/BaseRecipeProvider.ts`).
2. Implement the abstract methods: `getId()`, `getName()`, `getBaseUrl()`, and the URL discovery methods as required.
3. Register the provider in `src/providers/ProviderRegistry.ts`.
4. The existing `useDiscoveryWorkflow` and `useRecipeScraper` hooks handle scraping and validation automatically for all registered providers.

The scraper itself runs via the `modules/recipe-scraper` native module (Python embedded via Chaquopy on Android, BeeWare on iOS, Pyodide on web). Providers are responsible only for discovering recipe URLs — content extraction is handled by the scraper.

---

## Database

### Why are my DB changes not reflected after a schema change?

SQLite schemas are created once and not automatically updated. If you add a column to the schema definition but do not write a migration, existing app installs will keep the old schema.

Migrations live in the `init()` method of `RecipeDatabase`. Use `ALTER TABLE` statements guarded by existence checks:

```typescript
// Check if column exists before adding it
const columns = await db.getAllAsync(`PRAGMA table_info(${recipeTableName})`);
const hasNewColumn = columns.some((col: { name: string }) => col.name === 'NEW_COLUMN');
if (!hasNewColumn) {
  await db.runAsync(`ALTER TABLE ${recipeTableName} ADD COLUMN NEW_COLUMN TEXT DEFAULT ''`);
}
```

For development, the fastest workaround is to delete the app and reinstall — this creates a fresh database with the new schema.

### How does the in-memory cache work?

`RecipeDatabase` loads all rows from SQLite into memory at startup (`init()` populates `_recipes`, `_ingredients`, `_tags`, etc.). Read operations like `get_recipes()` return the in-memory array synchronously. Write operations (`addRecipe`, `editRecipe`, etc.) update both SQLite and the in-memory array, then call `notify('recipes')` to trigger `useSyncExternalStore` callbacks in subscribed hooks, causing components to re-render.

---

## Testing

### How do I run only one test file?

```bash
# Run a specific file
npx jest tests/unit/utils/RecipeDatabase.test.ts

# Run all tests in a directory
npx jest tests/unit/utils/

# Run tests matching a name pattern
npx jest -t "should add recipe"

# Watch mode for a single file
npx jest --watch tests/unit/utils/RecipeDatabase.test.ts
```

### What is the difference between unit tests and integration tests?

**Unit tests** (`tests/unit/`) test a single component or function in isolation. External dependencies (e.g. SQLite, native modules) are mocked.

**Integration tests** (`tests/integration/`) exercise the real pipeline end-to-end: actual hooks, the real `RecipeDatabase` running against `better-sqlite3` (the Node.js SQLite driver used in tests), the real fuzzy index, and the real form logic. The only things mocked are truly irreducible native boundaries like `@react-native-ml-kit/text-recognition`. Never mock hooks, utilities, or database layers in integration tests.

### Where do mocks go?

All mocks live in `tests/mocks/`. Never write inline mocks inside test files. Globally active mocks (e.g. `react-native-paper`) are registered in `jest.config.js`. Suite-specific mocks are imported by individual test files.

---

## Development workflow

### How do I run quality checks before committing?

```bash
npm run quality
# Runs: eslint + prettier check + tsc --noEmit + expo-doctor
```

Pre-commit hooks (Husky + lint-staged) run `prettier` and `eslint --fix` automatically on staged files. If a commit is blocked by a hook failure, fix the underlying issue rather than bypassing with `--no-verify`.

### How do I check TypeScript errors only?

```bash
npm run typecheck
```

### The app has a copilot tutorial — how does it work?

The onboarding tutorial uses `react-native-copilot`. The `useSafeCopilot` hook (`src/hooks/useSafeCopilot.tsx`) wraps copilot with error boundaries so a missing `CopilotProvider` does not crash the app. During the tutorial, bottom tab lazy loading is disabled (all tabs render immediately) so all copilot step registrations fire before the tutorial starts.

### How do I regenerate the TypeDoc API documentation?

```bash
npm run docs:build
```

The output goes to `docs/`. Open `docs/index.html` locally, or view the published version at [https://AntoC-dev.github.io/Recipedia/](https://AntoC-dev.github.io/Recipedia/).
