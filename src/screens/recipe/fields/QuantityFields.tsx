/**
 * QuantityFields - numeric persons and time fields for the recipe form.
 *
 * Each component subscribes to its own RHF field via `useController`. Inline
 * errors are resolved via `useInlineErrorFor` which reads RHF's own
 * `touchedFields` and `isSubmitted` state.
 *
 * @module screens/recipe/fields/QuantityFields
 */

import React from 'react';
import { useController, UseFormReturn } from 'react-hook-form';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { OcrModalTarget } from '@utils/OCR';
import { RecipeNumber } from '@components/organisms/RecipeNumber';
import { buildRecipePersonsProps, buildRecipeTimeProps } from '@utils/RecipeFormHelpers';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useInlineErrorFor } from '@screens/recipe/helpers/inlineErrorGate';

type Form = UseFormReturn<RecipeFormInput>;
type T = (key: string) => string;

export interface PersonsFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  t: T;
}

export function RecipePersonsField({ form, stackMode, openModalForField, t }: PersonsFieldProps) {
  const { field } = useController({ control: form.control, name: 'recipePersons' });
  const { error } = useInlineErrorFor('recipePersons', t);
  return (
    <RecipeNumber
      {...buildRecipePersonsProps({
        stackMode,
        recipePersons: field.value,
        setRecipePersons: field.onChange,
        openModalForField,
        t,
      })}
      onBlur={field.onBlur}
      error={error}
    />
  );
}

export interface TimeFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  t: T;
}

export function RecipeTimeField({ form, stackMode, openModalForField, t }: TimeFieldProps) {
  const { field } = useController({ control: form.control, name: 'recipeTime' });
  const { error } = useInlineErrorFor('recipeTime', t);
  return (
    <RecipeNumber
      {...buildRecipeTimeProps({
        stackMode,
        recipeTime: field.value,
        setRecipeTime: field.onChange,
        openModalForField,
        t,
      })}
      onBlur={field.onBlur}
      error={error}
    />
  );
}
