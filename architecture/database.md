# Database

## Singleton

- `RecipeDatabase` (`src/utils/RecipeDatabase.tsx`): only SQLite entry point.
  Private-constructor singleton, `RecipeDatabase.getInstance()`.
- `init()` runs once at startup: creates tables, runs migrations.
- **Never call `RecipeDatabase.getInstance()` in a React component** — use
  focused hooks. Allowed from non-React code outside the tree (e.g.
  `datasetInitializer.ts`).

## Tables

| Table                       | Type file key                 | Purpose                                        |
| --------------------------- | ----------------------------- | ---------------------------------------------- |
| `RecipesTable`              | `recipeTableElement`          | Core recipe data                               |
| `IngredientsTable`          | `ingredientTableElement`      | Ingredient master data (shared across recipes) |
| `TagsTable`                 | `tagTableElement`             | Tag definitions                                |
| `MenuTable`                 | `menuTableElement`            | Weekly cooking menu                            |
| `PurchasedIngredientsTable` | `purchasedIngredientElement`  | Shopping list purchase state                   |
| `ImportHistoryTable`        | `importHistoryTableElement`   | Previously discovered bulk-import recipes      |
| `DismissedRecipesTable`     | `dismissedRecipeTableElement` | Recipes permanently dismissed from bulk import |

Table/column name constants: `src/customTypes/DatabaseElementTypes.tsx`.

## Encoding

- SQLite stores primitives only. Complex fields (ingredient/tag arrays, steps,
  nutrition) serialize to TEXT with separators from `src/utils/TextParsing.ts`:
  `textSeparator`, `unitySeparator`, `EncodingSeparator`, `noteSeparator`.
- Per table: an `encoded*Element` type (e.g. `encodedRecipeElement`) + a
  `*ColumnsEncoding` array declaring each column's SQLite type.
- Read: decode `encoded*Element` → rich TS type. Write: encode rich type → flat
  primitives before SQL.

## In-memory cache and pub/sub

- `init()` loads all rows into `_recipes`, `_ingredients`, `_tags`, `_menu`,
  `_purchasedIngredients`.
- Ingredients + tags load first: recipe rows store only their ids, resolved via
  id-keyed maps over those caches (no per-reference query).
- After a mutation, `notify(slice)` fires listeners from
  `subscribe(slice, callback)`; hooks bind it to `useSyncExternalStore`.
- `StoreSlice`: `'recipes' | 'ingredients' | 'tags' | 'menu' | 'purchased'`.

## Decode integrity

Decoding resolves cross-table refs and casts strings to app types; a corrupt row
would silently lose data. Each decoder validates using in-memory data only (no
extra queries):

| Decoder           | Checks                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| recipes           | ingredient/tag ids resolving to no cached row                              |
| ingredients       | `TYPE` outside `ingredientType` enum; `SEASON` months outside `ALL_MONTHS` |
| ingredients, tags | duplicate ids (id-keyed lookups would return an arbitrary row)             |

- `reportUnresolvedMenuRecipes`: compares `_menu` vs `_recipes` after `init()`
  fills both — lives beside decoders, since a menu row decode can't see recipes.
- Every failure → `recordDecodeError`: logs, and records the first one on
  `RecipeDatabase._decodeError` when `__DEV__ || getDatasetType() === 'test'`.
  Log + record in one function so a new check can't do one without the other.
- Surfacing: `get_decode_error()` → `decodeError` from `useRecipes`, `useMenu`,
  `useIngredients`, `useTags` → rethrown in render by `AppWrapper` → root
  `ErrorBoundary` (`App.tsx`) shows `ErrorFallback`.
- Recording notifies `recipes` so consumers mounted before the failure
  re-render.
- Production: logs, degrades the affected row.
- `performance` build records nothing (benchmarks never hit the guard).
  Detection (set lookups, no queries) runs everywhere.
- **New decoder resolving a reference to another table → add its check here**,
  or its corruption goes unnoticed.

## Schema migrations

New columns: `ALTER TABLE ... ADD COLUMN ...` inside `init()`, guarded by a
`PRAGMA table_info` check → idempotent on fresh installs and upgrades.
