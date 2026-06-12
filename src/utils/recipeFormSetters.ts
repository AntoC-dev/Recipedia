/**
 * Helper bridging react-hook-form's imperative API to a `useState`-style
 * setter. Extracted from `RecipeFormContext` so recipe hooks can compose
 * setState-style mutations on top of RHF without coupling to the legacy
 * context module.
 *
 * @module utils/recipeFormSetters
 */

import { Dispatch, SetStateAction } from 'react';
import { FieldPath, FieldValues, PathValue, SetValueConfig, UseFormReturn } from 'react-hook-form';

/**
 * Returns a setter that accepts either a direct value or a functional updater
 * `(prev) => next`. The current field value is read lazily via
 * `form.getValues` so functional updaters always see the latest state.
 *
 * The optional `options` argument is forwarded to every `form.setValue` call
 * the setter makes — pass `{ shouldValidate: true }` when subsequent
 * validation runs should reflect the new value, or `{ shouldDirty: false }`
 * when the write should not mark the form dirty.
 */
export function makeFormSetter<TForm extends FieldValues, K extends FieldPath<TForm>>(
  form: UseFormReturn<TForm, unknown, FieldValues>,
  name: K,
  options?: SetValueConfig
): Dispatch<SetStateAction<PathValue<TForm, K>>> {
  type T = PathValue<TForm, K>;
  return updater => {
    const next =
      typeof updater === 'function'
        ? (updater as (prev: T) => T)(form.getValues(name) as T)
        : updater;
    form.setValue(name, next, options);
  };
}
