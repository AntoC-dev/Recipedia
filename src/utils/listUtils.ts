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
 * Scroll anchoring for lists whose rows are mutated in place.
 *
 * React Native lists default to no anchoring, so removing or reordering a row
 * above the viewport shifts everything below it and the list jumps under the
 * user's finger. Anchoring on the first visible row keeps it still. FlashList
 * anchors by default and opts out instead — see `{ disabled: true }` in
 * `Search.tsx` and `SettingsItemList.tsx`.
 */
export const ANCHOR_ON_FIRST_VISIBLE_ROW = { minIndexForVisible: 0 } as const;

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
