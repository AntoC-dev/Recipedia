/**
 * Builds the default RHF input for the routes that open with an existing
 * recipe (`RecipeEdit`). Reads every form field straight from the recipe
 * payload — no fallback contract to apply because each recipe column is
 * already present at the type level.
 *
 * @module screens/recipe/defaults/buildDefaultsFromRecipe
 */

import { ingredientTableElement, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';

/**
 * Returns the default values for an edit-mode recipe form, sourced from the
 * supplied recipe payload.
 *
 * @param recipe - Persisted recipe to seed the form from
 * @returns The full default-values object for `react-hook-form`'s `useForm`
 */
export function buildDefaultsFromRecipe(recipe: recipeTableElement): RecipeFormInput {
  return {
    recipeImage: recipe.image_Source,
    recipeTitle: recipe.title,
    recipeDescription: recipe.description,
    recipeTags: recipe.tags,
    recipePersons: recipe.persons,
    recipeIngredients: recipe.ingredients as RecipeFormInput['recipeIngredients'],
    recipePreparation: recipe.preparation,
    recipeTime: recipe.time,
    recipeNutrition: recipe.nutrition,
  } satisfies RecipeFormInput & {
    recipeIngredients: RecipeFormInput['recipeIngredients'] | ingredientTableElement[];
  };
}
