/**
 * React hook for managing ingredient operations in the Recipe screen.
 *
 * This hook provides functionality for editing, adding, and merging ingredients
 * in a recipe form. It handles validation workflows for fuzzy ingredient matching,
 * quantity merging for duplicate ingredients, and integration with the ingredient
 * validation queue system.
 *
 * @module hooks/useRecipeIngredients
 */

import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { recipeLogger } from '@utils/logger';
import { useFormContext } from 'react-hook-form';
import { noteSeparator, textSeparator, unitySeparator } from '@styles/typography';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useIngredients } from '@hooks/useIngredients';
import { mergeQuantities, validateAndQueueIngredients } from '@utils/RecipeValidationHelpers';
import { namesMatch } from '@utils/NutritionUtils';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useIngredientArrayActions } from '@screens/recipe/fields/IngredientArrayActionsContext';

type IngredientList = (ingredientTableElement | FormIngredientElement)[];

/**
 * Structured patch emitted by `editIngredients`, `replaceAllMatchingFormIngredients`,
 * and `addOrMergeIngredient` so the caller (the ingredient field-array hook)
 * can apply the change via the RHF field-array API:
 *
 * - `replace`: `fieldArray.update(index, row)` — single-slot rewrite.
 * - `merge`: `fieldArray.update(intoIndex, row) + fieldArray.remove(removeIndex)` —
 *   collapse a duplicate row into another.
 * - `remove`: `fieldArray.remove(index)` — drop a row (dismissed from queue).
 * - `append`: `fieldArray.append(row)` — add a new row at the end.
 *
 * Mass `setValue('recipeIngredients', next)` writes are gone: the caller
 * touches only the slots that actually changed, so sibling rows retain
 * object identity and do not re-render.
 */
export type IngredientEditPatch =
  | { kind: 'replace'; index: number; row: ingredientTableElement | FormIngredientElement }
  | {
      kind: 'merge';
      removeIndex: number;
      intoIndex: number;
      row: ingredientTableElement | FormIngredientElement;
    }
  | { kind: 'remove'; index: number }
  | { kind: 'append'; row: ingredientTableElement | FormIngredientElement };

/**
 * Callback the caller passes to `editIngredients` to apply the emitted patch
 * via the local RHF field-array API.
 */
export type ApplyIngredientEditPatch = (patch: IngredientEditPatch) => void;

/**
 * Parses an ingredient display string into its components
 *
 * Extracts quantity, unit, name, and optional note from a formatted ingredient string
 * using the standard separators defined in typography.
 *
 * Supports both old format (without note) and new format (with note):
 * - Old: "100@@g--Rice"
 * - New: "100@@g--Rice%%For the sauce"
 *
 * @param ingredientStr - Formatted string like "100@@g--Rice" or "100@@g--Rice%%For the sauce"
 * @returns Object with quantity, unit, name, and note strings
 */
export function parseIngredientString(ingredientStr: string): {
  quantity: string;
  unit: string;
  name: string;
  note: string;
} {
  const [unitAndQuantity = '', nameAndNote] = ingredientStr.split(textSeparator);
  const [quantity, unit] = unitAndQuantity.split(unitySeparator);

  const [name, note] = nameAndNote?.includes(noteSeparator)
    ? nameAndNote.split(noteSeparator)
    : [nameAndNote, ''];

  return {
    quantity: quantity || '',
    unit: unit || '',
    name: name || '',
    note: note || '',
  };
}

/**
 * Formats ingredient components into a display string
 *
 * Creates a standardized string representation of an ingredient
 * using the standard separators defined in typography.
 * Includes the usage note if present.
 *
 * @param ingredient - The ingredient element to format
 * @returns Formatted string like "100@@g--Rice" or "100@@g--Rice%%For the sauce"
 */
export function formatIngredientString(ingredient: FormIngredientElement): string {
  const base = `${ingredient.quantity || ''}${unitySeparator}${ingredient.unit || ''}${textSeparator}${ingredient.name || ''}`;
  return ingredient.note ? `${base}${noteSeparator}${ingredient.note}` : base;
}

/**
 * Return value of the useRecipeIngredients hook.
 */
export interface UseRecipeIngredientsReturn {
  /**
   * Updates an existing ingredient at the specified index.
   * If the ingredient name changes, triggers validation workflow for fuzzy matching.
   * If only quantity/unit changes, updates the ingredient in place.
   *
   * Does not touch RHF state directly. The caller supplies `applyPatch`, which
   * the hook invokes with `IngredientEditPatch` values so the caller can apply
   * each change via the local RHF field-array API (`fieldArray.update` /
   * `fieldArray.remove`). Sibling rows retain object identity.
   */
  editIngredients: (
    index: number,
    newIngredient: string,
    applyPatch: ApplyIngredientEditPatch
  ) => void;

  /**
   * Adds a validated ingredient to the recipe or merges its quantity if the same ingredient exists.
   * If the ingredient exists with the same unit, quantities are summed.
   * If units differ, the new ingredient replaces the existing one.
   */
  addOrMergeIngredient: (ingredient: ingredientTableElement) => void;

  /**
   * Replaces ALL FormIngredients with matching name with the validated database ingredient.
   * Preserves each ingredient's own quantity/unit/note while applying database metadata.
   * Used by scraper validation when the same ingredient appears multiple times.
   */
  replaceAllMatchingFormIngredients: (validatedIngredient: ingredientTableElement) => void;

  /**
   * Removes every form ingredient whose name matches `name`, emitting one
   * `remove` patch per match (highest index first so earlier removals don't
   * shift the indices still pending). Used by scraper validation when the user
   * dismisses an ingredient from the queue. No-ops on an empty / undefined name.
   */
  removeMatchingFormIngredients: (name: string | undefined) => void;
}

/**
 * React hook for managing ingredient operations in the Recipe screen.
 *
 * This hook provides three main operations:
 * - **editIngredients**: Updates an existing ingredient, triggering validation if the name changes
 * - **addOrMergeIngredient**: Adds a new ingredient or merges quantities if it already exists
 *
 * The hook handles the complexity of ingredient validation, fuzzy matching, and duplicate detection.
 * When an ingredient name is changed, it uses the validation queue system to suggest similar
 * ingredients from the database. For duplicate ingredients with matching units, quantities are
 * automatically summed together.
 *
 * @returns Object containing ingredient manipulation functions
 *
 * @example
 * ```tsx
 * const { editIngredients, addOrMergeIngredient } = useRecipeIngredients();
 *
 * // Edit an ingredient (triggers validation if name changes)
 * editIngredients(0, '200g flour');
 *
 * // Add or merge a validated ingredient
 * addOrMergeIngredient({
 *   id: 1,
 *   name: 'flour',
 *   quantity: '100',
 *   unit: 'g',
 *   season: [],
 *   type: ''
 * });
 * ```
 */
export function useRecipeIngredients(): UseRecipeIngredientsReturn {
  const { setValidationQueue } = useRecipeDialogs();
  const form = useFormContext<RecipeFormInput>();
  const { findSimilarIngredients } = useIngredients();
  const { applyPatch } = useIngredientArrayActions();
  const getRecipeIngredients = (): IngredientList =>
    (form.getValues('recipeIngredients') ?? []) as IngredientList;

  /**
   * Adds an ingredient to the recipe or merges quantities if it already exists.
   *
   * Performs case-insensitive name matching to detect duplicates:
   * - No match → emits an `append` patch.
   * - Same name + same unit + both have different non-empty notes → emits an
   *   `append` patch (treated as a distinct row).
   * - Same name + same unit + compatible notes → emits a `replace` patch at
   *   the existing index with summed quantities, keeps the existing or new
   *   note depending on which is non-empty.
   * - Same name + different unit → emits a `replace` patch at the existing
   *   index with the new ingredient, falling back to the existing quantity
   *   when the incoming one is empty.
   *
   * Patches are applied via the shared IngredientArrayActionsContext so
   * non-touched sibling rows retain object identity.
   *
   * @param ingredient - The validated ingredient to add or merge
   */
  const addOrMergeIngredient = (ingredient: ingredientTableElement) => {
    const prev = getRecipeIngredients();
    const existingIndex = prev.findIndex(existing => namesMatch(existing.name, ingredient.name));

    if (existingIndex === -1) {
      recipeLogger.debug('Adding new ingredient', {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      });
      applyPatch({ kind: 'append', row: ingredient });
      return;
    }

    const existing = prev[existingIndex];
    if (!existing || !existing.name) {
      return;
    }

    if (existing.unit === ingredient.unit) {
      const existingNote = existing.note?.trim();
      const newNote = ingredient.note?.trim();

      if (existingNote && newNote && existingNote !== newNote) {
        recipeLogger.debug('Adding duplicate-name ingredient as new row (note differs)', {
          name: ingredient.name,
          existingNote,
          newNote,
        });
        applyPatch({ kind: 'append', row: ingredient });
        return;
      }

      applyPatch({
        kind: 'replace',
        index: existingIndex,
        row: {
          ...ingredient,
          quantity: mergeQuantities(existing.quantity, ingredient.quantity),
          note: newNote || existingNote,
        },
      });
      return;
    }

    applyPatch({
      kind: 'replace',
      index: existingIndex,
      row: {
        ...ingredient,
        quantity: ingredient.quantity || existing.quantity || '',
      },
    });
  };

  /**
   * Builds a `replace` or `merge` patch for placing `ingredient` at `index`,
   * honoring the duplicate-name merge rules:
   * - same unit → sum quantities, keep note
   * - different unit → overwrite the duplicate slot
   */
  const buildReplacePatch = (
    index: number,
    ingredient: ingredientTableElement
  ): IngredientEditPatch => {
    const current = getRecipeIngredients();
    const duplicateIndex = current.findIndex(
      (ing, i) => i !== index && namesMatch(ing.name, ingredient.name)
    );
    if (duplicateIndex === -1) {
      return { kind: 'replace', index, row: ingredient };
    }
    const existing = current[duplicateIndex]!;
    const merged =
      existing.unit === ingredient.unit
        ? {
            ...ingredient,
            quantity: mergeQuantities(existing.quantity, ingredient.quantity),
            note: ingredient.note || existing.note,
          }
        : ingredient;
    // Place the merged row in the lower of the two slots and drop the higher
    // one — keeps the merged ingredient at a stable, known index regardless of
    // whether the duplicate came before or after the edit position.
    const keepIndex = Math.min(index, duplicateIndex);
    const dropIndex = Math.max(index, duplicateIndex);
    return { kind: 'merge', intoIndex: keepIndex, removeIndex: dropIndex, row: merged };
  };

  /**
   * Edits an existing ingredient at the specified index.
   *
   * Parses the new ingredient string and decides the patch shape:
   * - Name changed → run the fuzzy-match validation queue, emit a `replace`
   *   or `merge` patch on resolution, or a `remove` patch on dismissal.
   * - Name unchanged → emit a single `replace` patch with only the edited
   *   fields applied to the current row.
   *
   * The hook never writes RHF state itself. The caller supplies `applyPatch`
   * to translate the patch into `fieldArray.update` / `fieldArray.remove`
   * calls so unchanged sibling rows keep object identity and do not re-render.
   *
   * @param index - Index of the ingredient to edit
   * @param newIngredient - Formatted ingredient string (e.g., "100@@g--Rice%%For sauce")
   * @param applyPatch - Callback that applies the emitted patch via the local
   *   RHF field-array API.
   */
  const editIngredients = (
    index: number,
    newIngredient: string,
    applyPatch: ApplyIngredientEditPatch
  ) => {
    const recipeIngredients = getRecipeIngredients();
    if (index < 0 || index >= recipeIngredients.length) {
      recipeLogger.warn('Cannot edit ingredient - invalid index', {
        index,
        ingredientsCount: recipeIngredients.length,
      });
      return;
    }

    const {
      quantity: newQuantity,
      unit: newUnit,
      name: newName,
      note: newNote,
    } = parseIngredientString(newIngredient);

    const emitInPlaceUpdate = (ingredient: FormIngredientElement) => {
      const current = getRecipeIngredients();
      const foundIngredient = current[index];
      if (!foundIngredient) return;
      const nextRow: ingredientTableElement | FormIngredientElement = { ...foundIngredient };

      if (ingredient.id && nextRow.id !== ingredient.id) {
        nextRow.id = ingredient.id;
      }
      if (ingredient.name && nextRow.name !== ingredient.name) {
        nextRow.name = ingredient.name;
      }
      if (ingredient.unit && nextRow.unit !== ingredient.unit) {
        nextRow.unit = ingredient.unit;
      }
      if (ingredient.quantity && nextRow.quantity !== ingredient.quantity) {
        nextRow.quantity = ingredient.quantity;
      }
      if (
        ingredient.season &&
        ingredient.season.length > 0 &&
        nextRow.season !== ingredient.season
      ) {
        nextRow.season = ingredient.season;
      }
      if (ingredient.type && nextRow.type !== ingredient.type) {
        nextRow.type = ingredient.type;
      }
      if (ingredient.note !== undefined && nextRow.note !== ingredient.note) {
        nextRow.note = ingredient.note;
      }

      applyPatch({ kind: 'replace', index, row: nextRow });
    };

    const currentRow = recipeIngredients[index]!;
    const nameChanged = currentRow.name !== newName;
    const isResolved = !!(currentRow as ingredientTableElement).type;
    if (newName && newName.trim().length > 0 && (nameChanged || !isResolved)) {
      validateAndQueueIngredients(
        [{ name: newName, unit: newUnit, quantity: newQuantity, note: newNote, season: [] }],
        findSimilarIngredients,
        match =>
          applyPatch(
            buildReplacePatch(index, {
              ...match,
              quantity: newQuantity || match.quantity,
              unit: newUnit || match.unit,
              note: newNote,
            })
          ),
        setValidationQueue,
        {
          onValidated: (originalItem, validatedIngredient) =>
            applyPatch(
              buildReplacePatch(index, {
                ...validatedIngredient,
                quantity: originalItem.quantity || validatedIngredient.quantity,
                unit: originalItem.unit || validatedIngredient.unit,
                note: originalItem.note,
              })
            ),
          onDismissed: () => applyPatch({ kind: 'remove', index }),
        }
      );
    } else {
      emitInPlaceUpdate({
        name: newName,
        unit: newUnit,
        quantity: newQuantity,
        note: newNote,
        season: [],
      });
    }
  };

  /**
   * Replaces ALL FormIngredients with matching name with the validated database ingredient.
   *
   * Used by scraper validation when the same ingredient appears multiple times in a recipe.
   * Each matching ingredient keeps its own quantity and note while receiving database metadata
   * (id, name, type, season, unit).
   *
   * Emits one `replace` patch per matching row via the shared
   * `IngredientArrayActionsContext` so non-matching siblings retain object
   * identity. Non-matching rows are not touched.
   *
   * @param validatedIngredient - The validated database ingredient to use as template
   */
  const replaceAllMatchingFormIngredients = (validatedIngredient: ingredientTableElement) => {
    const current = getRecipeIngredients();
    current.forEach((existing, index) => {
      if (!namesMatch(existing.name, validatedIngredient.name)) {
        return;
      }
      applyPatch({
        kind: 'replace',
        index,
        row: {
          id: validatedIngredient.id,
          name: validatedIngredient.name,
          type: validatedIngredient.type,
          season: validatedIngredient.season,
          quantity: existing.quantity || '',
          unit: validatedIngredient.unit,
          note: existing.note,
        },
      });
    });
  };

  /**
   * Removes every form ingredient whose name matches `name` via `remove`
   * patches so non-matching siblings retain object identity. Patches are
   * emitted highest-index first to keep the remaining indices stable.
   *
   * @param name - Name to match (case-insensitive via `namesMatch`)
   */
  const removeMatchingFormIngredients = (name: string | undefined) => {
    if (!name) return;
    const current = getRecipeIngredients();
    const indices = current
      .map((ing, index) => (namesMatch(ing.name, name) ? index : -1))
      .filter(index => index !== -1)
      .sort((a, b) => b - a);
    indices.forEach(index => applyPatch({ kind: 'remove', index }));
  };

  return {
    editIngredients,
    addOrMergeIngredient,
    replaceAllMatchingFormIngredients,
    removeMatchingFormIngredients,
  };
}
