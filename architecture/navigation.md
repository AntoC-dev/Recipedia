# Navigation

React Navigation v7 (native-stack). Screen/param types:
`src/customTypes/ScreenTypes.tsx`.

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

- All screens header-less (`headerShown: false`).
- `EXPO_PUBLIC_DISABLE_ANIMATIONS=true` disables animations globally (E2E).

## Navigator behaviour

- **Screen freezing**: `enableFreeze()` once in `App.tsx`; both navigators set
  `freezeOnBlur` → blurred subtree suspended, no re-render on context updates.
  `BottomTabs` gates `freezeOnBlur` on the same condition as
  `detachInactiveScreens`: during the copilot tutorial all tabs stay live
  (freezing a tab an overlay step targets stalls the walkthrough).
- **Error boundaries**: crash-prone screens on untrusted input (`RecipeAddOcr`,
  `RecipeAddScrape`, `BulkImportDiscovery`) set `layout={errorBoundaryLayout}`
  on their `Stack.Screen`. Replaced the old `withErrorBoundary` HOC — boundary
  is part of the route declaration, not the component export.
- **System back (Android)**: `android.predictiveBackGestureEnabled` stays
  `false` in `app.config.ts`. If on, API 33–35 bypass RN's `onBackPressed` →
  `BackHandler` (React Navigation) never gets back → app closes from any screen.
- **Receiving shared content**: `expo-sharing` config plugin registers a share
  target (iOS share extension; Android `ACTION_SEND` for `text/plain`,
  `image/*`). `AppWrapper` renders `IncomingShareImporter` beside
  `RootNavigator` in its Ready state (DB initialised; outside any screen → never
  frozen). Checks on mount (cold start) and each foreground return (warm share).
  Photo → `RecipeAddOcr`; bare web URL → `UrlRecipeImport`. Import screens push
  over the current screen; a recipe being edited stays underneath.
- **Preloading**: `Home` preloads only the `Search` tab (first render derives
  filter lists from every recipe). Limited to one screen because React
  Navigation exempts preloaded routes from `freezeOnBlur`
  (`shouldFreeze: … && !isPreloaded`) and clears a preloaded tab key only on
  `JUMP_TO` → each preload loses freezing until first opened. Recipe cards do
  **not** preload `RecipeView`: `onPressIn` fires on every touch-down incl.
  scroll starts, causing navigator state updates and remounts far more often
  than actual opens.

## Recipe routes

Each recipe route is a thin wrapper forwarding narrow params
(`src/customTypes/RecipeNavigationTypes.tsx`) to shared `RecipeFormScreen`,
which derives `mode`:

| Route             | `mode`          | Purpose                           |
| ----------------- | --------------- | --------------------------------- |
| `RecipeView`      | `readOnly`      | View existing recipe              |
| `RecipeEdit`      | `edit`          | Edit existing recipe              |
| `RecipeAddManual` | `addManually`   | New recipe, blank form            |
| `RecipeAddOcr`    | `addFromPic`    | From photo (OCR pre-fills fields) |
| `RecipeAddScrape` | `addFromScrape` | From scraped web data (pre-fills) |
