# State management

No Redux/Zustand. Three categories.

## Global app state (Context, app-wide)

In `src/context/`, provided near root in `App.tsx`:

| Context                 | Hook                          | Responsibility                                   |
| ----------------------- | ----------------------------- | ------------------------------------------------ |
| `DarkModeContext`       | `useContext(DarkModeContext)` | Dark/light theme, persisted to AsyncStorage      |
| `SeasonFilterContext`   | `useSeasonFilter()`           | Global season filter, persisted to AsyncStorage  |
| `DefaultPersonsContext` | `useDefaultPersons()`         | Default serving count, persisted to AsyncStorage |

## Screen-scoped state (Context, recipe form only)

Field state = `react-hook-form` (`FormProvider` in
`src/screens/recipe/RecipeFormScreen.tsx`), read via `useFormContext()` — no
bespoke context. Other contexts wrapping the form body:

| Context                            | Hook                          | Responsibility                                                                                                                                                   |
| ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RecipeDialogsContext`             | `useRecipeDialogs()`          | Dialog open/close (validation, similarity, queue, image-select modal target); `ScanButton` opens image modal through it                                          |
| `IngredientFocusContext`           | `useIngredientFocusRef()`     | Ref counter of focused ingredient inputs; lets `useScalingOnPersonsChange` defer scaling during row edit                                                         |
| `IngredientArrayActionsContext`    | `useIngredientArrayActions()` | Shares field-array `applyPatch` so `useRecipeOCR`, `useRecipeScraperValidation` mutate `recipeIngredients` with the same patch shape (sibling row identity kept) |
| `AutocompleteMaxListHeightContext` | `useContext`                  | Suggestion list height cap from `AutocompleteFocusScrollView` to every bubble inside it; `undefined` (no cap) without provider                                   |

Intentionally narrow: avoid prop-drilling across `useRecipeIngredients`,
`useRecipeTags`, `useRecipeOCR`, `useRecipeScraperValidation`, which share the
form context within one screen.

## Reactive DB state (`useSyncExternalStore`)

| Hook               | Slice               | Exposes                                  |
| ------------------ | ------------------- | ---------------------------------------- |
| `useRecipes`       | `recipes`           | Recipe CRUD, fuzzy search, scaling       |
| `useIngredients`   | `ingredients`       | Ingredient master data, CRUD             |
| `useTags`          | `tags`              | Tag CRUD, random tag suggestions         |
| `useMenu`          | `menu`, `purchased` | Menu management, purchase state          |
| `useShopping`      | `menu`, `purchased` | Derived shopping list (read-only)        |
| `useImportHistory` | —                   | Import history, dismissed-recipe records |

## Idle-time scheduling

- `runWhenIdle` / `cancelIdle` (`src/utils/idle.ts`): primitive for non-critical
  work. Enqueue at React `scheduler` **idle priority** — runs after
  renders/gestures/transitions drain, yields to urgent work.
- Not DOM `requestIdleCallback`: RN (Hermes/JSC) lacks it, a wrapper would
  silently fall back to `setTimeout` on device. `scheduler` ships with React,
  uniform across engines.
- `useTags`, `useIngredients` warm fuzzy index via `useWarmSearchIndex`
  (`src/hooks/useWarmSearchIndex.ts`): schedules `buildItemIndex` with
  `runWhenIdle` on corpus reference change, so the `makeItemIndexCache`
  `WeakMap` is populated before first search.
- Shared foundation for other jank fixes: deferred Home recommendation
  regeneration (#443), Search input pipeline (#438). Per-keystroke render
  responsiveness there uses React 19 `useDeferredValue` instead.
