/**
 * Builds a `recipeTableElement` snapshot from the current form values and a
 * baseline recipe (preserves the persisted `id`, `season`, and
 * `sourceProvider` that aren't form-managed).
 *
 * Extracted from `RecipeFormContext.useRecipeFormActions` so the routes can
 * inline their save handlers without going through the legacy context.
 *
 * @module screens/recipe/helpers/createRecipeSnapshot
 */

import type { UseFormReturn } from 'react-hook-form';
import { ingredientTableElement, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

/**
 * Returns a fully-populated `recipeTableElement` from the current form state.
 *
 * The supplied `baseline` carries non-form fields the snapshot must round-trip:
 * - `id`, `season`, `sourceProvider` from the persisted recipe, when available.
 * - `sourceUrl` is taken from the baseline first; the caller can override via
 *   `fallbackSourceUrl` (used by scrape-add to inject the originating page URL
 *   before a baseline exists).
 *
 * @param form - The `react-hook-form` instance owning the recipe form
 * @param baseline - The most recent persisted recipe, or `null` for fresh adds
 * @param fallbackSourceUrl - Optional source URL used when no baseline exists
 *   (e.g. `addFromScrape` mode)
 * @returns A snapshot of the current form payload as a `recipeTableElement`
 */
export function createRecipeSnapshot(
  form: UseFormReturn<RecipeFormInput>,
  baseline: recipeTableElement | null,
  fallbackSourceUrl?: string
): recipeTableElement {
  const values = form.getValues();
  const sourceUrl = baseline?.sourceUrl ?? fallbackSourceUrl;
  return {
    id: baseline?.id,
    image_Source: values.recipeImage ?? '',
    title: values.recipeTitle ?? '',
    description: values.recipeDescription ?? '',
    tags: (values.recipeTags ?? []) as recipeTableElement['tags'],
    persons: values.recipePersons,
    ingredients: (values.recipeIngredients ?? []) as ingredientTableElement[],
    season: baseline?.season ?? [],
    preparation: values.recipePreparation ?? [],
    time: values.recipeTime,
    nutrition: values.recipeNutrition,
    sourceUrl,
    sourceProvider: baseline?.sourceProvider,
  };
}
