/**
 * TagsField - tags field for the recipe form.
 *
 * Subscribes once to `recipeTags` via `useController`. Tag add/remove flows
 * through the parent-provided `addTag` / `removeTag` callbacks so the
 * fuzzy-match / dedup logic stays in `useRecipeTags`.
 *
 * @module screens/recipe/fields/TagsField
 */

import React from 'react';
import { useController, UseFormReturn } from 'react-hook-form';

import { recipeStateType } from '@customTypes/ScreenTypes';
import { OcrModalTarget } from '@utils/OCR';
import { RecipeTags } from '@components/organisms/RecipeTags';
import { buildRecipeTagsProps } from '@utils/RecipeFormHelpers';
import { RecipeFormInput } from '@schemas/recipeFormSchema';

type Form = UseFormReturn<RecipeFormInput>;

export interface TagsFieldProps {
  form: Form;
  stackMode: recipeStateType;
  randomTags: string[];
  addTag: (newTag: string) => void;
  removeTag: (tagName: string) => void;
  openModalForField: (field: OcrModalTarget) => void;
  hideDropdown?: boolean;
}

export function RecipeTagsField({
  form,
  stackMode,
  randomTags,
  addTag,
  removeTag,
  openModalForField,
  hideDropdown,
}: TagsFieldProps) {
  const { field } = useController({ control: form.control, name: 'recipeTags' });
  return (
    <RecipeTags
      {...buildRecipeTagsProps({
        stackMode,
        recipeTags: field.value ?? [],
        randomTags,
        addTag,
        removeTag,
        openModalForField,
        hideDropdown,
      })}
    />
  );
}
