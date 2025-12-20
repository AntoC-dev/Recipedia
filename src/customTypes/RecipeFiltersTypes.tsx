/**
 * RecipeFiltersTypes - Comprehensive filtering system types and utilities
 *
 * This module defines the complete filtering system for recipe search and organization.
 * Combines ingredient categories with non-ingredient filters to provide a unified
 * filtering interface throughout the app.
 *
 * Key Features:
 * - Unified filter type system combining ingredients and metadata
 * - Type-safe filter operations with compile-time validation
 * - Internationalization support with translation key mapping
 * - Shopping list integration with categorization
 * - Seasonal filtering with automatic date handling
 * - Preparation time ranges for recipe filtering
 * - Extensible filter system for future enhancements
 *
 * Filter Categories:
 * - **Ingredient Types**: All ingredient categories from DatabaseElementTypes
 * - **Recipe Metadata**: Title search, tags, preparation time
 * - **Seasonal**: In-season ingredient filtering
 * - **Shopping**: Purchase status for shopping list items
 *
 * @example
 * ```typescript
 * // Creating a filter state
 * const filterState = new Map<TListFilter, string[]>();
 * filterState.set(listFilter.vegetable, ['tomato', 'onion']);
 * filterState.set(listFilter.prepTime, ['preparationTimes.tenToFifteen']);
 *
 * // Using filter accessors
 * const filterUtils: filtersAccessAndModifiers = {
 *   filtersState: filterState,
 *   addFilter: (type, value) => {
 *     const current = filterState.get(type) || [];
 *     filterState.set(type, [...current, value]);
 *   },
 *   removeFilter: (type, value) => {
 *     const current = filterState.get(type) || [];
 *     filterState.set(type, current.filter(v => v !== value));
 *   }
 * };
 *
 * // Seasonal filtering
 * if (seasonFilterEnabled) {
 *   filterState.set(listFilter.inSeason, [currentMonth.toString()]);
 * }
 * ```
 */

import { ComputedShoppingItem, ingredientType, recipeTableElement } from './DatabaseElementTypes';

/** Current month for seasonal filtering (1-12) */
export const currentMonth = new Date().getMonth() + 1;

/**
 * Interface for filter state access and modification
 * Provides a consistent API for managing filter operations
 */
export type filtersAccessAndModifiers = {
  /** Current filter state mapping filter types to selected values */
  filtersState: Map<TListFilter, string[]>;
  /** Function to add a value to a specific filter */
  addFilter: (filter: TListFilter, value: string) => void;
  /** Function to remove a value from a specific filter */
  removeFilter: (filter: TListFilter, value: string) => void;
};

/**
 * Non-ingredient filter types with translation key mapping
 * These filters apply to recipe metadata rather than ingredients
 */
export enum nonIngredientFilters {
  /** Filter by recipe title/name */
  recipeTitleInclude = 'filterTypes.recipeTitleInclude',
  /** Filter for seasonal ingredients only */
  inSeason = 'filterTypes.inSeason',
  /** Filter by preparation time ranges */
  prepTime = 'filterTypes.prepTime',
  /** Filter by recipe tags */
  tags = 'filterTypes.tags',
  /** Filter by purchase status (shopping list) */
  purchased = 'filterTypes.purchased',
}

/** Combined filter object including both ingredient types and metadata filters */
export const listFilter = { ...nonIngredientFilters, ...ingredientType } as const;

/** Union type representing all possible filter values */
export type TListFilter = (typeof listFilter)[keyof typeof listFilter];

/** Array of all available filter categories for UI components */
export const filtersCategories: TListFilter[] = Object.values(listFilter);

/**
 * Shopping list data structure organized by category
 * Used for sectioned display in shopping list interface
 */
export type ShoppingAppliedToDatabase = {
  /** Category title (filter type) */
  title: TListFilter;
  /** Array of shopping list items in this category */
  data: ComputedShoppingItem[];
};

/**
 * Filter data structure for UI components
 * Used for accordion-style filter selection interfaces
 */
export type FiltersAppliedToDatabase = {
  /** Filter category title */
  title: TListFilter;
  /** Array of available filter values */
  data: string[];
};

/**
 * Props interface for shopping list components
 * Provides shopping list data and update functionality
 */
export type propsForShopping = {
  /** Array of shopping list items */
  ingList: ComputedShoppingItem[];
  /** Function to update ingredient purchase status */
  updateIngredientFromShopping: (ingredientName: string) => void;
};

/** Type alias for ingredient category values */
export type TIngredientCategories = (typeof ingredientType)[keyof typeof ingredientType];

/** Array of all ingredient categories for shopping organization */
export const shoppingCategories: TIngredientCategories[] = Object.values(ingredientType);

/**
 * Predefined preparation time ranges for recipe filtering
 * Values map to translation keys for internationalization
 */
export const prepTimeValues = [
  'preparationTimes.noneToTen',
  'preparationTimes.tenToFifteen',
  'preparationTimes.FifteenToTwenty',
  'preparationTimes.twentyToTwentyFive',
  'preparationTimes.twentyFiveToThirty',
  'preparationTimes.thirtyToFourty',
  'preparationTimes.fourtyToFifty',
  'preparationTimes.oneHourPlus',
];

/**
 * Type definition for home screen recommendation objects
 *
 * Represents a collection of recipes with a common theme (random, seasonal,
 * ingredient-based, or tag-based) for display in the home screen carousel.
 */
export type RecommendationType = {
  /** Unique identifier for the recommendation */
  id: string;
  /** Translation key for the recommendation title */
  titleKey: string;
  /** Optional parameters for title translation interpolation */
  titleParams?: { ingredientName?: string; tagName?: string };
  /** Array of recipes in this recommendation */
  recipes: recipeTableElement[];
  /** Category type of the recommendation */
  type: 'random' | 'seasonal' | 'ingredient' | 'tag';
};
