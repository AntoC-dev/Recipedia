# FAQ

For a full architectural overview see [ARCHITECTURE.md](../ARCHITECTURE.md). Testing questions are answered in [testing.md](testing.md), setup problems in [installation.md](installation.md).

## Architecture and data

### Where does local data live?

Recipe data is stored in a SQLite database on the device through `expo-sqlite`, managed by the `RecipeDatabase` singleton (`src/utils/RecipeDatabase.tsx`). There is no cloud backend or sync. User preferences (dark mode, default persons count, season filter) are kept separately in `@react-native-async-storage/async-storage`.

### Why no `useCallback`, `useMemo` or `React.memo`?

React Compiler is enabled (`experiments.reactCompiler` in `app.config.ts`) and inserts memoization where it helps. Manual wrappers are redundant and can interfere with its analysis, so do not add them.

### Why not call `RecipeDatabase.getInstance()` in a component?

Components must read data through the focused hooks (`useRecipes`, `useIngredients`, `useTags`, `useMenu`, `useShopping`, `useImportHistory`). They subscribe to the database with `useSyncExternalStore`, so components re-render when data changes. Calling `getInstance()` directly bypasses that subscription. The exception is non-React code such as `datasetInitializer.ts`.

### How does the in-memory cache work?

`init()` loads every table into memory (`_recipes`, `_ingredients`, `_tags`, ...). Reads such as `get_recipes()` return the in-memory array synchronously. Writes (`addRecipe`, `editRecipe`, ...) update SQLite and the array, then call `notify('recipes')` (or the matching table) to wake subscribed hooks.

---

## Database

### Why are my schema changes not applied on an existing install?

Tables are created once; adding a column to the definition does not alter an existing database, and the app will fail against the old schema. Add a migration: `init()` calls private migration methods such as `migrateAddSourceColumns()`, which run `ALTER TABLE ... ADD COLUMN` and ignore the error when the column already exists. Copy that pattern for new columns.

During development you can uninstall the app to get a fresh database.

---

## Adding features

### How do I add a recipe field?

1. **Type**: add the field to `recipeTableElement` in `src/customTypes/DatabaseElementTypes.tsx`. If it is persisted, also update `encodedRecipeElement` and `recipeColumnsEncoding`.
2. **Database**: update the encode/decode logic and the SQL in `addRecipe` / `editRecipe` in `src/utils/RecipeDatabase.tsx`.
3. **Migration**: add the column to existing installs (see above).
4. **Form schema**: add the field to `recipeFormSchema` (`src/schemas/recipeFormSchema.ts`) with its validation rule and i18n error key, seed it in the builders under `src/screens/recipe/defaults/`, and add it to `createRecipeSnapshot()` (`src/screens/recipe/helpers/`).
5. **UI**: add an organism under `src/components/organisms/` and a controller-bound field under `src/screens/recipe/fields/`, then wire it into `RecipeFormScreen`.
6. **Tests**: unit tests for the encoding/decoding, and an integration test that round-trips the field through the real database.

### How do I add a translation?

Add the key to the matching file in both `src/translations/en/` and `src/translations/fr/`, then use it through the `useI18n` hook (`src/utils/i18n.ts`):

```typescript
const { t } = useI18n();
return <Text>{t('myNewKey')}</Text>;
```

A new category file must also be exported from each language's `index.ts`. See [src/translations/README.md](../src/translations/README.md) for the structure and examples.

### How do I add a recipe source provider?

1. Create a class in `src/providers/` extending `BaseRecipeProvider` and implement its abstract members: `id`, `name`, `logoUrl`, `getBaseUrl()`, `discoverCategoryUrls()` and `extractRecipeLinksFromHtml()`.
2. Register it in `src/providers/ProviderRegistry.ts`.

`useDiscoveryWorkflow` and `useRecipeScraper` then handle discovery and scraping for every registered provider. Providers only find recipe URLs; content extraction is done by the `modules/recipe-scraper` native module (CPython 3.13 through Chaquopy on Android, CPython 3.14 through Pyodide in a WebView on iOS).

---

## Development workflow

### What do the quality checks run?

`npm run quality` runs ESLint, Prettier check, `tsc --noEmit`, knip and expo-doctor. Husky and lint-staged run Prettier and `eslint --fix` on staged files at commit time. If a hook fails, fix the cause rather than using `--no-verify`.

### How does the onboarding tutorial work?

It uses `react-native-copilot`. `useSafeCopilot` (`src/hooks/useSafeCopilot.tsx`) tolerates a missing `CopilotProvider`. While the tutorial is active, `BottomTabs` turns off lazy tab rendering so every tab registers its steps before the tutorial starts.

### How do I regenerate the API documentation?

`npm run docs:build` generates TypeDoc output in `docs/` (see `typedoc.json`). The published version is at [AntoC-dev.github.io/Recipedia](https://AntoC-dev.github.io/Recipedia/).
