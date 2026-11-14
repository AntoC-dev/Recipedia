# Recipe form

`react-hook-form` (RHF) + Zod resolver. Per-mode route wrappers (`RecipeView`,
`RecipeEdit`, `RecipeAddManual`, `RecipeAddOcr`, `RecipeAddScrape` under
`src/screens/recipe/`) delegate to shared `RecipeFormScreen`. Old single
`Recipe.tsx` and its `RecipeFormContext` are gone.

## Form state

- `RecipeFormScreen` (`src/screens/recipe/RecipeFormScreen.tsx`) owns
  `<FormProvider>` with `zodResolver(recipeFormSchema)`.
- Values via `useFormContext()` / `useController()` / `useFieldArray()` — no
  bespoke form context.
- `defaultValues` picked by `mode` from builders in
  `src/screens/recipe/defaults/`:
  - `buildEmptyDefaults` — blank (`addManually`); seeds `recipePersons` from
    `getDefaultPersonsSync()`
  - `buildDefaultsFromRecipe` — existing recipe (`edit`, `readOnly`)
  - `buildDefaultsFromScrape` — scraped payload (`addFromScrape`)

## Unsaved-changes guard

- `useUnsavedChangesGuard` (`src/hooks/useUnsavedChangesGuard.tsx`) wraps React
  Navigation `usePreventRemove`; mounted by `RecipeFormScreen` with
  `form.formState.isDirty`.
- While dirty, every route removal (hardware/predictive back, swipe, AppBar back
  arrow, Cancel) is intercepted → discard confirmation. Confirm replays the
  exact intercepted action (destination preserved).
- Save paths call `allowRemoval()` before `onSaveSuccess`: form still dirty
  then, else the guard blocks the post-save navigation.

## Per-column field controllers

- Editable fields: `src/screens/recipe/fields/`.
- Each ingredient column (`quantity`, `unit`, `name`) and each step binds its
  own `useController` → keystroke re-renders only that controller, not sibling
  columns/rows.
- Array mutations via `useIngredientArray` / `useStepArray` (thin
  `useFieldArray` wrappers emitting structured patches) → unchanged rows stay
  object-stable.

## Ingredient quantity scaling

- Not a provider effect. `useScalingOnPersonsChange`
  (`src/screens/recipe/hooks/`) watches `recipePersons`, rewrites quantities via
  `scaleQuantityForPersons` (`src/utils/Quantity.ts`).
- Defers while any ingredient input is focused (`IngredientFocusContext`), so an
  on-blur commit can't clobber a freshly scaled value.

## Search-field focus mode

- `useAutocompleteFocusMode` pins a focused autocomplete field `padding.small`
  below the top of the form's `KeyboardAwareScrollView`, so its suggestion
  bubble opens into the room above the keyboard.
- Focus detection: `onFocus` on the scroll view wrapper + walk up to
  `AUTOCOMPLETE_ANCHOR_ID`. Focused anchor + wrapper kept in a ref; cleared on
  plain-input focus only (kept across keyboard hide, so reopening the same field
  without a new focus event re-pins it).
- Pin trigger: `useKeyboardHandler` `onEnd` (worklet → `scheduleOnRN`) with an
  open keyboard, plus right away on focus when the keyboard is already open.
  Target from `getAutocompletePinScrollY` (scroll y tracked via `onScroll`,
  anchor + wrapper rects read fresh at pin time); no scroll below 1px.
- Invariant: `bottomOffset` stays constant (toolbar + caret clearance). Changing
  it while the keyboard resizes (numeric → text) races the scroll view's own
  keyboard handler (react-native-keyboard-controller #1689) → field ends under
  the app bar.
- `maxListHeight`: room below the pinned field above the toolbar (not the row
  count, so stable while typing), passed as a plain prop to each
  `TextInputWithDropDown` via `RecipeTagsField` → `RecipeTags` and
  `RecipeIngredientsField` → `IngredientRowField` → `IngredientRow`; applied as
  list `maxHeight`. Omitted → list uncapped.
- Hook + helpers stay in `src/screens/recipe/` (only screen with autocomplete
  inside a keyboard-aware scroll view). Move to `src/hooks/` / `src/utils/` when
  a second appears.

## Field hooks

Each reads/writes the shared RHF context:

| Hook                         | Responsibility                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `useRecipeIngredients`       | Add/edit/merge ingredients; fuzzy DB match + similarity queue; emits field-array patches via `IngredientArrayActionsContext` |
| `useRecipeTags`              | Add, remove, suggest tags                                                                                                    |
| `useRecipeOCR`               | Trigger OCR, parse into form fields                                                                                          |
| `useRecipeScraperValidation` | Validate + apply scraped data                                                                                                |
| `useRandomTagSuggestions`    | Random tag sample for empty-form tag picker                                                                                  |

## Validation and save

- Schema-driven: `recipeFormSchema` (`src/schemas/recipeFormSchema.ts`) attaches
  an i18n message key to every field error.
- Submit: `collectMissingElementsFromErrors` (`src/utils/recipeFormErrors.ts`)
  walks RHF's error tree, translates keys into the missing-elements dialog list.
- Inline errors: `firstErrorMessage` / inline gating
  (`src/screens/recipe/helpers/inlineErrorGate.ts`).
- `createRecipeSnapshot()` (`src/screens/recipe/helpers/`) builds a
  `recipeTableElement` for `useRecipes.addRecipe()` / `useRecipes.editRecipe()`.

## Zod schemas

In `src/schemas/`: `recipeFormSchema.ts` (recipe form), `itemDialogSchema.ts`
(item dialog), `bugReportSchema.ts` (bug report). All via `react-hook-form` +
`@hookform/resolvers/zod`.
