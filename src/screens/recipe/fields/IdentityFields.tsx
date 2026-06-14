/**
 * IdentityFields - image, title and description fields for the recipe form.
 *
 * Each component subscribes to its own RHF field via `useController` so a
 * keystroke in one field re-renders only that field's organism. Inline errors
 * are resolved via `useInlineErrorFor` which reads RHF's own `touchedFields` and
 * `isSubmitted` state.
 *
 * @module screens/recipe/fields/IdentityFields
 */

import React from 'react';
import { useController, UseFormReturn } from 'react-hook-form';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { OcrModalTarget } from '@utils/OCR';
import { RecipeImage } from '@components/organisms/RecipeImage';
import { RecipeText } from '@components/organisms/RecipeText';
import {
  buildRecipeDescriptionProps,
  buildRecipeImageProps,
  buildRecipeTitleProps,
} from '@utils/RecipeFormHelpers';
import { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useInlineErrorFor } from '@screens/recipe/helpers/inlineErrorGate';

type Form = UseFormReturn<RecipeFormInput>;
type T = (key: string) => string;

export interface ImageFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
}

export function RecipeImageField({ form, stackMode, openModalForField }: ImageFieldProps) {
  const { field } = useController({ control: form.control, name: 'recipeImage' });
  return (
    <RecipeImage
      {...buildRecipeImageProps({ stackMode, recipeImage: field.value ?? '', openModalForField })}
    />
  );
}

export interface TitleFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  t: T;
}

export function RecipeTitleField({ form, stackMode, openModalForField, t }: TitleFieldProps) {
  const { field } = useController({ control: form.control, name: 'recipeTitle' });
  const { error } = useInlineErrorFor('recipeTitle', t);
  return (
    <RecipeText
      {...buildRecipeTitleProps({
        stackMode,
        recipeTitle: field.value ?? '',
        setRecipeTitle: field.onChange,
        openModalForField,
        t,
      })}
      onBlur={field.onBlur}
      error={error}
    />
  );
}

export interface DescriptionFieldProps {
  form: Form;
  stackMode: recipeStateType;
  openModalForField: (field: OcrModalTarget) => void;
  t: T;
}

export function RecipeDescriptionField({
  form,
  stackMode,
  openModalForField,
  t,
}: DescriptionFieldProps) {
  const { field } = useController({
    control: form.control,
    name: 'recipeDescription',
  });
  // recipeDescription has no schema constraint, so it never errors — no inline
  // error gate is wired here.
  return (
    <RecipeText
      {...buildRecipeDescriptionProps({
        stackMode,
        recipeDescription: field.value ?? '',
        setRecipeDescription: field.onChange,
        openModalForField,
        t,
      })}
      onBlur={field.onBlur}
    />
  );
}
