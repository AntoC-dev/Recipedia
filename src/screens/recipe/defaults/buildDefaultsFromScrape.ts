/**
 * Builds the default RHF input for the scrape-add route. Scraped data is a
 * `Partial<recipeTableElement>` — every key may be missing, so each field
 * falls back to the same value an empty form would use.
 *
 * @module screens/recipe/defaults/buildDefaultsFromScrape
 */

import { defaultValueNumber } from '@utils/Constants';
import type { ScrapedRecipeData } from '@customTypes/RecipeNavigationTypes';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

/**
 * Returns the default values for the scrape-add recipe form. Missing keys in
 * `scrapedData` resolve to empty defaults — matching the contract enforced by
 * the legacy `buildDefaultValues` for the same mode.
 *
 * @param scrapedData - Partial recipe payload extracted from a website
 * @returns The full default-values object for `react-hook-form`'s `useForm`
 */
export function buildDefaultsFromScrape(scrapedData: ScrapedRecipeData): RecipeFormInput {
  return {
    recipeImage: scrapedData.image_Source ?? '',
    recipeTitle: scrapedData.title ?? '',
    recipeDescription: scrapedData.description ?? '',
    recipeTags: scrapedData.tags ?? [],
    recipePersons: scrapedData.persons ?? defaultValueNumber,
    recipeIngredients: (scrapedData.ingredients ?? []) as RecipeFormInput['recipeIngredients'],
    recipePreparation: scrapedData.preparation ?? [],
    recipeTime: scrapedData.time ?? defaultValueNumber,
    recipeNutrition: scrapedData.nutrition,
  };
}
