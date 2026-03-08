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
 * Filters the provided recipe list to candidates with an empty or placeholder
 * `image_Source` and a valid `sourceUrl`, then sequentially re-fetches and
 * persists the image for each. Errors for individual recipes are caught and
 * logged so the loop continues for remaining candidates.
 *
 * @param recipes - Full list of recipes from the database
 * @param editRecipe - Callback to persist a recipe update to the database
 * @returns Promise that resolves when all candidates have been processed
 */
export async function repairMissingRecipeImages(
  recipes: recipeTableElement[],
  editRecipe: (recipe: recipeTableElement) => Promise<boolean>
): Promise<void> {
  const candidates = recipes.filter(
    r =>
      (r.image_Source === '' || isPlaceholderImageUrl(r.image_Source)) &&
      r.sourceUrl &&
      isValidUrl(r.sourceUrl)
  );

  if (candidates.length === 0) {
    return;
  }

  appLogger.info('ImageRepair: found recipes with missing images', { count: candidates.length });

  for (const recipe of candidates) {
    try {
      const provider = findProviderForUrl(recipe.sourceUrl!);
      if (!provider) {
        appLogger.debug('ImageRepair: no provider found for recipe', {
          title: recipe.title,
          sourceUrl: recipe.sourceUrl,
        });
        continue;
      }

      const imageUrl = await provider.fetchImageUrlForRecipe(
        recipe.sourceUrl!,
        new AbortController().signal
      );
      if (!imageUrl) {
        appLogger.debug('ImageRepair: provider returned no image URL', {
          title: recipe.title,
          sourceUrl: recipe.sourceUrl,
        });
        continue;
      }

      const localUri = await downloadImageToCache(imageUrl);
      if (!localUri) {
        appLogger.debug('ImageRepair: image download failed', {
          title: recipe.title,
          imageUrl,
        });
        continue;
      }

      await editRecipe({ ...recipe, image_Source: localUri });
      appLogger.info('ImageRepair: repaired image for recipe', { title: recipe.title, localUri });
    } catch (e) {
      appLogger.warn('ImageRepair: failed to repair image for recipe', {
        title: recipe.title,
        sourceUrl: recipe.sourceUrl,
        error: e,
      });
    }
  }
}
