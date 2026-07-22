/**
 * listUtils - Utility functions for FlashList and FlatList configuration
 *
 * Provides stable key extractor functions for list components, ensuring proper
 * item identity tracking for recycling and re-render optimisation.
 *
 * @module listUtils
 */

import {
  recipeTableElement,
  tagTableElement,
  ingredientTableElement,
} from '@customTypes/DatabaseElementTypes';

/**
 * Key extractor for recipe list items, keyed on the persisted database id.
 *
 * @param item - Recipe to extract a key from
 * @returns Unique string key for the item
 */
export function getRecipeKey(item: recipeTableElement): string {
  return item.id.toString();
}

/**
 * Key extractor for settings list items (ingredients and tags), keyed on the
 * persisted database id. Settings lists only ever render persisted rows.
 *
 * @param item - Ingredient or tag to extract a key from
 * @returns Unique string key for the item
 */
export function getSettingsItemKey(item: ingredientTableElement | tagTableElement): string {
  return item.id.toString();
}
