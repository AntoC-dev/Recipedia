/**
 * ImageRepair - Utility for repairing recipes with missing images
 *
 * Recipes imported via bulk import may have been stored with an empty
 * `image_Source` due to provider scraping bugs, or with a local file that is
 * a copy of the provider's known placeholder image. This module re-fetches
 * and persists the correct image for affected recipes using their stored
 * `sourceUrl`, without any user interaction.
 *
 * @module utils/ImageRepair
 */

import * as FileSystem from 'expo-file-system';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { findProviderById, findProviderForUrl } from '@providers/ProviderRegistry';
import { downloadImageToCache } from '@utils/FileGestion';
import { isValidUrl } from '@utils/UrlHelpers';
import { appLogger } from '@utils/logger';

/**
 * Downloads a URL to the cache directory and returns its MD5 hash
 *
 * @param url - URL of the image to download
 * @returns The MD5 hash of the downloaded file, or null if the download failed
 */
async function downloadPlaceholderMd5(url: string): Promise<string | null> {
  try {
    const localUri = await downloadImageToCache(url);
    if (!localUri) {
      return null;
    }
    const info = await FileSystem.getInfoAsync(localUri, { md5: true });
    if (!info.exists || !info.md5) {
      return null;
    }
    return info.md5;
  } catch (e) {
    appLogger.warn('ImageRepair: failed to download placeholder for MD5', { url, error: e });
    return null;
  }
}

/**
 * Returns the MD5 hash of a local file
 *
 * @param localUri - Local file URI to hash
 * @returns The MD5 hash of the file, or null if the file does not exist or cannot be read
 */
async function getLocalFileMd5(localUri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(localUri, { md5: true });
    if (!info.exists || !info.md5) {
      return null;
    }
    return info.md5;
  } catch {
    return null;
  }
}

/**
 * Collects recipes whose local image file is a copy of the provider's placeholder
 *
 * Groups recipes by provider ID, downloads each provider's placeholder once,
 * then compares MD5 hashes to find affected recipes.
 *
 * @param recipes - Recipes with a non-empty image_Source and a valid sourceUrl
 * @returns Recipes whose local file matches the provider placeholder hash
 */
async function collectPlaceholderCandidates(
  recipes: recipeTableElement[]
): Promise<recipeTableElement[]> {
  const candidates: recipeTableElement[] = [];

  const byProvider = new Map<string, recipeTableElement[]>();
  for (const recipe of recipes) {
    const providerId = recipe.sourceProvider;
    if (!providerId) {
      continue;
    }
    const group = byProvider.get(providerId) ?? [];
    group.push(recipe);
    byProvider.set(providerId, group);
  }

  for (const [providerId, group] of byProvider) {
    const provider = findProviderById(providerId);
    if (!provider) continue;

    const placeholderUrl = provider.getPlaceholderImageUrl();
    if (!placeholderUrl) continue;

    const placeholderMd5 = await downloadPlaceholderMd5(placeholderUrl);
    if (!placeholderMd5) {
      appLogger.warn('ImageRepair: could not get placeholder MD5, skipping provider', {
        providerId,
      });
      continue;
    }

    for (const recipe of group) {
      const recipeMd5 = await getLocalFileMd5(recipe.image_Source);
      if (recipeMd5 === placeholderMd5) {
        candidates.push(recipe);
      }
    }
  }

  return candidates;
}

/**
 * Repairs recipes that have a missing image but a valid source URL
 *
 * Filters the provided recipe list to candidates with an empty `image_Source`
 * and a valid `sourceUrl`, or with a non-empty `image_Source` whose content
 * matches the provider's known placeholder image (detected via MD5 comparison).
 * Then sequentially re-fetches and persists the image for each candidate.
 * Errors for individual recipes are caught and logged so the loop continues
 * for remaining candidates.
 *
 * @param recipes - Full list of recipes from the database
 * @param editRecipe - Callback to persist a recipe update to the database
 * @returns Promise that resolves when all candidates have been processed
 */
export async function repairMissingRecipeImages(
  recipes: recipeTableElement[],
  editRecipe: (recipe: recipeTableElement) => Promise<recipeTableElement>
): Promise<void> {
  const validRecipes = recipes.filter(r => r.sourceUrl && isValidUrl(r.sourceUrl));

  const emptyCandidates = validRecipes.filter(r => r.image_Source === '');

  const recipesWithLocalImage = validRecipes.filter(r => r.image_Source !== '');
  const placeholderCandidates = await collectPlaceholderCandidates(recipesWithLocalImage);

  const candidates = [...emptyCandidates, ...placeholderCandidates];

  if (candidates.length === 0) {
    appLogger.debug('ImageRepair: no candidates found');
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
