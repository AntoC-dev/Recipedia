/**
 * BulkImportUtils - Utility functions for bulk import UI
 *
 * @module utils/BulkImportUtils
 */

import { DiscoveredRecipe, DiscoveryListItem } from '@customTypes/BulkImportTypes';

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
