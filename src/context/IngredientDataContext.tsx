/**
 * IngredientDataContext - Focused context for ingredient state and CRUD operations
 *
 * Provides reactive access to the ingredient collection and all ingredient mutations.
 * Consumers re-render only when ingredients change, isolating them from recipe,
 * tag, or menu updates.
 *
 * @example
 * ```typescript
 * function IngredientsSettings() {
 *   const { ingredients, addIngredient, deleteIngredient } = useIngredients();
 *   return <SettingsItemList items={ingredients} onDelete={deleteIngredient} />;
 * }
 * ```
 */

import { createContext, useContext } from 'react';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';

/**
 * Type definition for the ingredient data context
 */
export interface IngredientDataContextType {
  /** Current ingredients state - reactive, triggers re-renders when changed */
  ingredients: ingredientTableElement[];
  /** Adds ingredient to database and refreshes ingredients state */
  addIngredient: (ingredient: ingredientTableElement) => Promise<ingredientTableElement>;
  /** Edits ingredient in database and refreshes both ingredients AND recipes state */
  editIngredient: (ingredient: ingredientTableElement) => Promise<boolean>;
  /** Deletes ingredient from database and refreshes both ingredients AND recipes state */
  deleteIngredient: (ingredient: ingredientTableElement) => Promise<boolean>;
  /** Finds ingredients similar to the given name using fuzzy matching */
  findSimilarIngredients: (ingredientName: string) => ingredientTableElement[];
  /** Returns random ingredients of specified type */
  getRandomIngredients: (type: ingredientType, count: number) => ingredientTableElement[];
  /** Adds multiple ingredients to database and refreshes ingredients state */
  addMultipleIngredients: (ingredients: ingredientTableElement[]) => Promise<void>;
}

export const IngredientDataContext = createContext<IngredientDataContextType | undefined>(
  undefined
);

/**
 * useIngredients - Hook for accessing ingredient state and operations
 *
 * @returns IngredientDataContextType with current ingredients and all ingredient CRUD operations
 * @throws Error if used outside RecipeDatabaseProvider
 */
export const useIngredients = (): IngredientDataContextType => {
  const context = useContext(IngredientDataContext);
  if (!context) {
    throw new Error('useIngredients must be used within a RecipeDatabaseProvider');
  }
  return context;
};
