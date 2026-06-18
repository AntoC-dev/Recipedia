/**
 * useIngredientArray - field-array operations + `availableIngredients`
 * derivation for the editable ingredients field.
 *
 * Owns:
 * - The RHF `useFieldArray` mount on `recipeIngredients`.
 * - Append/remove handlers that trigger validation when the array shrinks
 *   (RHF's `remove` does not validate on its own in `onTouched` mode).
 * - The `editIngredients` patch path that routes name-change commits through
 *   the fuzzy DB match queue.
 * - The derived `availableIngredients` list — the DB master list minus the
 *   names already used in the current array.
 *
 * Per-row "edited" state is read directly from `formState.dirtyFields` via
 * the consumer — no parallel `Set` to keep in sync across array mutations.
 *
 * @module screens/recipe/fields/useIngredientArray
 */

import { useMemo } from 'react';
import { useFieldArray, UseFormReturn, useWatch } from 'react-hook-form';

import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { useIngredients } from '@hooks/useIngredients';
import {
  ApplyIngredientEditPatch,
  IngredientEditPatch,
  useRecipeIngredients,
} from '@hooks/useRecipeIngredients';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useIngredientArrayActionsRegister } from './IngredientArrayActionsContext';

const NAME_JOIN_DELIMITER = '';

type Form = UseFormReturn<RecipeFormInput>;
export type IngredientRowValue = ingredientTableElement | FormIngredientElement;

export interface UseIngredientArrayParams {
  form: Form;
}

export interface UseIngredientArrayResult {
  fieldArray: ReturnType<typeof useFieldArray<RecipeFormInput, 'recipeIngredients'>>;
  availableIngredients: string[];
  handleAddIngredient: () => void;
  handleRemoveIngredient: (index: number) => void;
  handleEditIngredient: (index: number, formatted: string) => void;
  rowCount: number;
}

export function useIngredientArray({ form }: UseIngredientArrayParams): UseIngredientArrayResult {
  const fieldArray = useFieldArray({ control: form.control, name: 'recipeIngredients' });
  const { ingredients: dbIngredients } = useIngredients();
  const { editIngredients } = useRecipeIngredients();

  /**
   * Applies a patch emitted by `useRecipeIngredients.editIngredients` via the
   * local field-array API. Touching only the affected slots preserves the
   * object identity of every other row, which is what stops the cascade
   * re-render the previous mass `setValue('recipeIngredients', next)` caused.
   *
   * Validation is re-run after each apply to clear any stale row error left
   * over from before the edit resolved the row against the database.
   */
  const applyEditPatch: ApplyIngredientEditPatch = (patch: IngredientEditPatch) => {
    switch (patch.kind) {
      case 'replace':
        fieldArray.update(patch.index, patch.row as RecipeFormInput['recipeIngredients'][number]);
        // Validate the whole array (not just the replaced sub-path) so the
        // row-error gate's `useFormState` errors recompute and a now-resolved
        // row drops its stale inline error.
        void form.trigger('recipeIngredients');
        return;
      case 'merge':
        fieldArray.update(
          patch.intoIndex,
          patch.row as RecipeFormInput['recipeIngredients'][number]
        );
        fieldArray.remove(patch.removeIndex);
        void form.trigger('recipeIngredients');
        return;
      case 'remove':
        fieldArray.remove(patch.index);
        void form.trigger('recipeIngredients');
        return;
      case 'append':
        fieldArray.append(patch.row as RecipeFormInput['recipeIngredients'][number]);
        void form.trigger('recipeIngredients');
    }
  };

  /**
   * Applies a patch coming from a feature hook (OCR / scraper validation) via
   * the shared `IngredientArrayActionsContext`. These are system writes, not
   * user edits, so they must NOT mark rows dirty — otherwise freshly populated
   * rows (e.g. an OCR name with no quantity yet) would open the per-row inline
   * error gate before the user has touched anything. Writing through
   * `setValue(..., { shouldDirty: false, shouldTouch: false })` keeps
   * `useFieldArray.fields` in sync (rows render) while leaving the dirty/touched
   * state untouched; the row error still surfaces on submit or once the user
   * edits the row.
   */
  const applySystemPatch: ApplyIngredientEditPatch = (patch: IngredientEditPatch) => {
    const current = (form.getValues('recipeIngredients') ?? []) as IngredientRowValue[];
    let next: IngredientRowValue[];
    switch (patch.kind) {
      case 'replace':
        next = current.map((row, i) => (i === patch.index ? patch.row : row));
        break;
      case 'merge':
        next = current
          .map((row, i) => (i === patch.intoIndex ? patch.row : row))
          .filter((_, i) => i !== patch.removeIndex);
        break;
      case 'remove':
        next = current.filter((_, i) => i !== patch.index);
        break;
      case 'append':
        next = [...current, patch.row];
        break;
    }
    form.setValue('recipeIngredients', next as RecipeFormInput['recipeIngredients'], {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  };

  const rowCount = fieldArray.fields.length;

  /** Appends an empty ingredient row to the field array. */
  const handleAddIngredient = () => {
    fieldArray.append({ name: '' } as RecipeFormInput['recipeIngredients'][number]);
  };
  /** Removes a row, then re-validates (RHF's `remove` does not validate in `onTouched` mode). */
  const handleRemoveIngredient = (index: number) => {
    fieldArray.remove(index);
    void form.trigger('recipeIngredients');
  };
  /** Routes a formatted-string edit through `useRecipeIngredients`, applying the emitted patch. */
  const handleEditIngredient = (index: number, formatted: string) => {
    editIngredients(index, formatted, applyEditPatch);
  };

  // Share the dirty-free `applySystemPatch` with feature hooks (scraper
  // validation, OCR) that mutate the array outside the user-typing path. The
  // local user-typing path keeps `applyEditPatch` (fieldArray ops, marks dirty)
  // so a manual row edit still surfaces its inline error.
  useIngredientArrayActionsRegister(applySystemPatch);

  // Subscribe to the row names only. `useWatch` re-renders this hook on any
  // row mutation, but the `useMemo` below filters the re-derivation to actual
  // name changes via a stable join-string cache key. Quantity / unit / note
  // edits change the watched array reference but produce an identical
  // `currentNamesKey`, so the dropdown list is not recomputed.
  const watchedIngredients = useWatch({
    control: form.control,
    name: 'recipeIngredients',
  }) as IngredientRowValue[] | undefined;
  const currentNamesKey = (watchedIngredients ?? [])
    .map(ing => ing.name ?? '')
    .join(NAME_JOIN_DELIMITER);

  const availableIngredients = useMemo(() => {
    const usedNames = new Set(
      currentNamesKey
        .split(NAME_JOIN_DELIMITER)
        .map(name => name.trim())
        .filter(name => name.length > 0)
    );
    return dbIngredients
      .map(ingredient => ingredient.name)
      .filter(name => !usedNames.has(name))
      .sort();
  }, [dbIngredients, currentNamesKey]);

  return {
    fieldArray,
    availableIngredients,
    handleAddIngredient,
    handleRemoveIngredient,
    handleEditIngredient,
    rowCount,
  };
}
