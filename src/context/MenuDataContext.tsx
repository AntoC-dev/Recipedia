/**
 * MenuDataContext - Focused context for menu, shopping list, and purchase state
 *
 * Provides reactive access to the meal plan menu, the computed shopping list derived
 * from unchecked menu items, and ingredient purchase tracking. Consumers re-render
 * only when menu or purchase state changes, not on recipe or ingredient catalog updates.
 *
 * @example
 * ```typescript
 * function MenuScreen() {
 *   const { menu, removeFromMenu, toggleMenuItemCooked } = useMenu();
 *   return <MenuList items={menu} onRemove={removeFromMenu} />;
 * }
 * ```
 */

import { createContext, useContext } from 'react';
import {
  ComputedShoppingItem,
  menuTableElement,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';

/**
 * Type definition for the menu data context
 */
export interface MenuDataContextType {
  /** Current menu state - reactive, triggers re-renders when changed */
  menu: menuTableElement[];
  /** Computed shopping list from unchecked menu items */
  shopping: ComputedShoppingItem[];
  /** Adds recipe to menu */
  addRecipeToMenu: (recipe: recipeTableElement) => Promise<void>;
  /** Toggles cooked status of a menu item */
  toggleMenuItemCooked: (menuId: number) => Promise<boolean>;
  /** Removes item from menu */
  removeFromMenu: (menuId: number) => Promise<boolean>;
  /** Clears entire menu and purchased ingredient states */
  clearMenu: () => Promise<void>;
  /** Checks if recipe is currently in menu */
  isRecipeInMenu: (recipeId: number) => boolean;
  /** Toggles purchase status of ingredient by name */
  togglePurchased: (ingredientName: string) => Promise<void>;
  /** Clears all purchased ingredient states */
  clearPurchased: () => Promise<void>;
}

export const MenuDataContext = createContext<MenuDataContextType | undefined>(undefined);

/**
 * useMenu - Hook for accessing menu, shopping list, and purchase state
 *
 * @returns MenuDataContextType with current menu, shopping list, and all menu operations
 * @throws Error if used outside RecipeDatabaseProvider
 */
export const useMenu = (): MenuDataContextType => {
  const context = useContext(MenuDataContext);
  if (!context) {
    throw new Error('useMenu must be used within a RecipeDatabaseProvider');
  }
  return context;
};
