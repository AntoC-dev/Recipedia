/**
 * Builds the default RHF input for the empty-form add modes (`addManually` /
 * `addFromPic`). The user's preferred persons count is read synchronously from
 * the warmed-up settings cache so the value lands in `useForm`'s initial state
 * — avoiding a second render that an async `setValue` would force.
 *
 * @module screens/recipe/defaults/buildEmptyDefaults
 */

import { defaultValueNumber } from '@utils/Constants';
import { getDefaultPersonsSync } from '@utils/settings';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

/**
 * Returns the default values for an empty recipe form (no preexisting data).
 *
 * @returns The full default-values object for `react-hook-form`'s `useForm`
 */
export function buildEmptyDefaults(): RecipeFormInput {
  return {
    recipeImage: '',
    recipeTitle: '',
    recipeDescription: '',
    recipeTags: [],
    recipePersons: getDefaultPersonsSync(),
    recipeIngredients: [],
    recipePreparation: [],
    recipeTime: defaultValueNumber,
    recipeNutrition: undefined,
  };
}
