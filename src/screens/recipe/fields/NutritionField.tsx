/**
 * NutritionField - nutrition table field for the recipe form.
 *
 * Uses `useWatch` (not `useController`) so the raw `undefined` value passes
 * through when the user removes nutrition; `useController` would fall back to
 * defaultValues and leave the table visible after save.
 *
 * The nutrition table is an aggregate object with no single blur affordance,
 * so it cannot reuse the leaf fields' `touchedFields` gate (`setValue(obj,
 * { shouldTouch: true })` does not mark the parent path). It mirrors the
 * proven ingredient-field approach instead:
 *
 * - **Register** the field via `useController` and read its reactive
 *   `fieldState.error`. Registration is what makes the error update per-edit
 *   under React Compiler — reading `useFormState().errors` for the nested
 *   path does not refresh reliably in the compiled build.
 * - **Gate** on `dirtyFields` + `isSubmitted`. `shouldDirty` reliably flips
 *   `dirtyFields.recipeNutrition` the moment an object value diverges from
 *   its default, so the gate opens on the first cell interaction.
 * - **Write** each cell with `{ shouldDirty: true, shouldValidate: true }`.
 *
 * `useWatch` (not the controller's `field.value`) feeds the table so the raw
 * `undefined` passes through when the user removes nutrition.
 *
 * @module screens/recipe/fields/NutritionField
 */

import React from 'react';
import { useController, useFormState, UseFormReturn, useWatch } from 'react-hook-form';

import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { recipeStateType } from '@customTypes/ScreenTypes';
import { OcrModalTarget } from '@utils/OCR';
import { RecipeNutrition } from '@components/organisms/RecipeNutrition';
import { buildRecipeNutritionProps } from '@utils/RecipeFormHelpers';
import { firstErrorMessage, isNestedDirty } from '@utils/recipeFormErrors';
import { RecipeFormInput } from '@schemas/recipeFormSchema';

type Form = UseFormReturn<RecipeFormInput>;
type T = (key: string) => string;

export interface NutritionFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  parentTestId: string;
  t: T;
}

export function RecipeNutritionField({
  form,
  stackMode,
  openModalForField,
  parentTestId,
  t,
}: NutritionFieldProps) {
  const value = useWatch({ control: form.control, name: 'recipeNutrition' }) as
    | nutritionTableElement
    | undefined;
  // Registered field: `fieldState.error` is the reactive, compiler-safe error
  // source (the same one the ingredient field reads).
  const { fieldState } = useController({ control: form.control, name: 'recipeNutrition' });
  const { dirtyFields, isSubmitted } = useFormState({
    control: form.control,
    name: 'recipeNutrition',
  });
  const showInlineError = isNestedDirty(dirtyFields.recipeNutrition) || isSubmitted;
  const errorMessage = showInlineError ? firstErrorMessage(fieldState.error, t) : undefined;
  /**
   * Writes the nutrition object, marking dirty + validating on every cell
   * change so the inline gate opens on the first interaction (parity with the
   * ingredient-row dirty gate).
   */
  const setRecipeNutrition = (next: nutritionTableElement | undefined) => {
    form.setValue('recipeNutrition', next, { shouldDirty: true, shouldValidate: true });
  };
  return (
    <RecipeNutrition
      {...buildRecipeNutritionProps({
        stackMode,
        recipeNutrition: value,
        setRecipeNutrition,
        openModalForField,
        parentTestId,
      })}
      error={errorMessage}
    />
  );
}
