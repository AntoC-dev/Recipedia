# TODO: New Features to Explore

## Bug

- Tag not found for web but in dialog, can't add it because it is found
- in tutorial, first overlay is not width enough
- quitoque test should select a recipe by name to avoid flaky
- checkbox in iOS is not seeable. How and why ?
- TextInput on iOS (recipe) isn't centered
- quantities in ingredients doesn't have the background color on the whole cell
- Visual bug on the bottom: white space on the bottom of the screen
- On https://www.quitoque.fr/recettes/boulettes-de-lentilles-et-sauce-cremeuse-aux-carottes eggs quantity not parsed
- On https://www.quitoque.fr/recettes/burger-au-paprika-poitrine-fumee-et-cheddar-pane, farine not parsed
- On https://www.quitoque.fr/recettes/burger-au-poulet-pimente-croustillant, 120g of nectarine has been found ?
- On BulkValidation, parsing could fail and we see this on top of the continue button of the bulk import selection: '
  selection.noRecipesParsed'
- En FR: des fois tag, des fois étiquette.
- Manque de E2E sur la saisonnalité des ingrédients
- When editing or adding a recipe, if user press validate whithout closing the keyboard, it is not saved.
- Search bar: mettre en minuscule
- Bouillon de .... : bouillon n'apparait pas, pourquoi ?

## Feature

- add a text when filter returns an empty list of recipes
- add back the fact that tap on a textinput place the input at center of the screen (right on top of the keyboard)
- Add a way to print (paper) the recipe
- Retry scraping if network error occurs
- triage dans search screen
- some ingredients have mL quantities but sometimes spoon. How to handle it ?
- Add a loading of some kind when removing a recipe or the shopping list
- Dark mode placeholder for recipe image should be adapted. Also, always use this placeholder instead of the background
  color
- Fichier de log devrait être repris à 0 de temps en temps. Pas besoin de conserver des années de logs. Le plus simple:
  après chaque redémarrage, supprimer le fichier de log précédent (sauf en build de test).
- Bouton de retour en haut sur search screen
- Etre permissif auc accents dans les search bar

## Refactor

- Remove temporary `migrateWildcardSeasons()` from `RecipeDatabase.init()` once all users have updated past this version

- Remove temporary `migrateWildcardSeasons()` from `RecipeDatabase.init()` once all users have updated past this version

- Replace `Alert.alert()` calls in hooks and non-UI code with a global snackbar (React Native Paper `Snackbar`).
  Requires a `SnackbarContext` (or extending `RecipeDialogsContext`), a root-level `Snackbar` component, and updating
  all call sites. Also covers OCR feedback: `fillOneField` should return a status (`empty` / `mismatch` / `success`) so
  `Recipe.tsx` can surface a snackbar when ingredient quantities OCR returns nothing or a wrong count.

- Change size of typography to be more standard
- fix dot or coma for floating values
- don't inline style for performance
- Refactor so that we don't use HorizontalList anymore
- Fix the build warnings including nodes warnings. Add a build log analyzer in CI ?
- Loading the image in modal
- factorize the DatabasPickerDialog with the SearchBarDialog
- Factorize accordions flows
- Dropdown items should run into a FlashList (or other virtualized list) for test and performance
- split search E2E in 2 suites
- add logs in module: Now, I want you to add logs everywhere it makes sense in the module. I won't have any crash or
  silent error . I moved to plan mode because you may have a lot to do.
  Be careful because I don’t think we can use the logger of the app in the module
- Add labels on every items on ocr
- Improve the async
- Refactor filter tests (mutualize and assert ingredients names)
- Use dense on text inputs. On dialogs ? On all of them ?
- Don't package test directory when building
- In E2E, lots of duplicated code (for instance, tap on RecipeEdit while we have a flow for this already)

## Test

- Maestro has visual testing now. It can be useful

## Chaquopy

Announce it will begin the iOS suport. Check for this and integrated it once available.

## Security

- 5 low-severity `@tootallnate/once` vulnerabilities remain inside
  `jest-expo → jest-environment-jsdom → jsdom → http-proxy-agent`. No safe fix exists — the only resolution npm offers
  is downgrading `jest-expo` to 47.0.1 (breaking). `npm run security:audit` passes (`--audit-level=moderate`). Revisit
  when `jest-expo` upgrades its jsdom dependency.

## React 19 Features

- TODO: Use React 19 `useOptimistic()` hook in Shopping list for instant UI feedback
- TODO: Consider React 19 `use()` hook to simplify async recipe loading
- TODO: Simplify context providers using React 19 `<Context>` syntax (no `.Provider`)
- TODO: Consider React 19 Actions for SearchBar form handling

## Database & Offline (expo-sqlite)

- TODO: Enable expo-sqlite web support for browser testing (wa-sqlite)
- TODO: Evaluate Turso offline sync for expo-sqlite when it exits beta
- TODO: Explore SQLite extensions support (`sqlite-vec` for vector search)

## Image & Media (expo-image, expo-asset)

- TODO: Add `placeholderContentFit` prop to Image components for better placeholder handling
- TODO: Implement Live Text interaction on recipe images (iOS) for text extraction
- TODO: Explore Rive animations (.riv) support from expo-asset 11.1 for interactive UI elements
- TODO: Add dark mode splash screen variant using expo-splash-screen dark mode support
- TODO: Configure animated splash screen fade using `setOptions()` API

## Navigation & UI (react-native-screens 4.23+, Android 16)

**Android 15/16 Compatibility:**

- TODO: Implement predictive back gesture support (OnBackInvokedCallback) for native stack

**Other UI Improvements:**

- TODO: Evaluate pageSheet presentation for recipe detail modals (iOS)
- TODO: Add fitToContents sheet height for dynamic content in bottom sheets

## Performance & Lists (@shopify/flash-list v2)

- TODO: Explore masonry layout for recipe grid with varying card heights
- TODO: Use FlashList v2 hooks (`useRecyclingState`, `useLayoutState`) for better state management
- TODO: Leverage auto-sizing items (removed estimatedItemSize in v2)
- TODO: When Expo SDK upgrades flash-list beyond 2.0.2, switch back to the official `@shopify/flash-list/jestSetup` and
  remove `tests/mocks/deps/flash-list-mock.tsx`. The bug (jestSetup references `RecyclerView` which is not exported,
  making `FlashList` undefined) was fixed in 2.0.3.

## New SDK 55 Features

- TODO: Explore expo-glass-effect for iOS 26 Liquid Glass UI effects
- TODO: Evaluate expo-blob for binary data handling
- TODO: Consider native tabs (beta) for liquid glass navigation on iOS/Android
- TODO: Explore expo-app-integrity for app verification with secure backends

**expo-sqlite enhancements:**

- TODO: Migrate to tagged template literals API for type-safe parameterized SQL (e.g.,
  `` db.sql`SELECT * FROM recipes WHERE id = ${id}` ``)
- TODO: Use SQLite Inspector DevTools Plugin for real-time database browsing during development

**expo-image enhancements:**

- TODO: Explore HDR image support for recipe photos on iOS
- TODO: Use SF Symbols as icons in image placeholders/error states

**expo-crypto:**

- TODO: Evaluate AES-GCM encryption for local data protection (shopping lists, private recipes)

**expo-file-system:**

- TODO: Use append option in write methods for incremental log/export file building

**Performance:**

- TODO: Evaluate Hermes v1 opt-in (`useHermesV1: true` in expo-build-properties) for better runtime performance
- TODO: Enable bytecode diffing (`enableBsdiffPatchSupport` in updates config) for ~75% smaller OTA updates

**react-native-screens 4.23+:**

- TODO: Evaluate glassy form sheets presentation for recipe detail modals (iOS 26)
- TODO: Explore iPad sidebar mode for multi-column recipe browsing layout

**@shopify/flash-list 2.x:**

- TODO: Evaluate sticky header enhancements (backdrop blur, offset) for section headers in ingredient lists

**expo-sharing:**

- TODO: Implement receive-shared-data flow (iOS share extension / Android intent filter) to allow importing recipes from
  other apps
