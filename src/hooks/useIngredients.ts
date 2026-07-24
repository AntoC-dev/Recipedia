/**
 * useIngredients - Focused hook for ingredient data and CRUD operations
 *
 * Subscribes directly to the `ingredients` slice of the RecipeDatabase singleton
 * via `useSyncExternalStore`. Re-renders only when ingredient data changes —
 * unaffected by recipe, tag or menu mutations.
 *
 * @module useIngredients
 */

import { useSyncExternalStore } from 'react';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import {
  IngredientDraft,
  ingredientTableElement,
  ingredientType,
} from '@customTypes/DatabaseElementTypes';
import {
  DetailedSearchResult,
  ITEM_FUZZY,
  makeItemIndexCache,
  searchItems,
  searchItemsDetailed,
} from '@utils/FuzzyIndex';
import { cleanIngredientName } from '@utils/NutritionUtils';
import { useWarmSearchIndex } from '@hooks/useWarmSearchIndex';

const getIngredientsIndex = makeItemIndexCache<ingredientTableElement>({
  fuzzy: ITEM_FUZZY,
  getName: i => i.name,
  preprocess: cleanIngredientName,
});

/**
 * Provides reactive ingredient data and all ingredient operations.
 *
 * The `ingredients` array is updated atomically by `useSyncExternalStore`
 * whenever the database notifies the `ingredients` slice. Note that
 * `editIngredient` and `deleteIngredient` also invalidate the `recipes` slice
 * (handled internally by RecipeDatabase) so recipe consumers re-render too.
 *
 * @returns Object containing reactive `ingredients` array and all ingredient
 *   mutation functions
 */
export function useIngredients() {
  const db = RecipeDatabase.getInstance();
  const ingredients = useSyncExternalStore(
    cb => db.subscribe('ingredients', cb),
    () => db.get_ingredients()
  );

  useWarmSearchIndex(getIngredientsIndex, ingredients);

  const addIngredient = async (ingredient: IngredientDraft): Promise<ingredientTableElement> => {
    return db.addIngredient(ingredient);
  };

  const editIngredient = async (ingredient: ingredientTableElement): Promise<boolean> => {
    return db.editIngredient(ingredient);
  };

  const deleteIngredient = async (ingredient: ingredientTableElement): Promise<boolean> => {
    return db.deleteIngredient(ingredient);
  };

  const findSimilarIngredients = (ingredientName: string): ingredientTableElement[] => {
    return searchItems(getIngredientsIndex(ingredients), ingredientName);
  };

  const findSimilarIngredientsDetailed = (
    ingredientName: string
  ): DetailedSearchResult<ingredientTableElement> => {
    return searchItemsDetailed(getIngredientsIndex(ingredients), ingredientName);
  };

  const getRandomIngredients = (type: ingredientType, count: number): ingredientTableElement[] => {
    return db.getRandomIngredientsByType(type, count);
  };

  const addMultipleIngredients = async (ingredientsToAdd: IngredientDraft[]): Promise<void> => {
    await db.addMultipleIngredients(ingredientsToAdd);
  };

  return {
    ingredients,
    addIngredient,
    editIngredient,
    deleteIngredient,
    findSimilarIngredients,
    findSimilarIngredientsDetailed,
    getRandomIngredients,
    addMultipleIngredients,
  };
}
