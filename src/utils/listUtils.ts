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
 * Key extractor for recipe list items.
 * Prefers the database ID; falls back to the recipe title when no ID exists (new/unsaved recipes).
 *
 * @param item - Recipe to extract a key from
 * @returns Unique string key for the item
 */
export function getRecipeKey(item: recipeTableElement): string {
  return item.id?.toString() ?? item.title;
}

/**
 * Key extractor for settings list items (ingredients and tags).
 * Prefers the database ID; falls back to the item name when no ID exists (new/unsaved items).
 *
 * @param item - Ingredient or tag to extract a key from
 * @returns Unique string key for the item
 */
export function getSettingsItemKey(item: ingredientTableElement | tagTableElement): string {
  return item.id?.toString() ?? item.name;
}
