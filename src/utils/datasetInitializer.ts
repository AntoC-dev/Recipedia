/**
 * datasetInitializer - First-launch dataset loading for Recipedia
 *
 * Provides a single async function that copies dataset images and inserts
 * the full ingredient, tag and recipe dataset into the RecipeDatabase singleton.
 * Designed to be called once on first launch, inside
 * `InteractionManager.runAfterInteractions`, so the UI renders before the
 * heavy data load begins.
 *
 * Each `addMultiple*` call triggers `notify()` on the corresponding slice of
 * the RecipeDatabase singleton, so `useSyncExternalStore` hooks automatically
 * reflect each batch as it lands.
 *
 * @module datasetInitializer
 */

import { RecipeDatabase } from '@utils/RecipeDatabase';
import { copyDatasetImages, transformDatasetRecipeImages } from '@utils/FileGestion';
import { getDataset } from '@utils/DatasetLoader';
import i18n, { SupportedLanguage } from '@utils/i18n';
import { getDefaultPersons } from '@utils/settings';
import { databaseLogger } from '@utils/logger';
import { forEachChunk, mapInChunks } from '@utils/chunk';

/**
 * Loads the full first-launch dataset into the database.
 *
 * Copies bundled dataset images into the app's document directory, then
 * inserts all ingredients, tags and pre-scaled recipes into the RecipeDatabase
 * singleton. Each `addMultiple*` call notifies `useSyncExternalStore` subscribers
 * so the UI updates incrementally as data arrives.
 *
 * Image copy failures are swallowed with a warning so the rest of the dataset
 * still loads. All other errors propagate to the caller.
 *
 * @returns Promise that resolves when all data has been inserted
 */
export async function loadFirstLaunchDataset(): Promise<void> {
  const db = RecipeDatabase.getInstance();

  try {
    await copyDatasetImages();
  } catch (imageError) {
    databaseLogger.warn('Some or all dataset images failed to copy, continuing anyway', {
      error: imageError,
    });
  }

  const currentLanguage = i18n.language as SupportedLanguage;
  const dataset = getDataset(currentLanguage);
  const defaultPersons = await getDefaultPersons();

  databaseLogger.info('Loading dataset in background', {
    ingredientsCount: dataset.ingredients.length,
    tagsCount: dataset.tags.length,
    recipesCount: dataset.recipes.length,
  });

  await db.addMultipleIngredients(dataset.ingredients);
  await db.addMultipleTags(dataset.tags);

  databaseLogger.info('Pre-scaling recipes to default persons count', {
    defaultPersons,
    totalRecipes: dataset.recipes.length,
  });

  const scaledRecipes = await mapInChunks(dataset.recipes, chunk =>
    transformDatasetRecipeImages(chunk).map(recipe =>
      RecipeDatabase.scaleRecipeToPersons(recipe, defaultPersons)
    )
  );

  databaseLogger.info('Recipes pre-scaled successfully');

  await forEachChunk(scaledRecipes, chunk => db.addMultipleRecipes(chunk));

  databaseLogger.info('Dataset loaded successfully in background', {
    ingredientsCount: dataset.ingredients.length,
    tagsCount: dataset.tags.length,
    recipesCount: scaledRecipes.length,
  });
}
