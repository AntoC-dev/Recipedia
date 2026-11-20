/**
 * Helpers deciding when an OCR scan replaced a filled form field, so the UI
 * can offer a one-level Undo that restores the pre-scan value.
 *
 * List fields (tags, preparation, ingredient names) append on scan and are not
 * undoable here; only fields whose value a scan overwrites are.
 *
 * @module OcrScanUndo
 */

import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import type { OcrModalTarget } from '@utils/OCR';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

const undoableFieldByTarget = {
  [recipeColumnsNames.image]: 'recipeImage',
  [recipeColumnsNames.title]: 'recipeTitle',
  [recipeColumnsNames.description]: 'recipeDescription',
  [recipeColumnsNames.persons]: 'recipePersons',
  [recipeColumnsNames.time]: 'recipeTime',
  [recipeColumnsNames.nutrition]: 'recipeNutrition',
  ingredientQuantities: 'recipeIngredients',
} as const satisfies Partial<Record<OcrModalTarget, keyof RecipeFormInput>>;

/**
 * Form fields whose value an OCR scan replaces instead of appending to.
 * `recipeIngredients` stands for the quantity scan, which overwrites the
 * quantity of each existing row.
 */
export type OcrUndoableField = (typeof undoableFieldByTarget)[keyof typeof undoableFieldByTarget];

/**
 * Maps an OCR modal target to the form field its scan replaces.
 *
 * @param target - The OCR target the user scanned
 * @returns The replaced form field, or `undefined` for appending targets
 *   (tags, preparation, ingredient names, full ingredients)
 */
export function undoableFieldForTarget(target: OcrModalTarget): OcrUndoableField | undefined {
  return (undoableFieldByTarget as Partial<Record<OcrModalTarget, OcrUndoableField>>)[target];
}

/**
 * Whether a form field holds a value the user would lose if a scan replaced it.
 *
 * Follows the form's own empty states:
 * - Text and image fields: non-blank string
 * - Persons and time: not the `defaultValueNumber` sentinel
 * - Nutrition: defined (an undefined table shows the empty state)
 * - Ingredients: at least one row with a non-blank quantity
 *
 * @param field - The undoable form field
 * @param value - The field's current value
 * @returns `true` when the field is filled
 */
export function hasOcrUndoableValue(field: OcrUndoableField, value: unknown): boolean {
  switch (field) {
    case 'recipeImage':
    case 'recipeTitle':
    case 'recipeDescription':
      return typeof value === 'string' && value.trim().length > 0;
    case 'recipePersons':
    case 'recipeTime':
      return value !== defaultValueNumber;
    case 'recipeNutrition':
      return value !== undefined;
    case 'recipeIngredients':
      return (value as RecipeFormInput['recipeIngredients']).some(row => !!row.quantity?.trim());
  }
}

/**
 * Whether a scan replaced a filled field, so an Undo must be offered.
 *
 * True only when the field was filled before the scan and the scan changed
 * its value. Values are compared structurally, as form values are plain data.
 *
 * @param field - The undoable form field
 * @param before - Field value right before the scan wrote its result
 * @param after - Field value right after the scan wrote its result
 * @returns `true` when the scan overwrote a filled value
 */
export function isOcrScanUndoable(
  field: OcrUndoableField,
  before: unknown,
  after: unknown
): boolean {
  return hasOcrUndoableValue(field, before) && JSON.stringify(before) !== JSON.stringify(after);
}
