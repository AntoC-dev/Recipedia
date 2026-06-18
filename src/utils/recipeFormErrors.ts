/**
 * recipeFormErrors - Helpers for translating react-hook-form errors into the
 * legacy `missingElements` string array used by the existing validation
 * dialog flow.
 *
 * Recipe form validation now lives in `recipeFormSchema`. The schema sets
 * each field's error message to an i18n key (e.g.
 * `alerts.missingElements.titleRecipe`). At submit time the screen collects
 * every leaf error message from `form.formState.errors`, deduplicates, and
 * runs them through `t()` for display.
 *
 * @module utils/recipeFormErrors
 */

import type { FieldErrors, FieldPath, UseFormReturn } from 'react-hook-form';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

/**
 * The set of top-level fields whose inline error gating reads `touchedFields`.
 * Used by helpers that force-touch fields after a non-blur write (OCR/scraper
 * population, or a submit attempt).
 *
 * The field-array roots (`recipeIngredients`, `recipePreparation`) are
 * deliberately excluded: a `setValue` on a field-array root regenerates the
 * array's internal keys and remounts every row, and their inline gates read
 * `dirtyFields` / `isSubmitted` rather than root `touchedFields`, so touching
 * the root would cost a full remount for no gating benefit. `recipeNutrition`
 * is likewise gated on dirty/submitted, not touched.
 */
const RECIPE_FORM_FIELD_NAMES: FieldPath<RecipeFormInput>[] = [
  'recipeImage',
  'recipeTitle',
  'recipeDescription',
  'recipeTags',
  'recipePersons',
  'recipeTime',
];

/**
 * Marks the touched-gated top-level recipe form fields as touched without
 * changing their value. Needed when values are populated outside of user
 * interaction (OCR, scraped data, programmatic write) and inline error
 * indicators are gated on `fieldState.isTouched`.
 */
export function markAllRecipeFieldsTouched(form: UseFormReturn<RecipeFormInput>): void {
  for (const name of RECIPE_FORM_FIELD_NAMES) {
    form.setValue(name, form.getValues(name) as never, { shouldTouch: true });
  }
}

type ErrorNode = unknown;

/**
 * Keys present on RHF's internal `FieldError` shape that must NOT be recursed
 * into. `ref` holds the native input handle (which carries fiber cycles in
 * React Native) and `type`/`types` are validation-rule metadata, not nested
 * errors.
 */
const RHF_ERROR_INTERNAL_KEYS = new Set(['ref', 'type', 'types']);

function hasOwnMessage(node: ErrorNode): node is { message: string } {
  return (
    !!node &&
    typeof node === 'object' &&
    'message' in (node as Record<string, unknown>) &&
    typeof (node as { message: unknown }).message === 'string'
  );
}

/**
 * Walks an arbitrary react-hook-form errors tree, collecting every leaf
 * `message` value. Skips RHF's internal keys to avoid traversing native refs
 * (which can carry cycles or massive fiber graphs on React Native).
 */
function collectMessages(node: ErrorNode, sink: Set<string>): void {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (hasOwnMessage(node)) {
    sink.add(node.message);
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (RHF_ERROR_INTERNAL_KEYS.has(key)) continue;
    if (value && typeof value === 'object') {
      collectMessages(value, sink);
    }
  }
}

/**
 * Translates the unique i18n keys present in a recipe form's errors tree into
 * the flat list of missing-element strings consumed by
 * `RecipeDialogsContext.showValidationErrorDialog`.
 *
 * @param errors - The react-hook-form errors tree for the recipe form
 * @param t - Translation function
 * @returns Array of translated missing-element labels, deduplicated
 */
export function collectMissingElementsFromErrors(
  errors: FieldErrors<RecipeFormInput>,
  t: (key: string) => string
): string[] {
  const keys = new Set<string>();
  collectMessages(errors, keys);
  return Array.from(keys).map(key => t(key));
}

/**
 * Maps a schema i18n key (which targets the missing-elements dialog phrasing)
 * to its inline-form equivalent. Inline messages live under
 * `alerts.inlineErrors.*` and use imperative phrasing better suited to a
 * field-level error label.
 */
const INLINE_KEY_MAP: Record<string, string> = {
  'alerts.missingElements.image': 'alerts.inlineErrors.image',
  'alerts.missingElements.titleRecipe': 'alerts.inlineErrors.titleRecipe',
  'alerts.missingElements.titleIngredients': 'alerts.inlineErrors.titleIngredients',
  'alerts.missingElements.ingredientNames': 'alerts.inlineErrors.ingredientRow',
  'alerts.missingElements.ingredientQuantities': 'alerts.inlineErrors.ingredientRow',
  'alerts.missingElements.ingredientInDatabase': 'alerts.inlineErrors.ingredientRow',
  'alerts.missingElements.titlePreparation': 'alerts.inlineErrors.titlePreparation',
  'alerts.missingElements.titlePersons': 'alerts.inlineErrors.titlePersons',
  'alerts.missingElements.titleTime': 'alerts.inlineErrors.titleTime',
  'alerts.missingElements.nutrition': 'alerts.inlineErrors.nutrition',
};

/**
 * Translates a schema error key into an inline-friendly message. Falls back
 * to running the key through `t` as-is when no mapping exists.
 */
export function inlineMessage(
  key: string | undefined,
  t: (key: string) => string
): string | undefined {
  if (!key) return undefined;
  return t(INLINE_KEY_MAP[key] ?? key);
}

function findFirstMessage(node: ErrorNode): string | undefined {
  if (!node || typeof node !== 'object') return undefined;
  if (hasOwnMessage(node)) return node.message;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (RHF_ERROR_INTERNAL_KEYS.has(key)) continue;
    const found = findFirstMessage(value);
    if (found) return found;
  }
  return undefined;
}

/**
 * Returns the first translated message found anywhere in the given errors
 * sub-tree, or `undefined` when the sub-tree has no errors. Used by the
 * screen to surface a single inline error per field even when the schema
 * attaches issues to nested paths (e.g. nutrition fields, ingredient rows).
 *
 * Walks the tree depth-first and returns on the first leaf with a `message`,
 * mapping the schema key through `INLINE_KEY_MAP` so callers always receive
 * the inline-phrasing translation.
 */
export function firstErrorMessage(node: ErrorNode, t: (key: string) => string): string | undefined {
  return inlineMessage(findFirstMessage(node), t);
}

/**
 * Returns `true` when the given errors sub-tree contains any leaf message.
 * Boolean-only counterpart to `firstErrorMessage` for callers that gate on
 * presence of an error without needing the translated text.
 */
export function hasErrorMessage(node: ErrorNode): boolean {
  return findFirstMessage(node) !== undefined;
}

/**
 * Returns `true` when an RHF `dirtyFields` slice marks anything dirty. The
 * slice is either a boolean (scalar field) or a nested object/array whose
 * dirtied leaves are `true` (field arrays, object fields like nutrition).
 *
 * Shared by every inline-error gate that opens on first interaction
 * (ingredient rows, nutrition cells), so the dirty-tree walk lives in one
 * place alongside the error-tree walks above.
 */
export function isNestedDirty(node: unknown): boolean {
  if (!node) return false;
  if (typeof node === 'boolean') return node;
  if (typeof node !== 'object') return false;
  return Object.values(node as Record<string, unknown>).some(isNestedDirty);
}
