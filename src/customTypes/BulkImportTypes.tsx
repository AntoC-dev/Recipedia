/**
 * BulkImport Types - Type definitions for bulk recipe import functionality
 *
 * This module defines the interfaces and types used throughout the bulk import
 * system, including provider interfaces, progress tracking, and recipe data
 * structures for discovery, parsing, and validation phases.
 *
 * Key Types:
 * - `RecipeProvider`: Interface for implementing recipe source providers
 * - `DiscoveryProgress`: Progress tracking during recipe URL discovery
 * - `ParsingProgress`: Progress tracking during recipe content parsing
 * - `DiscoveredRecipe`: Lightweight recipe data from discovery phase
 * - `FullyDiscoveredRecipe`: Complete recipe data after parsing
 * - `ConvertedImportRecipe`: Final format ready for validation and import
 */

import {
  FormIngredientElement,
  ingredientTableElement,
  nutritionTableElement,
  preparationStepElement,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { IgnoredIngredientPatterns } from '@utils/RecipeScraperConverter';

/**
 * Interface for recipe source providers
 *
 * Defines the contract that all recipe providers must implement to support
 * bulk recipe import from external websites.
 */
export interface RecipeProvider {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string;

  /** Languages this provider supports. If undefined, available for all languages. */
  readonly supportedLanguages?: readonly string[];

  getBaseUrl(): Promise<string>;

  discoverRecipeUrls(options: DiscoveryOptions): AsyncGenerator<DiscoveryProgress>;

  parseSelectedRecipes(
    selectedRecipes: DiscoveredRecipe[],
    options: DiscoveryOptions
  ): AsyncGenerator<ParsingProgress>;

  fetchRecipe(
    url: string,
    defaultPersons: number,
    ignoredPatterns: IgnoredIngredientPatterns,
    signal?: AbortSignal
  ): Promise<FetchedRecipe>;

  /**
   * Fetches just the image URL for a recipe page on-demand
   *
   * Used for visibility-based lazy loading of images. Returns null if
   * no image is found or the fetch fails.
   *
   * @param url - Recipe page URL to fetch image for
   * @param signal - Abort signal for cancellation
   * @returns Promise resolving to image URL or null
   */
  fetchImageUrlForRecipe(url: string, signal: AbortSignal): Promise<string | null>;
}

/**
 * Options for recipe discovery and parsing operations
 */
export interface DiscoveryOptions {
  /** Maximum number of recipes to discover */
  maxRecipes?: number;
  /** Abort signal for cancelling the operation */
  signal?: AbortSignal;
  /** Default serving size for parsed recipes */
  defaultPersons?: number;
  /** Callback invoked when a recipe image URL is loaded in background */
  onImageLoaded?: (recipeUrl: string, imageUrl: string) => void;
  /** Patterns for ingredients to skip during parsing */
  ignoredPatterns?: IgnoredIngredientPatterns;
}

/**
 * Progress update during recipe URL discovery phase
 */
export interface DiscoveryProgress {
  /** Current phase of discovery */
  phase: 'discovering' | 'complete';
  /** Total number of recipes found so far */
  recipesFound: number;
  /** Number of category pages scanned */
  categoriesScanned: number;
  /** Total number of category pages to scan */
  totalCategories?: number;
  /** Whether discovery has finished */
  isComplete: boolean;
  /** Array of all discovered recipes */
  recipes: DiscoveredRecipe[];
}

/**
 * Progress update during recipe content parsing phase
 */
export interface ParsingProgress {
  /** Current phase of parsing */
  phase: 'parsing' | 'complete';
  /** Index of the recipe currently being parsed */
  current: number;
  /** Total number of recipes to parse */
  total: number;
  /** Title of the recipe currently being parsed */
  currentRecipeTitle?: string;
  /** Array of successfully parsed recipes */
  parsedRecipes: FullyDiscoveredRecipe[];
  /** Array of recipes that failed to parse */
  failedRecipes: FailedDiscoveryRecipe[];
}

/**
 * Import memory status for a discovered recipe
 *
 * - 'fresh': Recipe has never been seen before
 * - 'seen': Recipe was discovered but not imported in a previous session
 * - 'imported': Recipe has been successfully imported (should be hidden)
 */
export type ImportMemoryStatus = 'fresh' | 'seen' | 'imported';

/**
 * Lightweight recipe data discovered during URL scanning
 *
 * Contains minimal information extracted from category pages
 * for display before full parsing.
 */
export interface DiscoveredRecipe {
  /** URL of the recipe page */
  url: string;
  /** Recipe title extracted from URL slug or page */
  title: string;
  /** Recipe image URL if available */
  imageUrl?: string;
  /** Recipe description if available */
  description?: string;
  /** Import memory status (fresh, seen, or imported) */
  memoryStatus?: ImportMemoryStatus;
}

/**
 * Complete recipe data after full page parsing
 *
 * Contains all extracted recipe information including ingredients,
 * tags, preparation steps, and cached image.
 */
export interface FullyDiscoveredRecipe {
  /** URL of the source recipe page */
  url: string;
  /** Recipe title */
  title: string;
  /** Recipe description */
  description: string;
  /** Local file URI of cached recipe image */
  localImageUri?: string;
  /** Number of servings */
  persons: number;
  /** Cooking time in minutes */
  time: number;
  /** List of parsed ingredients */
  ingredients: FormIngredientElement[];
  /** List of recipe tags/categories */
  tags: tagTableElement[];
  /** List of preparation steps */
  preparation: preparationStepElement[];
  /** Nutritional information */
  nutrition?: nutritionTableElement;
  /** Ingredients that were skipped during parsing */
  skippedIngredients?: string[];
}

/**
 * Recipe that failed during parsing
 */
export interface FailedDiscoveryRecipe {
  /** URL of the recipe that failed */
  url: string;
  /** Title of the failed recipe */
  title: string;
  /** Error message describing the failure */
  error: string;
}

/**
 * Result of fetching and parsing a single recipe
 */
export interface FetchedRecipe {
  /** URL of the fetched recipe */
  url: string;
  /** Converted recipe data ready for import */
  converted: ConvertedImportRecipe;
}

/**
 * Recipe data ready for validation and import
 *
 * Final format containing all recipe information needed for
 * validation against the database and subsequent import.
 */
export interface ConvertedImportRecipe {
  /** Recipe title */
  title: string;
  /** Recipe description */
  description: string;
  /** URL or local URI of recipe image */
  imageUrl: string;
  /** Number of servings */
  persons: number;
  /** Cooking time in minutes */
  time: number;
  /** List of ingredients */
  ingredients: FormIngredientElement[];
  /** List of tags/categories */
  tags: tagTableElement[];
  /** List of preparation steps */
  preparation: preparationStepElement[];
  /** Nutritional information */
  nutrition?: nutritionTableElement;
  /** Ingredients that were skipped during parsing */
  skippedIngredients?: string[];
  /** Original URL of the recipe source */
  sourceUrl: string;
  /** Provider identifier (e.g., 'hellofresh') */
  sourceProvider: string;
}

/**
 * Mapping between an imported ingredient name and its validated database entry
 */
export interface IngredientMapping {
  /** Original ingredient name from the import */
  originalName: string;
  /** Validated ingredient from the database */
  validatedIngredient: ingredientTableElement;
}

/**
 * Mapping between an imported tag name and its validated database entry
 */
export interface TagMapping {
  /** Original tag name from the import */
  originalName: string;
  /** Validated tag from the database */
  validatedTag: tagTableElement;
}

/**
 * State for batch validation of imported recipes
 *
 * Tracks the validation progress for ingredients and tags across
 * multiple recipes being imported together.
 */
export interface BatchValidationState {
  /** Map of unique ingredients by normalized name */
  uniqueIngredients: Map<string, FormIngredientElement>;
  /** Map of unique tags by normalized name */
  uniqueTags: Map<string, tagTableElement>;
  /** Map of ingredient names to their validated database entries */
  ingredientMappings: Map<string, ingredientTableElement>;
  /** Map of tag names to their validated database entries */
  tagMappings: Map<string, tagTableElement>;
  /** Ingredients requiring user validation */
  ingredientsToValidate: FormIngredientElement[];
  /** Tags requiring user validation */
  tagsToValidate: tagTableElement[];
  /** Ingredients that matched exactly in the database */
  exactMatchIngredients: ingredientTableElement[];
  /** Tags that matched exactly in the database */
  exactMatchTags: tagTableElement[];
}

/**
 * Overall progress tracking for the import workflow
 */
export interface ImportProgress {
  /** Current phase of the import process */
  phase: 'discovery' | 'selection' | 'validation' | 'importing' | 'complete';
  /** Current item index being processed */
  current: number;
  /** Total number of items to process */
  total: number;
  /** Optional status message for display */
  message?: string;
}

/**
 * Recipe data ready for database insertion
 *
 * Contains all recipe fields except the auto-generated ID.
 */
export type ValidatedRecipe = Omit<recipeTableElement, 'id'>;

/**
 * Section header item for the discovery list
 */
export type DiscoveryListHeaderItem = {
  type: 'header';
  key: string;
  titleKey: 'bulkImport.selection.newRecipes' | 'bulkImport.selection.previouslySeen';
  count: number;
};

/**
 * Recipe item for the discovery list
 */
export type DiscoveryListRecipeItem = {
  type: 'recipe';
  key: string;
  recipe: DiscoveredRecipe;
};

/**
 * Union type for all items in the discovery list (headers and recipes)
 */
export type DiscoveryListItem = DiscoveryListHeaderItem | DiscoveryListRecipeItem;
