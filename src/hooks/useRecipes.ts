/**
 * useRecipes - Focused hook for recipe data and CRUD operations
 *
 * Subscribes directly to the `recipes` slice of the RecipeDatabase singleton via
 * `useSyncExternalStore`. Re-renders only when recipe data changes — unaffected
 * by ingredient, tag or menu mutations.
 *
 * Image cleanup on edit (delete old file when image changes) and progressive
 * scaling logic live here as UI-layer concerns rather than in the database
 * singleton. Image deletion on recipe removal is handled by RecipeDatabase.
 *
 * @module useRecipes
 */

import { useSyncExternalStore, useState } from 'react';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { deleteFile, isTemporaryImageUri } from '@utils/FileGestion';
import { databaseLogger } from '@utils/logger';

/**
 * Provides reactive recipe data and all recipe operations.
 *
 * The `recipes` array is a stable reference updated via `useSyncExternalStore`;
 * React Compiler memoises derived values automatically, so no `useMemo` wrappers
 * are needed in consumers.
 *
 * `scalingProgress` is local state — only the component calling
 * `scaleAllRecipesForNewDefaultPersons` observes it; other consumers of this
 * hook see `undefined`.
 *
 * @returns Object containing reactive `recipes` array, `scalingProgress`,
 *   and all recipe mutation functions
 */
export function useRecipes() {
  const db = RecipeDatabase.getInstance();
  const recipes = useSyncExternalStore(
    cb => db.subscribe('recipes', cb),
    () => db.get_recipes()
  );
  const [scalingProgress, setScalingProgress] = useState<number | undefined>(undefined);

  const addRecipe = async (recipe: recipeTableElement): Promise<void> => {
    databaseLogger.debug('useRecipes: addRecipe', { recipeTitle: recipe.title });
    await db.addRecipe(recipe);
  };

  const editRecipe = async (recipe: recipeTableElement): Promise<recipeTableElement> => {
    databaseLogger.debug('useRecipes: editRecipe', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    });
    const oldImageUri = recipes.find(r => r.id === recipe.id)?.image_Source ?? '';
    const result = await db.editRecipe(recipe);
    if (oldImageUri && oldImageUri !== recipe.image_Source && !isTemporaryImageUri(oldImageUri)) {
      databaseLogger.debug('useRecipes: deleting old recipe image', { oldImageUri });
      deleteFile(oldImageUri);
    }
    return result;
  };

  const deleteRecipe = async (recipe: recipeTableElement): Promise<boolean> => {
    databaseLogger.debug('useRecipes: deleteRecipe', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    });
    return db.deleteRecipe(recipe);
  };

  const findSimilarRecipes = (recipe: recipeTableElement): recipeTableElement[] => {
    return db.findSimilarRecipes(recipe);
  };

  const addMultipleRecipes = async (recipesToAdd: recipeTableElement[]): Promise<void> => {
    databaseLogger.debug('useRecipes: addMultipleRecipes', { count: recipesToAdd.length });
    await db.addMultipleRecipes(recipesToAdd);
  };

  const scaleAllRecipesForNewDefaultPersons = async (newDefaultPersons: number): Promise<void> => {
    const recipesToScale = recipes.filter(
      recipe =>
        recipe.persons &&
        recipe.persons > 0 &&
        recipe.id !== undefined &&
        recipe.persons !== newDefaultPersons
    );

    if (recipesToScale.length === 0) {
      databaseLogger.info('No recipes need scaling', { newDefaultPersons });
      return;
    }

    setScalingProgress(0);

    databaseLogger.info('Starting recipe scaling', {
      newDefaultPersons,
      recipesToScale: recipesToScale.length,
    });

    for (let i = 0; i < recipesToScale.length; i++) {
      const scaledRecipe = RecipeDatabase.scaleRecipeToPersons(
        recipesToScale[i],
        newDefaultPersons
      );
      await db.scaleAndUpdateRecipe(scaledRecipe);
      const progress = Math.floor(((i + 1) / recipesToScale.length) * 100);
      setScalingProgress(progress);
      if (i % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    databaseLogger.info('Recipe scaling completed', { updatedCount: recipesToScale.length });
    setScalingProgress(undefined);
  };

  return {
    recipes,
    scalingProgress,
    addRecipe,
    editRecipe,
    deleteRecipe,
    findSimilarRecipes,
    addMultipleRecipes,
    scaleAllRecipesForNewDefaultPersons,
  };
}
