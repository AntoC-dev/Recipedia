/**
 * ItemDialogTypes - Types and utilities for the ItemDialog form
 *
 * Centralises the RHF form value type and the helper that builds default
 * values from the dialog's item prop, so the logic is reusable and testable
 * independently of the component.
 */

import {
  FormIngredientElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

/**
 * Minimal structural type covering both item configurations accepted by the dialog.
 * Avoids importing the full ItemIngredientType / ItemTagType (which include callbacks)
 * to prevent a circular dependency with the component file.
 */
type ItemProp =
  { type: 'Ingredient'; value: FormIngredientElement } | { type: 'Tag'; value: tagTableElement };

/**
 * Unified RHF form value shape covering both Tag and Ingredient dialogs.
 * Ingredient-only fields are `undefined` when the dialog is used for a tag.
 */
export type ItemDialogFormValues = {
  name: string;
  /** Required for ingredients; undefined for tags. */
  type: ingredientType | undefined;
  /** Empty string when not applicable (tags) or not yet filled in. */
  unit: string;
  /** Empty array when not applicable (tags) or not yet filled in. */
  season: string[];
};

/**
 * Builds the initial RHF form values from the dialog's item prop.
 * Ingredient fields default to empty / undefined when not yet filled in.
 *
 * @param item - The item configuration passed to ItemDialog
 * @returns Form values ready to be passed to `useForm({ defaultValues })` or `reset()`
 */
export function buildItemFormValues(item: ItemProp): ItemDialogFormValues {
  const ing = item.type === 'Ingredient' ? (item.value as FormIngredientElement) : null;
  return {
    name: item.value.name ?? '',
    type: ing?.type,
    unit: ing?.unit ?? '',
    season: ing?.season ?? [],
  };
}
