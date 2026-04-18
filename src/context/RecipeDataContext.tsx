/**
 * RecipeDataContext - Focused context for recipe state and CRUD operations
 *
 * Provides reactive access to the recipe collection and all recipe mutations.
 * Consumers re-render only when recipes change, isolating them from ingredient,
 * tag, or menu updates.
 *
 * @example
 * ```typescript
 * function RecipeList() {
 *   const { recipes } = useRecipes();
 *   return <FlashList data={recipes} renderItem={...} />;
 * }
 * ```
 */

import { createContext, useContext } from 'react';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * Type definition for the recipe data context
 */
export interface RecipeDataContextType {
  /** Current recipes state - reactive, triggers re-renders when changed */
  recipes: recipeTableElement[];
  /** Adds recipe to database and refreshes recipes state */
  addRecipe: (recipe: recipeTableElement) => Promise<void>;
  /** Edits recipe in database and refreshes recipes state */
  editRecipe: (recipe: recipeTableElement) => Promise<recipeTableElement>;
  /** Deletes recipe from database and refreshes recipes and menu state */
  deleteRecipe: (recipe: recipeTableElement) => Promise<boolean>;
  /** Finds recipes similar to the given recipe using fuzzy matching */
  findSimilarRecipes: (recipe: recipeTableElement) => recipeTableElement[];
  /** Scales all recipes to new default persons count and refreshes recipes state */
  scaleAllRecipesForNewDefaultPersons: (newDefaultPersons: number) => Promise<void>;
  /** Adds multiple recipes to database and refreshes recipes state */
  addMultipleRecipes: (recipes: recipeTableElement[]) => Promise<void>;
}

export const RecipeDataContext = createContext<RecipeDataContextType | undefined>(undefined);

/**
 * useRecipes - Hook for accessing recipe state and operations
 *
 * @returns RecipeDataContextType with current recipes and all recipe CRUD operations
 * @throws Error if used outside RecipeDatabaseProvider
 */
export const useRecipes = (): RecipeDataContextType => {
  const context = useContext(RecipeDataContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeDatabaseProvider');
  }
  return context;
};
