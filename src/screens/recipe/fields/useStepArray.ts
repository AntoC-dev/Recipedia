/**
 * useStepArray - field-array operations for the editable preparation field.
 *
 * Owns the RHF `useFieldArray` mount on `recipePreparation`. Exposes the
 * `fields` rendered list, the `append` handler used by the add-step button,
 * and the current `length`.
 *
 * No parent-level `useWatch('recipePreparation')` is needed here: per-step
 * `useController` subscriptions in `PreparationStep` already isolate each
 * row's title and description edits to that row alone. Subscribing the array
 * root would defeat the isolation by waking the parent on every keystroke.
 *
 * @module screens/recipe/fields/useStepArray
 */

import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { RecipeFormInput } from '@schemas/recipeFormSchema';

type Form = UseFormReturn<RecipeFormInput>;

export interface UseStepArrayResult {
  fields: ReturnType<typeof useFieldArray<RecipeFormInput, 'recipePreparation'>>['fields'];
  addStep: () => void;
  length: number;
}

export function useStepArray(form: Form): UseStepArrayResult {
  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'recipePreparation',
  });
  /** Appends an empty preparation step (blank title + description). */
  const addStep = () => append({ title: '', description: '' });
  return {
    fields,
    addStep,
    length: fields.length,
  };
}
