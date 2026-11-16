# Overview

## Capabilities

- Recipe CRUD: images, ingredients, preparation steps, tags, nutrition
- OCR from photos (`@react-native-ml-kit/text-recognition`)
- Import from 400+ websites via embedded Python scraper
  (`modules/recipe-scraper`)
- Bulk import from HelloFresh and Quitoque, with validation workflow
- Fuzzy search (MiniSearch) over recipe titles, ingredient names, tags
- Shopping list derived from weekly menu
- Seasonal ingredient awareness
- English + French UI

Offline: only the scraper fetches URLs (during import). No core function needs
connectivity.

## Data flow

Canonical path for a user action reading/writing recipe data:

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

- Hooks get the singleton via `RecipeDatabase.getInstance()`, then call its
  methods.
- Mutations (`addRecipe`, `editRecipe`, …): write SQLite → update cache →
  `notify('recipes')` (or relevant slice).
- Each hook's `useSyncExternalStore` subscribes to a slice. Only subscribers of
  the mutated slice re-render (tag change ≠ re-render of `recipes`-only
  consumers).
- Reads (`get_recipes()`, `get_ingredients()`) return the in-memory array
  synchronously — no `await` in UI after init.
