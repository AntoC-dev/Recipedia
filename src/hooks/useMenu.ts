/**
 * useMenu - Focused hook for menu data and purchase state operations
 *
 * Subscribes to the `menu` and `purchased` slices of the RecipeDatabase singleton
 * via `useSyncExternalStore`. Re-renders only when menu or purchase state changes —
 * unaffected by recipe or ingredient catalogue mutations.
 *
 * For the derived shopping list (which also depends on recipes) use `useShopping`.
 *
 * @module useMenu
 */

import { useSyncExternalStore } from 'react';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { menuTableElement, recipeTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * Provides reactive menu data and all menu/purchase operations.
 *
 * `clearMenu` also clears purchased ingredient state, matching the behaviour
 * of the old context-based implementation.
 *
 * @returns Object containing reactive `menu` array and all menu mutation functions
 */
export function useMenu() {
  const db = RecipeDatabase.getInstance();
  const menu = useSyncExternalStore(
    cb => db.subscribe('menu', cb),
    () => db.get_menu()
  );
  const purchasedIngredients = useSyncExternalStore(
    cb => db.subscribe('purchased', cb),
    () => db.get_purchasedIngredients()
  );

  const addRecipeToMenu = async (recipe: recipeTableElement): Promise<void> => {
    await db.addRecipeToMenu(recipe);
  };

  const toggleMenuItemCooked = async (menuId: number): Promise<boolean> => {
    return db.toggleMenuItemCooked(menuId);
  };

  const removeFromMenu = async (menuId: number): Promise<boolean> => {
    return db.removeFromMenu(menuId);
  };

  const clearMenu = async (): Promise<void> => {
    await db.clearMenu();
    await db.clearPurchasedIngredients();
  };

  const isRecipeInMenu = (recipeId: number): boolean => {
    return db.isRecipeInMenu(recipeId);
  };

  const togglePurchased = async (ingredientName: string): Promise<void> => {
    const currentValue = purchasedIngredients.get(ingredientName) ?? false;
    await db.setPurchased(ingredientName, !currentValue);
  };

  const clearPurchased = async (): Promise<void> => {
    await db.clearPurchasedIngredients();
  };

  return {
    menu,
    addRecipeToMenu,
    toggleMenuItemCooked,
    removeFromMenu,
    clearMenu,
    isRecipeInMenu,
    togglePurchased,
    clearPurchased,
  };
}

export type { menuTableElement };
