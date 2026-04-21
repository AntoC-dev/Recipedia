/**
 * useShopping - Focused hook for the computed shopping list
 *
 * Subscribes to the `menu`, `recipes` and `purchased` slices of the RecipeDatabase
 * singleton via `useSyncExternalStore` and derives the shopping list using the pure
 * `computeShoppingList` function. Re-renders whenever any of those three slices
 * change.
 *
 * Components that only manage the menu (add, remove, toggle cooked) should use
 * `useMenu` instead to avoid subscribing to the recipe catalogue unnecessarily.
 *
 * @module useShopping
 */

import { useSyncExternalStore } from 'react';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { computeShoppingList } from '@utils/ShoppingComputation';
import { ComputedShoppingItem } from '@customTypes/DatabaseElementTypes';

/**
 * Returns the computed shopping list derived from unchecked menu items.
 *
 * The shopping list is recalculated synchronously on every render where any
 * of the three subscribed slices (menu, recipes, purchased) have changed.
 * React Compiler memoises the result automatically.
 *
 * @returns Object containing `shopping` — a flat array of aggregated
 *   `ComputedShoppingItem` entries, one per unique ingredient name
 */
export function useShopping(): { shopping: ComputedShoppingItem[] } {
  const db = RecipeDatabase.getInstance();
  const menu = useSyncExternalStore(
    cb => db.subscribe('menu', cb),
    () => db.get_menu()
  );
  const recipes = useSyncExternalStore(
    cb => db.subscribe('recipes', cb),
    () => db.get_recipes()
  );
  const purchasedIngredients = useSyncExternalStore(
    cb => db.subscribe('purchased', cb),
    () => db.get_purchasedIngredients()
  );

  const shopping = computeShoppingList(menu, recipes, purchasedIngredients);

  return { shopping };
}
