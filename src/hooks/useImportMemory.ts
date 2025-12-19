/**
 * useImportMemory - Hook for managing bulk import history and memory
 *
 * Provides functions to track and query import status for recipes during
 * bulk import operations. Tracks both imported recipes (via sourceUrl in recipe table)
 * and seen-but-not-imported recipes (via ImportHistoryTable).
 *
 * @module hooks/useImportMemory
 */

import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { DiscoveredRecipe, ImportMemoryStatus } from '@customTypes/BulkImportTypes';

export interface UseImportMemoryReturn {
  getMemoryStatus: (url: string) => ImportMemoryStatus;
  processDiscoveredRecipes: (
    recipes: DiscoveredRecipe[],
    hideImported: boolean
  ) => DiscoveredRecipe[];
  importedCount: number;
  seenCount: number;
}

/**
 * Custom hook for managing import memory during bulk import
 *
 * Tracks which recipes have been imported or seen from a specific provider,
 * allowing the discovery screen to hide imported recipes and mark previously
 * seen recipes with a visual indicator.
 *
 * @param providerId - The provider identifier (e.g., 'hellofresh')
 * @returns Import memory state and management functions
 */
export function useImportMemory(providerId: string): UseImportMemoryReturn {
  const { getImportedSourceUrls, getSeenUrls } = useRecipeDatabase();

  const importedUrls = getImportedSourceUrls(providerId);
  const seenUrls = getSeenUrls(providerId);

  const getMemoryStatus = (url: string): ImportMemoryStatus => {
    if (importedUrls.has(url)) return 'imported';
    if (seenUrls.has(url)) return 'seen';
    return 'fresh';
  };

  const processDiscoveredRecipes = (
    recipes: DiscoveredRecipe[],
    hideImported: boolean
  ): DiscoveredRecipe[] => {
    return recipes
      .map(recipe => ({
        ...recipe,
        memoryStatus: getMemoryStatus(recipe.url),
      }))
      .filter(recipe => !hideImported || recipe.memoryStatus !== 'imported');
  };

  return {
    getMemoryStatus,
    processDiscoveredRecipes,
    importedCount: importedUrls.size,
    seenCount: seenUrls.size,
  };
}
