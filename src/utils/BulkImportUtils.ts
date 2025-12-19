/**
 * BulkImportUtils - Utility functions for bulk import UI
 *
 * Provides helper functions for the bulk import discovery screen including:
 * - List data building for FlashList with section headers
 * - Visibility-based image loading calculations
 *
 * @module utils/BulkImportUtils
 */

import { DiscoveredRecipe, DiscoveryListItem } from '@customTypes/BulkImportTypes';

/**
 * Represents the visible range boundaries in the recipe list
 */
export interface VisibleBounds {
  /** Index of the first visible recipe (-1 if none visible) */
  minIndex: number;
  /** Index of the last visible recipe (-1 if none visible) */
  maxIndex: number;
}

/**
 * Represents the buffer zone boundaries around visible items
 */
export interface BufferBounds {
  /** Start index of the buffer zone */
  start: number;
  /** End index of the buffer zone */
  end: number;
}

/**
 * Computes the min and max indices of visible recipes in the list.
 *
 * @param recipes - Array of all recipes
 * @param visibleUrls - Set of currently visible recipe URLs
 * @returns The min and max indices of visible recipes
 */
export function computeVisibleBounds(
  recipes: DiscoveredRecipe[],
  visibleUrls: Set<string>
): VisibleBounds {
  let minIndex = Infinity;
  let maxIndex = -1;

  recipes.forEach((recipe, index) => {
    if (visibleUrls.has(recipe.url)) {
      minIndex = Math.min(minIndex, index);
      maxIndex = Math.max(maxIndex, index);
    }
  });

  return {
    minIndex: minIndex === Infinity ? -1 : minIndex,
    maxIndex,
  };
}

/**
 * Computes the buffer zone boundaries around visible items.
 *
 * @param visibleBounds - The min/max indices of visible items
 * @param bufferSize - Number of items to include beyond visible range
 * @param totalRecipes - Total number of recipes in the list
 * @returns The start and end indices of the buffer zone
 */
export function computeBufferBounds(
  visibleBounds: VisibleBounds,
  bufferSize: number,
  totalRecipes: number
): BufferBounds {
  if (visibleBounds.minIndex === -1) {
    return { start: 0, end: -1 };
  }

  return {
    start: Math.max(0, visibleBounds.minIndex - bufferSize),
    end: Math.min(totalRecipes - 1, visibleBounds.maxIndex + bufferSize),
  };
}

/**
 * Filters recipes that need image fetching within the buffer zone.
 * Excludes recipes that already have images, are visible, or are already fetched/pending.
 *
 * @param recipes - Array of all recipes
 * @param bufferBounds - The buffer zone boundaries
 * @param visibleUrls - Set of currently visible recipe URLs
 * @param fetchedUrls - Set of already fetched recipe URLs
 * @param pendingUrls - Set of currently pending recipe URLs
 * @returns Array of recipes in buffer zone that need image fetching
 */
export function getBufferRecipesNeedingFetch(
  recipes: DiscoveredRecipe[],
  bufferBounds: BufferBounds,
  visibleUrls: Set<string>,
  fetchedUrls: Set<string>,
  pendingUrls: Set<string>
): DiscoveredRecipe[] {
  const bufferRecipes: DiscoveredRecipe[] = [];

  for (let i = bufferBounds.start; i <= bufferBounds.end; i++) {
    const recipe = recipes[i];
    if (
      !recipe.imageUrl &&
      !visibleUrls.has(recipe.url) &&
      !fetchedUrls.has(recipe.url) &&
      !pendingUrls.has(recipe.url)
    ) {
      bufferRecipes.push(recipe);
    }
  }

  return bufferRecipes;
}

/**
 * Builds the list of URLs to fetch, prioritizing visible items over buffer items.
 *
 * @param visibleRecipes - Visible recipes needing images
 * @param bufferRecipes - Buffer zone recipes needing images
 * @param fetchedUrls - Set of already fetched recipe URLs
 * @param pendingUrls - Set of currently pending recipe URLs
 * @returns Array of URLs to fetch in priority order
 */
export function buildFetchQueue(
  visibleRecipes: DiscoveredRecipe[],
  bufferRecipes: DiscoveredRecipe[],
  fetchedUrls: Set<string>,
  pendingUrls: Set<string>
): string[] {
  const urlsToFetch: string[] = [];

  for (const recipe of visibleRecipes) {
    if (!fetchedUrls.has(recipe.url) && !pendingUrls.has(recipe.url)) {
      urlsToFetch.push(recipe.url);
    }
  }

  for (const recipe of bufferRecipes) {
    urlsToFetch.push(recipe.url);
  }

  return urlsToFetch;
}

/**
 * Cancels pending fetches for recipes that are outside the buffer zone.
 *
 * @param recipes - Array of all recipes
 * @param visibleUrls - Set of currently visible recipe URLs
 * @param bufferBounds - The buffer zone boundaries
 * @param abortControllers - Map of URL to AbortController for pending fetches
 * @param pendingUrls - Set of currently pending recipe URLs
 */
export function cancelOutOfBoundsFetches(
  recipes: DiscoveredRecipe[],
  visibleUrls: Set<string>,
  bufferBounds: BufferBounds,
  abortControllers: Map<string, AbortController>,
  pendingUrls: Set<string>
): void {
  for (const [url, controller] of abortControllers) {
    if (!visibleUrls.has(url)) {
      const recipeIndex = recipes.findIndex(r => r.url === url);
      if (recipeIndex < bufferBounds.start || recipeIndex > bufferBounds.end) {
        controller.abort();
        abortControllers.delete(url);
        pendingUrls.delete(url);
      }
    }
  }
}

/**
 * Builds a flat list of items for FlashList with section headers and recipes
 *
 * @param freshRecipes - Array of newly discovered recipes
 * @param seenRecipes - Array of previously seen recipes
 * @returns Combined array of header and recipe items for FlashList
 */
export function buildDiscoveryListData(
  freshRecipes: DiscoveredRecipe[],
  seenRecipes: DiscoveredRecipe[]
): DiscoveryListItem[] {
  const items: DiscoveryListItem[] = [];

  if (freshRecipes.length > 0) {
    items.push({
      type: 'header',
      key: 'fresh-header',
      titleKey: 'bulkImport.selection.newRecipes',
      count: freshRecipes.length,
    });
    let i = 0;
    for (const recipe of freshRecipes) {
      items.push({ type: 'recipe', key: `fresh-${i}`, recipe });
      i++;
    }
  }

  if (seenRecipes.length > 0) {
    items.push({
      type: 'header',
      key: 'seen-header',
      titleKey: 'bulkImport.selection.previouslySeen',
      count: seenRecipes.length,
    });
    let i = 0;
    for (const recipe of seenRecipes) {
      items.push({ type: 'recipe', key: `seen-${i}`, recipe });
      i++;
    }
  }

  return items;
}
