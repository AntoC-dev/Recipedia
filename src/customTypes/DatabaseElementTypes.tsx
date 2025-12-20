/**
 * DatabaseElementTypes - Comprehensive type definitions for Recipedia database schema
 *
 * This module defines all TypeScript types, interfaces, and utility functions for
 * interacting with the SQLite database. Includes table schemas, encoding/decoding
 * functions, and type-safe database operations.
 *
 * Key Features:
 * - Complete type safety for database operations
 * - Bi-directional encoding/decoding between TypeScript and SQLite
 * - Utility functions for data transformation and comparison
 * - Comprehensive schema definitions for all tables
 * - Type-safe ingredient categorization system
 * - Shopping list integration with recipe data
 * - Seasonal filtering type support
 *
 * Database Schema:
 * - **Recipes**: Complete recipe data with relationships
 * - **Ingredients**: Ingredient master data with seasonality
 * - **Tags**: Recipe categorization system
 * - **Shopping List**: Dynamic shopping list with recipe tracking
 * - **Nutrition**: Nutritional information (future implementation)
 *
 * Type Safety Patterns:
 * - Discriminated unions for ingredient types
 * - Optional ID fields for new vs existing records
 * - Encoded vs decoded types for database serialization
 * - Utility functions for type checking and comparison
 *
 * @example
 * ```typescript
 * // Creating a new recipe
 * const newRecipe: recipeTableElement = {
 *   title: "Chocolate Chip Cookies",
 *   description: "Classic homemade cookies",
 *   image_Source: "/path/to/image.jpg",
 *   ingredients: [
 *     {
 *       name: "flour",
 *       quantity: "2",
 *       unit: "cups",
 *       type: ingredientType.grainOrCereal,
 *       season: []
 *     }
 *   ],
 *   tags: [{ name: "dessert" }],
 *   persons: 4,
 *   time: 30,
 *   preparation: ["Mix ingredients", "Bake for 12 minutes"],
 *   season: []
 * };
 *
 * // Type-safe ingredient filtering
 * const vegetables = arrayOfType(ingredients, ingredientType.vegetable);
 *
 * // Recipe comparison
 * const areEqual = isRecipeEqual(recipe1, recipe2);
 * ```
 */

import { textSeparator, unitySeparator } from '@styles/typography';
import { TListFilter } from './RecipeFiltersTypes';

/** Database and table name constants */
export const recipeDatabaseName = 'RecipesDatabase';
export const recipeTableName = 'RecipesTable';
export const ingredientsTableName = 'IngredientsTable';
export const tagTableName = 'TagsTable';

/** SQLite data type enumeration */
export enum encodedType {
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  BLOB = 'BLOB',
  TEXT = 'TEXT',
}

/** Database column definition type */
export type databaseColumnType = {
  /** Column name in the database */
  colName: string;
  /** SQLite data type for the column */
  type: encodedType;
};

/** Recipe table column names for database operations */
export enum recipeColumnsNames {
  image = 'IMAGE_SOURCE',
  title = 'TITLE',
  description = 'DESCRIPTION',
  tags = 'TAGS',
  persons = 'PERSONS',
  ingredients = 'INGREDIENTS',
  preparation = 'PREPARATION',
  time = 'TIME',
  nutrition = 'NUTRITION',
  sourceUrl = 'SOURCE_URL',
  sourceProvider = 'SOURCE_PROVIDER',
}

/**
 * Complete recipe data structure for application use
 * Represents a fully decoded recipe with all related data
 */
export type recipeTableElement = {
  /** Optional database ID (undefined for new recipes) */
  id?: number;
  /** Path or URI to recipe image */
  image_Source: string;
  /** Recipe title/name */
  title: string;
  /** Recipe description */
  description: string;
  /** Array of associated tags */
  tags: tagTableElement[];
  /** Number of servings */
  persons: number;
  /** Array of recipe ingredients with quantities */
  ingredients: ingredientTableElement[];
  /** Seasonal availability data */
  season: string[];
  /** Step-by-step preparation instructions with structured data */
  preparation: preparationStepElement[];
  /** Total preparation time in minutes */
  time: number;
  /** Optional nutrition facts (undefined when not available) */
  nutrition?: nutritionTableElement;
  /** Original URL from bulk import source (undefined for manually created recipes) */
  sourceUrl?: string;
  /** Provider ID from bulk import (e.g., 'hellofresh') */
  sourceProvider?: string;
};

export type encodedRecipeElement = {
  ID: number;
  IMAGE_SOURCE: string;
  TITLE: string;
  DESCRIPTION: string;
  TAGS: string;
  PERSONS: number;
  INGREDIENTS: string;
  PREPARATION: string;
  TIME: number;
  NUTRITION: string;
  SOURCE_URL: string;
  SOURCE_PROVIDER: string;
};

export const recipeColumnsEncoding: databaseColumnType[] = [
  { colName: recipeColumnsNames.image, type: encodedType.TEXT },
  { colName: recipeColumnsNames.title, type: encodedType.TEXT },
  { colName: recipeColumnsNames.description, type: encodedType.TEXT },
  { colName: recipeColumnsNames.tags, type: encodedType.TEXT },
  { colName: recipeColumnsNames.persons, type: encodedType.INTEGER },
  { colName: recipeColumnsNames.ingredients, type: encodedType.TEXT },
  { colName: recipeColumnsNames.preparation, type: encodedType.TEXT },
  { colName: recipeColumnsNames.time, type: encodedType.INTEGER },
  { colName: recipeColumnsNames.nutrition, type: encodedType.TEXT },
  { colName: recipeColumnsNames.sourceUrl, type: encodedType.TEXT },
  { colName: recipeColumnsNames.sourceProvider, type: encodedType.TEXT },
];

/**
 * Ingredient data structure with complete metadata
 * Supports both database storage and recipe usage
 */
export type ingredientTableElement = {
  /** Optional database ID (undefined for new ingredients) */
  id?: number;
  /** Ingredient name */
  name: string;
  /** Unit of measurement (cups, grams, pieces, etc.) */
  unit: string;
  /** Quantity as string to support fractional and textual amounts */
  quantity?: string;
  /** Categorization type for organization and shopping */
  type: ingredientType;
  /** Array of month numbers when ingredient is in season */
  season: string[];
};

/**
 * Incomplete ingredient used in UI forms before all fields are filled
 * All fields are optional to represent work-in-progress state
 * When confirmed/validated, convert to ingredientTableElement
 */
export type FormIngredientElement = Partial<ingredientTableElement>;

export type coreIngredientElement = Pick<ingredientTableElement, 'name'> & {
  quantityPerPerson: number | undefined;
};

export type encodedIngredientElement = {
  ID: number;
  INGREDIENT: string;
  UNIT: string;
  TYPE: string;
  SEASON: string;
};

export enum ingredientsColumnsNames {
  ingredient = 'INGREDIENT',
  unit = 'UNIT',
  type = 'TYPE',
  season = 'SEASON',
}

export const ingredientColumnsEncoding: databaseColumnType[] = [
  { colName: ingredientsColumnsNames.ingredient, type: encodedType.TEXT },
  { colName: ingredientsColumnsNames.unit, type: encodedType.TEXT },
  { colName: ingredientsColumnsNames.type, type: encodedType.TEXT },
  { colName: ingredientsColumnsNames.season, type: encodedType.TEXT },
];

export type nutritionTableElement = {
  /** Optional database ID (undefined for new nutrition data) */
  id?: number;
  /** Energy in kcal per 100g */
  energyKcal: number;
  /** Energy in kJ per 100g */
  energyKj: number;
  /** Total fats in grams per 100g */
  fat: number;
  /** Saturated fats in grams per 100g (subset of total fats) */
  saturatedFat: number;
  /** Total carbohydrates in grams per 100g */
  carbohydrates: number;
  /** Sugars in grams per 100g (subset of carbohydrates) */
  sugars: number;
  /** Dietary fiber in grams per 100g */
  fiber: number;
  /** Proteins in grams per 100g */
  protein: number;
  /** Salt in grams per 100g */
  salt: number;
  /** Portion size in grams for per-portion calculations */
  portionWeight: number;
};

/**
 * Individual preparation step with structured data
 */
export type preparationStepElement = {
  /** Step title or heading (e.g., "1. Cook the rice") */
  title: string;
  /** Detailed step instructions */
  description: string;
};

/**
 * Simple tag data structure for recipe categorization
 */
export type tagTableElement = {
  /** Optional database ID (undefined for new tags) */
  id?: number;
  /** Tag name/label */
  name: string;
};

export enum tagsColumnsNames {
  name = 'NAME',
}

export const tagColumnsEncoding: databaseColumnType[] = [
  { colName: tagsColumnsNames.name, type: encodedType.TEXT },
];

export type encodedTagElement = {
  ID: number;
  NAME: string;
};

/** Import history table name for tracking discovered recipes */
export const importHistoryTableName = 'ImportHistoryTable';

/**
 * Import history record for tracking discovered-but-not-imported recipes
 * Used to show visual indicators for previously seen recipes during bulk import
 */
export type importHistoryTableElement = {
  /** Optional database ID (undefined for new records) */
  id?: number;
  /** Provider identifier (e.g., 'hellofresh') */
  providerId: string;
  /** Full recipe URL from the provider */
  recipeUrl: string;
  /** Timestamp when recipe was last seen (Unix ms) */
  lastSeenAt: number;
};

export type encodedImportHistoryElement = {
  ID: number;
  PROVIDER_ID: string;
  RECIPE_URL: string;
  LAST_SEEN_AT: number;
};

export enum importHistoryColumnsNames {
  providerId = 'PROVIDER_ID',
  recipeUrl = 'RECIPE_URL',
  lastSeenAt = 'LAST_SEEN_AT',
}

export const importHistoryColumnsEncoding: databaseColumnType[] = [
  { colName: importHistoryColumnsNames.providerId, type: encodedType.TEXT },
  { colName: importHistoryColumnsNames.recipeUrl, type: encodedType.TEXT },
  { colName: importHistoryColumnsNames.lastSeenAt, type: encodedType.INTEGER },
];

/** Menu table name for tracking recipes in the weekly menu */
export const menuTableName = 'MenuTable';

/**
 * Menu item representing a recipe added to the user's cooking menu.
 * The menu is the single source of truth - the shopping list is generated from it.
 */
export type menuTableElement = {
  /** Optional database ID (undefined for new menu items) */
  id?: number;
  /** Recipe ID from the recipes table */
  recipeId: number;
  /** Recipe title (denormalized for quick display) */
  recipeTitle: string;
  /** Recipe image source (denormalized for quick display) */
  imageSource: string;
  /** Whether the recipe has been cooked */
  isCooked: boolean;
  /** Number of times this recipe should be cooked (default 1) */
  count: number;
};

export type encodedMenuElement = {
  ID: number;
  RECIPE_ID: number;
  COUNT: number;
  RECIPE_TITLE: string;
  IMAGE_SOURCE: string;
  IS_COOKED: number;
};

export enum menuColumnsNames {
  recipeId = 'RECIPE_ID',
  recipeTitle = 'RECIPE_TITLE',
  imageSource = 'IMAGE_SOURCE',
  isCooked = 'IS_COOKED',
  count = 'COUNT',
}

export const menuColumnsEncoding: databaseColumnType[] = [
  { colName: menuColumnsNames.recipeId, type: encodedType.INTEGER },
  { colName: menuColumnsNames.recipeTitle, type: encodedType.TEXT },
  { colName: menuColumnsNames.imageSource, type: encodedType.TEXT },
  { colName: menuColumnsNames.isCooked, type: encodedType.INTEGER },
  { colName: menuColumnsNames.count, type: encodedType.INTEGER },
];

/** Purchased ingredients table - lightweight table to persist purchase state */
export const purchasedIngredientsTableName = 'PurchasedIngredientsTable';

/**
 * Tracks which ingredients have been purchased.
 * Ingredient name is the primary key - simple key-value storage.
 */
export type purchasedIngredientElement = {
  ingredientName: string;
  purchased: boolean;
};

export type encodedPurchasedIngredientElement = {
  INGREDIENT_NAME: string;
  PURCHASED: number;
};

export enum purchasedIngredientsColumnsNames {
  ingredientName = 'INGREDIENT_NAME',
  purchased = 'PURCHASED',
}

export const purchasedIngredientsColumnsEncoding: databaseColumnType[] = [
  { colName: purchasedIngredientsColumnsNames.ingredientName, type: encodedType.TEXT },
  { colName: purchasedIngredientsColumnsNames.purchased, type: encodedType.INTEGER },
];

/**
 * Computed shopping list item - derived from menu and recipes.
 * Purchase state is merged from the PurchasedIngredients table.
 */
export type ComputedShoppingItem = {
  name: string;
  type: TListFilter;
  quantity: string;
  unit: string;
  recipeTitles: string[];
  purchased: boolean;
};

export function arrayOfType(
  ingredients: ingredientTableElement[],
  filter: string
): ingredientTableElement[] {
  return ingredients.filter(ingredient => ingredient.type === filter);
}

// TODO use more this function
export function extractIngredientsNameWithQuantity(
  ingredients: ingredientTableElement[]
): string[] {
  return ingredients.map(
    ingredient =>
      ingredient.quantity + unitySeparator + ingredient.unit + textSeparator + ingredient.name
  );
}

export function extractTagsName(tags: tagTableElement[]): string[] {
  const result: string[] = [];
  tags.forEach(element => {
    result.push(element.name);
  });

  return result;
}

export function isRecipePartiallyEqual(
  recipe1: recipeTableElement,
  recipe2: recipeTableElement
): boolean {
  return (
    recipe1.image_Source === recipe2.image_Source &&
    recipe1.title === recipe2.title &&
    recipe1.description === recipe2.description
  );
}

export function isRecipeEqual(recipe1: recipeTableElement, recipe2: recipeTableElement): boolean {
  return (
    recipe1.image_Source === recipe2.image_Source &&
    recipe1.image_Source === recipe2.image_Source &&
    recipe1.title === recipe2.title &&
    recipe1.description === recipe2.description &&
    JSON.stringify(recipe1.tags) === JSON.stringify(recipe2.tags) &&
    recipe1.persons === recipe2.persons &&
    JSON.stringify(recipe1.ingredients) === JSON.stringify(recipe2.ingredients) &&
    JSON.stringify(recipe1.season) === JSON.stringify(recipe2.season) &&
    JSON.stringify(recipe1.preparation) === JSON.stringify(recipe2.preparation) &&
    recipe1.time === recipe2.time
  );
}

export function isIngredientEqual(
  ingredient1: ingredientTableElement | FormIngredientElement,
  ingredient2: ingredientTableElement | FormIngredientElement
): boolean {
  return (
    ingredient1.name === ingredient2.name &&
    ingredient1.unit === ingredient2.unit &&
    (!ingredient1.type || !ingredient2.type || ingredient1.type === ingredient2.type)
  );
}

export function isTagEqual(tag1: tagTableElement, tag2: tagTableElement): boolean {
  return tag1.name === tag2.name;
}

/**
 * Asserts ingredient has a valid type before database operations
 * @throws Error if type is undefined
 */
export function assertIngredientType(
  ingredient: FormIngredientElement
): asserts ingredient is ingredientTableElement {
  if (!ingredient.type) {
    throw new Error(`Ingredient "${ingredient.name}" must have a type before saving`);
  }
}

/**
 * Comprehensive ingredient categorization system
 * Values map to translation keys for internationalization
 */
export enum ingredientType {
  /** Cereals, rice, pasta, bread */
  cereal = 'ingredientTypes.cereal',
  /** Beans, lentils, chickpeas, peas */
  legumes = 'ingredientTypes.legumes',
  /** Fresh and preserved vegetables */
  vegetable = 'ingredientTypes.vegetable',
  /** Tofu, tempeh, plant-based proteins */
  plantProtein = 'ingredientTypes.plantProtein',
  /** Herbs, spices, seasonings, vinegars */
  condiment = 'ingredientTypes.condiment',
  /** Prepared sauces, dressings, marinades */
  sauce = 'ingredientTypes.sauce',
  /** Beef, pork, lamb, game meat */
  meat = 'ingredientTypes.meat',
  /** Chicken, turkey, duck, poultry */
  poultry = 'ingredientTypes.poultry',
  /** Fresh and preserved fish */
  fish = 'ingredientTypes.fish',
  /** Shellfish, mollusks, seafood */
  seafood = 'ingredientTypes.seafood',
  /** Milk, yogurt, cream, butter */
  dairy = 'ingredientTypes.dairy',
  /** All varieties of cheese */
  cheese = 'ingredientTypes.cheese',
  /** Granulated and powdered sugars */
  sugar = 'ingredientTypes.sugar',
  /** Individual spices and spice blends */
  spice = 'ingredientTypes.spice',
  /** Fresh, dried, and preserved fruits */
  fruit = 'ingredientTypes.fruit',
  /** Cooking oils, fats, shortening */
  oilAndFat = 'ingredientTypes.oilAndFat',
  /** Nuts, seeds, nut butters */
  nutsAndSeeds = 'ingredientTypes.nutsAndSeeds',
  /** Honey, maple syrup, artificial sweeteners */
  sweetener = 'ingredientTypes.sweetener',
}
