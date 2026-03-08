/**
 * ImageRepair - Utility for repairing recipes with missing images
 *
 * Recipes imported via bulk import may have been stored with an empty
 * `image_Source` due to provider scraping bugs. This module re-fetches
 * and persists the correct image for affected recipes using their stored
 * `sourceUrl`, without any user interaction.
 *
 * @module utils/ImageRepair
 */

import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { findProviderForUrl } from '@providers/ProviderRegistry';
import { downloadImageToCache } from '@utils/FileGestion';
import { isPlaceholderImageUrl, isValidUrl } from '@utils/UrlHelpers';
import { appLogger } from '@utils/logger';

/**
 * Repairs recipes that have a missing image but a valid source URL
 *
 * Filters the provided recipe list to candidates with an empty `image_Source`
 * and a valid, non-placeholder `sourceUrl`, then sequentially re-fetches and
 * persists the image for each. Errors for individual recipes are caught and
 * logged so the loop continues for remaining candidates.
 *
 * @param recipes - Full list of recipes from the database
 * @param editRecipe - Callback to persist a recipe update to the database
 * @param signal - Optional abort signal to cancel mid-loop
 * @returns Promise that resolves when all candidates have been processed
 */
export async function repairMissingRecipeImages(
  recipes: recipeTableElement[],
  editRecipe: (recipe: recipeTableElement) => Promise<boolean>,
  signal?: AbortSignal
): Promise<void> {
  const candidates = recipes.filter(
    r =>
      r.image_Source === '' &&
      r.sourceUrl &&
      isValidUrl(r.sourceUrl) &&
      !isPlaceholderImageUrl(r.sourceUrl)
  );

  if (candidates.length === 0) {
    return;
  }

  appLogger.info('ImageRepair: found recipes with missing images', { count: candidates.length });

  for (const recipe of candidates) {
    if (signal?.aborted) {
      break;
    }

    try {
      const provider = findProviderForUrl(recipe.sourceUrl!);
      if (!provider) {
        continue;
      }

      const abortSignal = signal ?? new AbortController().signal;
      const imageUrl = await provider.fetchImageUrlForRecipe(recipe.sourceUrl!, abortSignal);
      if (!imageUrl) {
        continue;
      }

      const localUri = await downloadImageToCache(imageUrl);
      if (!localUri) {
        continue;
      }

      await editRecipe({ ...recipe, image_Source: localUri });
      appLogger.info('ImageRepair: repaired image for recipe', { title: recipe.title });
    } catch (e) {
      appLogger.warn('ImageRepair: failed to repair image for recipe', {
        title: recipe.title,
        error: e,
      });
    }
  }
}
