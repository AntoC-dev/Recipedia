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
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * Provides reactive menu data and all menu/purchase operations.
 *
 * `clearMenu` also drops purchased ingredient state: the database prunes the
 * purchase flags of ingredients that leave the shopping list on every menu
 * mutation, and clearing the menu empties it entirely.
 *
 * @returns Object containing reactive `menu` array, `decodeError` (see
 *   {@link RecipeDatabase.get_decode_error}), and all menu mutation functions
 */
export function useMenu() {
  const db = RecipeDatabase.getInstance();
  const menu = useSyncExternalStore(
    cb => db.subscribe('menu', cb),
    () => db.get_menu()
  );
  const decodeError = db.get_decode_error();
  const purchasedIngredients = useSyncExternalStore(
    cb => db.subscribe('purchased', cb),
    () => db.get_purchasedIngredients()
  );

  const addRecipeToMenu = async (recipe: recipeTableElement): Promise<void> => {
    await db.addRecipeToMenu(recipe);
  };

  const getRecipeById = (recipeId: number): recipeTableElement | null => {
    return db.get_recipes().find(recipe => recipe.id === recipeId) ?? null;
  };

  const toggleMenuItemCooked = async (menuId: number): Promise<boolean> => {
    return db.toggleMenuItemCooked(menuId);
  };

  const removeFromMenu = async (menuId: number): Promise<boolean> => {
    return db.removeFromMenu(menuId);
  };

  const clearMenu = async (): Promise<void> => {
    await db.clearMenu();
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
    decodeError,
    addRecipeToMenu,
    getRecipeById,
    toggleMenuItemCooked,
    removeFromMenu,
    clearMenu,
    isRecipeInMenu,
    togglePurchased,
    clearPurchased,
  };
}
