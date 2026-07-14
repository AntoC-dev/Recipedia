# Architecture

Recipedia is a single-user, local-first recipe management app built with React Native and Expo. It runs entirely on-device: no backend, no cloud sync. Recipes, ingredients, tags, and shopping data live in a SQLite database. The app is iOS and Android only (portrait orientation).

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Data flow](#2-data-flow)
3. [Database architecture](#3-database-architecture)
4. [State management](#4-state-management)
5. [Navigation structure](#5-navigation-structure)
6. [Component hierarchy](#6-component-hierarchy)
7. [Recipe form architecture](#7-recipe-form-architecture)
8. [Bulk import pipeline](#8-bulk-import-pipeline)
9. [Key invariants](#9-key-invariants)
10. [File naming conventions](#10-file-naming-conventions)
11. [Adding a new feature checklist](#11-adding-a-new-feature-checklist)

---

## 1. System overview

Core capabilities:

- Create, view, edit, and delete recipes with images, ingredients, preparation steps, tags, and nutrition data
- OCR extraction from photos (`@react-native-ml-kit/text-recognition`)
- Import recipes from 400+ websites via an embedded Python scraper (`modules/recipe-scraper`)
- Bulk import from HelloFresh and Quitoque with a validation workflow
- Fuzzy search (MiniSearch) across recipe titles, ingredient names, and tags
- Shopping list derived from a weekly menu
- Seasonal ingredient awareness
- English and French UI

Everything runs offline. The recipe scraper network-fetches URLs during import, but the app does not require connectivity for any core function.

---

## 2. Data flow

The canonical data flow for a user action that reads or writes recipe data:

```
User action in a component
        |
        v
Custom hook (useRecipes, useIngredients, useTags, useMenu, useShopping)
        |
        v
RecipeDatabase singleton  <----> In-memory cache (_recipes, _ingredients, ...)
        |
        v
expo-sqlite (SQLite on device)
        |
        v  notify(slice)
useSyncExternalStore callbacks in hooks
        |
        v
Components re-render with new data
```

Key points:

- Hooks call `RecipeDatabase.getInstance()` to obtain the singleton and then call its methods.
- Mutation methods (`addRecipe`, `editRecipe`, etc.) write to SQLite, update the in-memory cache, then call `notify('recipes')` (or the relevant slice name).
- `useSyncExternalStore` in each hook subscribes to that slice. Only hooks subscribed to the mutated slice re-render; a tag change does not re-render components that only subscribe to `recipes`.
- Read operations (`get_recipes()`, `get_ingredients()`) return the in-memory array synchronously — no async await needed in the UI layer for reads after initialization.

---

## 3. Database architecture

### Singleton

`RecipeDatabase` in `src/utils/RecipeDatabase.tsx` is the only entry point to SQLite. It is a private-constructor singleton accessed via `RecipeDatabase.getInstance()`. It initializes once (`init()`) on app startup, creating tables and running schema migrations if necessary.

**Never call `RecipeDatabase.getInstance()` inside a React component.** Components must go through the focused hooks instead. The singleton may be called from non-React utility code that runs outside the component tree (e.g. `datasetInitializer.ts`).

### Tables

| Table | Type file key | Purpose |
|---|---|---|
| `RecipesTable` | `recipeTableElement` | Core recipe data |
| `IngredientsTable` | `ingredientTableElement` | Ingredient master data (shared across recipes) |
| `TagsTable` | `tagTableElement` | Tag definitions |
| `MenuTable` | `menuTableElement` | User's weekly cooking menu |
| `PurchasedIngredientsTable` | `purchasedIngredientElement` | Purchase state for shopping list items |
| `ImportHistoryTable` | `importHistoryTableElement` | Records of previously discovered bulk-import recipes |
| `DismissedRecipesTable` | `dismissedRecipeTableElement` | Recipes permanently dismissed from bulk-import discovery |

All table and column name constants live in `src/customTypes/DatabaseElementTypes.tsx`.

### Encoding and decoding

SQLite stores only primitive types. Complex fields (ingredient arrays, tag arrays, preparation steps, nutrition) are serialized to TEXT using custom separators defined in `src/styles/typography.ts` (`textSeparator`, `unitySeparator`, `EncodingSeparator`, `noteSeparator`). Each table has a corresponding `encoded*Element` type (e.g. `encodedRecipeElement`) and a `*ColumnsEncoding` array that declares each column's SQLite type.

When reading: `RecipeDatabase` decodes rows from `encoded*Element` back to the rich TypeScript type.  
When writing: the rich type is encoded to flat primitives before the SQL statement.

### In-memory cache and pub/sub

On initialization, all rows are loaded into memory (`_recipes`, `_ingredients`, `_tags`, `_menu`, `_purchasedIngredients`). After any mutation, `notify(slice)` fires all listeners registered for that slice via `subscribe(slice, callback)`. The focused hooks bind this to `useSyncExternalStore`.

The `StoreSlice` type enumerates the available slices: `'recipes' | 'ingredients' | 'tags' | 'menu' | 'purchased'`.

### Schema migrations

Add new columns inside `init()` using `ALTER TABLE ... ADD COLUMN ...` guarded by a `PRAGMA table_info` check so the migration is idempotent across fresh installs and upgrades.

---

## 4. State management

There is no Redux or Zustand. State falls into three categories:

### Global app state (React Context, app-wide)

Defined in `src/context/` and provided near the root in `App.tsx`:

| Context | Hook | Responsibility |
|---|---|---|
| `DarkModeContext` | `useContext(DarkModeContext)` | Dark/light theme toggle, persisted to AsyncStorage |
| `SeasonFilterContext` | `useSeasonFilter()` | Global season filter toggle, persisted to AsyncStorage |
| `DefaultPersonsContext` | `useDefaultPersons()` | Default serving count setting, persisted to AsyncStorage |

### Screen-scoped state (React Context, Recipe form only)

Form field state itself is held by `react-hook-form` (`FormProvider` in `src/screens/recipe/RecipeFormScreen.tsx`), read via `useFormContext()` — not a bespoke context. The remaining screen-scoped contexts wrap the form body:

| Context | Hook | Responsibility |
|---|---|---|
| `RecipeDialogsContext` | `useRecipeDialogs()` | Dialog open/close state (validation, similarity, queue) scoped to the recipe form |
| `IngredientFocusContext` | `useIngredientFocusRef()` | Ref counter of currently-focused ingredient inputs; lets `useScalingOnPersonsChange` defer scaling while a row is being edited |
| `IngredientArrayActionsContext` | `useIngredientArrayActions()` | Shares the field-array `applyPatch` callback so feature hooks (`useRecipeOCR`, `useRecipeScraperValidation`) mutate `recipeIngredients` through the same patch shape that preserves sibling row identity |

These contexts are intentionally narrow. They exist to avoid prop-drilling across the several hooks (`useRecipeIngredients`, `useRecipeTags`, `useRecipeOCR`, `useRecipeScraperValidation`) that all need access to the shared form context from within a single screen.

### Reactive database state (useSyncExternalStore, cross-component)

Hooks that subscribe to `RecipeDatabase` slices:

| Hook | Slice | What it exposes |
|---|---|---|
| `useRecipes` | `recipes` | CRUD for recipes, fuzzy search, scaling |
| `useIngredients` | `ingredients` | Ingredient master data, CRUD |
| `useTags` | `tags` | Tag CRUD and random tag suggestions |
| `useMenu` | `menu`, `purchased` | Menu management and purchase state |
| `useShopping` | `menu`, `purchased` | Derived shopping list (read-only, no mutations) |
| `useImportHistory` | — | Import history and dismissed-recipe records |

---

## 5. Navigation structure

Navigation uses React Navigation v6. Types for screens and params are defined in `src/customTypes/ScreenTypes.tsx`.

```
NavigationContainer (App.tsx)
└── RootNavigator (Stack)
    ├── Tabs (BottomTabs)                   -- initial route
    │   ├── Home                            -- recipe list + FAB for creation
    │   ├── Search                          -- fuzzy search + filter UI
    │   ├── Menu                            -- weekly cooking menu
    │   ├── Shopping                        -- shopping list derived from menu
    │   └── Parameters                      -- settings hub
    ├── RecipeView                          -- view an existing recipe (read-only)
    ├── RecipeEdit                          -- edit an existing recipe
    ├── RecipeAddManual                     -- create a recipe from a blank form
    ├── RecipeAddOcr                        -- create a recipe from a photo (OCR)
    ├── RecipeAddScrape                     -- create a recipe from scraped web data
    ├── LanguageSettings
    ├── DefaultPersonsSettings
    ├── IngredientsSettings
    ├── TagsSettings
    ├── BulkImportSettings
    ├── BulkImportDiscovery
    ├── BulkImportValidation
    └── BugReport
```

All screens are header-less (`headerShown: false`). Navigation animations can be disabled globally via `EXPO_PUBLIC_DISABLE_ANIMATIONS=true` (used by E2E tests).

Each recipe route is a thin wrapper that forwards its own narrow params (see `src/customTypes/RecipeNavigationTypes.tsx`) to the shared `RecipeFormScreen`, which derives the form `mode`:

- `RecipeView` → `readOnly` — view an existing recipe
- `RecipeEdit` → `edit` — edit an existing recipe
- `RecipeAddManual` → `addManually` — create a new recipe from a blank form
- `RecipeAddOcr` → `addFromPic` — create from a photo (OCR pre-fills fields)
- `RecipeAddScrape` → `addFromScrape` — create from scraped web data (pre-fills from scraper output)

---

## 6. Component hierarchy

The project follows Atomic Design. Components live in `src/components/`:

| Layer | Directory | Rule |
|---|---|---|
| Atomic | `components/atomic/` | Single-purpose building blocks with no business logic. No hooks that touch the DB. |
| Molecules | `components/molecules/` | Combinations of atoms. May have local UI state. No DB hooks. |
| Organisms | `components/organisms/` | Feature sections — may use hooks, may call DB hooks indirectly. |
| Dialogs | `components/dialogs/` | Modal overlays. Receive state via props or context, not from DB directly. |
| Templates | `components/templates/` | Layout wrappers (e.g. `ScreenWrapper`). |

Use React Native Paper components (`Text`, `Button`, `Card`, etc.) before writing custom primitives. Theme colors come from `useTheme()` from `react-native-paper`.

---

## 7. Recipe form architecture

The recipe form is built on `react-hook-form` (RHF) with a Zod resolver. Read-only view, edit, and the three create modes are split into per-mode route wrappers (`RecipeView`, `RecipeEdit`, `RecipeAddManual`, `RecipeAddOcr`, `RecipeAddScrape` under `src/screens/recipe/`) that all delegate to a shared `RecipeFormScreen`. The earlier single `Recipe.tsx` component and its `RecipeFormContext` are gone.

### Form state

`RecipeFormScreen` (`src/screens/recipe/RecipeFormScreen.tsx`) owns RHF's `<FormProvider>`, configured with `zodResolver(recipeFormSchema)`. Form values are read and written through `useFormContext()` / `useController()` / `useFieldArray()` — there is no bespoke form context. Initial `defaultValues` are selected on `mode` by the builders in `src/screens/recipe/defaults/`:

- `buildEmptyDefaults` — blank form (`addManually`); seeds `recipePersons` from `getDefaultPersonsSync()`
- `buildDefaultsFromRecipe` — existing recipe (`edit`, `readOnly`)
- `buildDefaultsFromScrape` — scraped payload (`addFromScrape`)

### Per-column field controllers

Editable fields live under `src/screens/recipe/fields/`. Each ingredient column (`quantity`, `unit`, `name`) and each preparation step binds its own `useController`, so a keystroke in one column re-renders only that controller — not sibling columns or sibling rows. Array mutations go through `useIngredientArray` / `useStepArray` (thin `useFieldArray` wrappers that emit structured patches), keeping unchanged rows object-stable.

### Ingredient quantity scaling

Scaling is no longer a provider effect. `useScalingOnPersonsChange` (`src/screens/recipe/hooks/`) watches `recipePersons` and rewrites ingredient quantities via `scaleQuantityForPersons` (`src/utils/Quantity.ts`), but defers while any ingredient input is focused (tracked by `IngredientFocusContext`) to avoid an on-blur commit clobbering a freshly-scaled value.

### Field hooks

Each field domain has its own hook that reads/writes the shared RHF context:

| Hook | Responsibility |
|---|---|
| `useRecipeIngredients` | Add, edit, merge ingredients; fuzzy DB matching + similarity queue. Emits field-array patches via `IngredientArrayActionsContext` |
| `useRecipeTags` | Add, remove, suggest tags |
| `useRecipeOCR` | Trigger OCR, parse results into form fields |
| `useRecipeScraperValidation` | Validate and apply scraped recipe data |
| `useRandomTagSuggestions` | Provide a random tag sample for the empty-form tag picker |

### Validation and save

Validation is schema-driven: `recipeFormSchema` (`src/schemas/recipeFormSchema.ts`) attaches an i18n message key to every field error. At submit time `collectMissingElementsFromErrors` (`src/utils/recipeFormErrors.ts`) walks RHF's error tree and translates the keys into the missing-elements dialog list; `firstErrorMessage` / inline gating (`src/screens/recipe/helpers/inlineErrorGate.ts`) drive per-field inline errors. `createRecipeSnapshot()` (`src/screens/recipe/helpers/`) assembles current form values into a `recipeTableElement` ready for `useRecipes.addRecipe()` or `useRecipes.editRecipe()`.

### Zod schemas

Zod schemas live in `src/schemas/`: the recipe form (`recipeFormSchema.ts`), the item dialog (`itemDialogSchema.ts`), and bug report (`bugReportSchema.ts`). All use `react-hook-form` with `@hookform/resolvers/zod`.

---

## 8. Bulk import pipeline

```
User selects provider (HelloFresh, Quitoque)
        |
        v
BulkImportSettings screen -- provider configuration
        |
        v
BulkImportDiscovery screen
  useDiscoveryWorkflow hook
    BaseRecipeProvider.discoverRecipes()  -- fetches category pages, extracts URLs
        |
        v
  useRecipeScraper hook
    recipe-scraper native module          -- Python scraper extracts structured data
        |
        v
BulkImportValidation screen
  useValidationWorkflow hook
    Phases: initializing → warning → reviewing → importing → complete
    User maps unknown ingredients/tags to existing DB entries
        |
        v
  useRecipes.addMultipleRecipes()         -- writes to DB
```

### Provider system

`BaseRecipeProvider` (`src/providers/BaseRecipeProvider.ts`) is an abstract class implementing the `RecipeProvider` interface. Concrete providers (`HelloFreshProvider`, `QuitoqueProvider`) override URL discovery logic. All providers are registered in `ProviderRegistry.ts`.

Providers are responsible only for discovering recipe URLs. Scraping (content extraction) is entirely handled by the `recipe-scraper` native module.

### Validation workflow phases

| Phase | Description |
|---|---|
| `initializing` | Analyzes discovered recipes, fuzzy-matches ingredients and tags against the existing DB |
| `warning` | Shows pre-validation summary of skipped or unrecognized items |
| `reviewing` | User manually maps unknown ingredients/tags one at a time |
| `importing` | Writes all validated recipes to the DB in batch |
| `complete` | Shows summary of imported recipes |
| `error` | Something failed; user can retry |

---

## 9. Key invariants

These must not be violated. Violating them causes subtle bugs or breaks CI.

**Never call `RecipeDatabase.getInstance()` in a React component.** Use the focused hooks (`useRecipes`, `useIngredients`, etc.). Direct singleton calls bypass `useSyncExternalStore` subscriptions and produce stale UI.

**Never add `useCallback`, `useMemo`, or `React.memo`.** React Compiler (enabled in `app.config.ts`) handles memoization automatically. Manual memoization interferes with the compiler's analysis and adds dead code.

**Always use path aliases, never relative cross-feature imports.** Use `@utils/RecipeDatabase`, `@hooks/useRecipes`, `@components/organisms/RecipeImage`, etc. The aliases are defined in `tsconfig.json`. Relative imports like `../../utils/RecipeDatabase` are forbidden across feature boundaries.

**Integration tests must not mock hooks, DB, or any in-app layer.** Mock only at irreducible native module boundaries (e.g. `@react-native-ml-kit/text-recognition`). This is what distinguishes integration tests from unit tests.

**All user-facing strings must use i18n.** Use `useI18n()` and add keys to both `en/` and `fr/` translation files. Do not hardcode English strings in components.

**All new utility functions outside React components must have unit tests and TypeDoc comments.** See `CLAUDE.md`.

**Schema changes require a migration.** Adding a column without a `PRAGMA`-guarded `ALTER TABLE` in `init()` breaks existing app installs.

---

## 10. File naming conventions

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `RecipeCard.tsx` |
| Hooks | camelCase, `use` prefix, `.ts` | `useRecipeIngredients.ts` |
| Utilities | PascalCase `.tsx` or `.ts` | `RecipeDatabase.tsx`, `Quantity.ts` |
| Context files | PascalCase, `Context` suffix, `.tsx` | `RecipeDialogsContext.tsx` |
| Type files | PascalCase, `Types` suffix, `.tsx` | `DatabaseElementTypes.tsx`, `BulkImportTypes.tsx` |
| Schemas | camelCase, `Schema` suffix, `.ts` | `itemDialogSchema.ts` |
| Providers | PascalCase, `Provider` suffix, `.ts` | `HelloFreshProvider.ts` |
| Test files | Mirror source path, `.test.ts(x)` | `tests/unit/utils/Quantity.test.ts` |
| Translation files | feature-scoped, camelCase, `.ts` | `recipe.ts`, `bulkImport.ts` |

Screens are PascalCase `.tsx` at `src/screens/` — no subdirectory nesting except for the recipe screen components.

---

## 11. Adding a new feature checklist

Use this checklist when adding a non-trivial feature. Not every step applies to every feature — adjust as needed.

**Types**
- [ ] Define or extend types in `src/customTypes/`
- [ ] Export the types; check nothing relies on the old shape

**Database (if persisted data changes)**
- [ ] Add/modify column in the encoded type and `*ColumnsEncoding` array
- [ ] Add encoding/decoding logic in `RecipeDatabase`
- [ ] Add a `PRAGMA`-guarded `ALTER TABLE` migration in `init()`
- [ ] Expose the new data via a focused hook (or extend an existing one)

**Business logic**
- [ ] Add utility functions outside React components in `src/utils/`
- [ ] Add TypeDoc comments to all exported functions
- [ ] Add unit tests in `tests/unit/`

**UI**
- [ ] Build from the correct atomic layer (atomic → molecule → organism → screen)
- [ ] Use React Native Paper components
- [ ] Support both light and dark themes via `useTheme().colors`
- [ ] Add i18n keys to `src/translations/en/` and `src/translations/fr/`

**Navigation (if a new screen)**
- [ ] Add screen name and params to `ScreenTypes.tsx`
- [ ] Register the screen in `RootNavigator.tsx` or `BottomTabs.tsx`

**Testing**
- [ ] Unit tests for new utilities
- [ ] Integration test if the feature involves a cross-module flow
- [ ] E2E test (Maestro) if the feature has a user-visible workflow that has burned regressions before

**Quality**
- [ ] `npm run quality` passes
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` passes
