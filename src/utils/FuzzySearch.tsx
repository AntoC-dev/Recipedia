/**
 * FuzzySearch - Simple fuzzy string matching utility
 *
 * Provides reusable fuzzy search functionality using Fuse.js with semantic
 * matching levels instead of raw threshold values. Works with string arrays
 * for maximum simplicity and flexibility.
 *
 * Key Features:
 * - Semantic match levels (strict, moderate, permissive)
 * - Simple string array search
 * - Similar items ranked by relevance score
 * - Name cleaning utilities for preprocessing
 *
 * @example
 * ```typescript
 * // Search recipe titles
 * const titles = recipes.map(r => r.title);
 * const matchingTitles = fuzzySearch(titles, 'choclate', FuzzyMatchLevel.MODERATE);
 * const matchingRecipes = recipes.filter(r => matchingTitles.includes(r.title));
 *
 * // Search with name cleaning
 * const names = ingredients.map(i => cleanIngredientName(i.name));
 * const matches = fuzzySearch(names, 'tomato', FuzzyMatchLevel.PERMISSIVE);
 * ```
 */

import Fuse from 'fuse.js';
import { normalizeKey } from '@utils/NutritionUtils';

/**
 * Semantic matching levels for fuzzy search
 */
export enum FuzzyMatchLevel {
  /** Very strict matching - minimal typo tolerance (threshold: 0.2) */
  STRICT = 'strict',
  /** Balanced matching - good for general use (threshold: 0.4) */
  MODERATE = 'moderate',
  /** Loose matching - catches more variations (threshold: 0.6) */
  PERMISSIVE = 'permissive',
}

/**
 * Converts semantic match level to Fuse.js threshold value
 *
 * @param level - Semantic match level
 * @returns Fuse.js threshold value (0.0 = perfect match, 1.0 = match anything)
 */
function matchLevelToThreshold(level: FuzzyMatchLevel): number {
  switch (level) {
    case FuzzyMatchLevel.STRICT:
      return 0.2;
    case FuzzyMatchLevel.MODERATE:
      return 0.4;
    case FuzzyMatchLevel.PERMISSIVE:
      return 0.6;
  }
}

/**
 * Cleans ingredient name by removing parenthetical content
 *
 * Used to normalize ingredient names before fuzzy matching to improve
 * match quality. For example: "Tomatoes (canned)" becomes "Tomatoes"
 *
 * @param name - Raw ingredient name
 * @returns Cleaned name without parenthetical content
 *
 * @example
 * ```typescript
 * cleanIngredientName('Chicken (boneless)') // Returns: 'Chicken'
 * cleanIngredientName('Olive Oil') // Returns: 'Olive Oil'
 * ```
 */
export function cleanIngredientName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Result of a fuzzy search operation
 */
export type FuzzySearchResult<T> = {
  /** Exact match if found (case-insensitive), undefined otherwise */
  exact?: T;
  /** Similar items sorted by relevance score (empty if exact match found) */
  similar: T[];
};

/**
 * Performs fuzzy search on an array of items with exact match detection
 *
 * Searches for items with values similar to the search query using Fuse.js.
 * First checks for an exact match (case-insensitive), then performs
 * fuzzy matching if no exact match is found. Returns the actual matching items.
 *
 * @param items - Array of items to search
 * @param searchValue - String to search for
 * @param getValue - Function to extract searchable string from each item
 * @param matchLevel - Semantic matching strictness level
 * @returns Object containing exact match or similar items
 *
 * @example
 * ```typescript
 * // Search recipe titles
 * const result = fuzzySearch(
 *   recipes,
 *   'choclate',
 *   r => r.title,
 *   FuzzyMatchLevel.MODERATE
 * );
 *
 * if (result.exact) {
 *   console.log('Found exact match:', result.exact.title);
 * } else {
 *   console.log('Found similar recipes:', result.similar);
 * }
 * ```
 */
export function fuzzySearch<T>(
  items: T[],
  searchValue: string,
  getValue: (item: T) => string,
  matchLevel: FuzzyMatchLevel
): FuzzySearchResult<T> {
  const trimmedValue = searchValue.trim();

  if (!trimmedValue || items.length === 0) {
    return { similar: [] };
  }

  const exactMatch = items.find(
    item => normalizeKey(getValue(item)) === normalizeKey(trimmedValue)
  );
  if (exactMatch) {
    return { exact: exactMatch, similar: [] };
  }

  const threshold = matchLevelToThreshold(matchLevel);
  const fuse = new Fuse(items, {
    keys: [
      {
        name: 'searchValue',
        getFn: getValue,
      },
    ],
    threshold,
    includeScore: true,
  });

  const fuseResults = fuse.search(trimmedValue);
  const similar = fuseResults
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .map(result => result.item);

  return { similar };
}
