/**
 * BatchValidation - Utilities for batch validation of imported recipes
 *
 * Provides functions to collect unique ingredients/tags across multiple recipes,
 * match them against the database, and apply validated mappings back to recipes.
 *
 * @module utils/BatchValidation
 */

import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  BatchValidationState,
  ConvertedImportRecipe,
  ValidatedRecipe,
} from '@customTypes/BulkImportTypes';
import { bulkImportLogger } from '@utils/logger';
import { normalizeKey } from '@utils/NutritionUtils';

/**
 * Collects unique ingredients and tags from multiple recipes
 *
 * Deduplicates items by normalized name to create a consolidated set
 * of items that need validation against the database.
 *
 * @param recipes - Array of converted recipes to process
 * @returns Maps of unique ingredients and tags keyed by normalized name
 */
export function collectUniqueItems(recipes: ConvertedImportRecipe[]): {
  uniqueIngredients: Map<string, FormIngredientElement>;
  uniqueTags: Map<string, tagTableElement>;
} {
  const uniqueIngredients = new Map<string, FormIngredientElement>();
  const uniqueTags = new Map<string, tagTableElement>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (!ing.name) {
        continue;
      }
      const key = normalizeKey(ing.name);
      if (!uniqueIngredients.has(key)) {
        uniqueIngredients.set(key, ing);
      }
    }

    for (const tag of recipe.tags) {
      const key = normalizeKey(tag.name);
      if (!uniqueTags.has(key)) {
        uniqueTags.set(key, tag);
      }
    }
  }

  bulkImportLogger.info('Collected unique items', {
    ingredientCount: uniqueIngredients.size,
    tagCount: uniqueTags.size,
    recipeCount: recipes.length,
  });

  return { uniqueIngredients, uniqueTags };
}

/**
 * Initializes batch validation state for imported recipes
 *
 * Collects unique items, matches them against the database using the provided
 * search functions, and separates items into exact matches and those needing
 * manual validation.
 *
 * @param recipes - Array of converted recipes to validate
 * @param findSimilarIngredients - Function to search database for similar ingredients
 * @param findSimilarTags - Function to search database for similar tags
 * @returns Initial batch validation state with categorized items
 */
export function initializeBatchValidation(
  recipes: ConvertedImportRecipe[],
  findSimilarIngredients: (name: string) => ingredientTableElement[],
  findSimilarTags: (name: string) => tagTableElement[]
): BatchValidationState {
  const { uniqueIngredients, uniqueTags } = collectUniqueItems(recipes);

  const ingredientsToProcess = [...uniqueIngredients.entries()];
  const tagsToProcess = [...uniqueTags.entries()];

  const ingredientMappings = new Map<string, ingredientTableElement>();
  const ingredientsToValidate: FormIngredientElement[] = [];
  const exactMatchIngredients: ingredientTableElement[] = [];

  for (const [originalKey, ingredient] of ingredientsToProcess) {
    if (!ingredient.name) {
      continue;
    }

    const ingredientName = ingredient.name;
    const similarIngredients = findSimilarIngredients(ingredientName);
    const normalizedIngredientName = normalizeKey(ingredientName);
    const exactMatch = similarIngredients.find(
      dbIng => normalizeKey(dbIng.name) === normalizedIngredientName
    );

    if (exactMatch) {
      const mergedIngredient: ingredientTableElement = {
        ...exactMatch,
        quantity: ingredient.quantity || exactMatch.quantity,
        unit: ingredient.unit || exactMatch.unit,
      };
      ingredientMappings.set(originalKey, mergedIngredient);
      exactMatchIngredients.push(mergedIngredient);
    } else {
      ingredientsToValidate.push(ingredient);
    }
  }

  const tagMappings = new Map<string, tagTableElement>();
  const tagsToValidate: tagTableElement[] = [];
  const exactMatchTags: tagTableElement[] = [];

  for (const [originalKey, tag] of tagsToProcess) {
    const similarTags = findSimilarTags(tag.name);
    const exactMatch = similarTags.find(
      dbTag => normalizeKey(dbTag.name) === normalizeKey(tag.name)
    );

    if (exactMatch) {
      tagMappings.set(originalKey, exactMatch);
      exactMatchTags.push(exactMatch);
    } else {
      tagsToValidate.push(tag);
    }
  }

  bulkImportLogger.info('Batch validation initialized', {
    exactMatchIngredients: exactMatchIngredients.length,
    ingredientsNeedingValidation: ingredientsToValidate.length,
    exactMatchTags: exactMatchTags.length,
    tagsNeedingValidation: tagsToValidate.length,
  });

  return {
    uniqueIngredients,
    uniqueTags,
    ingredientMappings,
    tagMappings,
    ingredientsToValidate,
    tagsToValidate,
    exactMatchIngredients,
    exactMatchTags,
  };
}

/**
 * Adds a validated ingredient mapping to the batch state
 *
 * @param state - Current batch validation state
 * @param originalName - Original ingredient name from the import
 * @param validatedIngredient - Validated ingredient from the database
 */
export function addIngredientMapping(
  state: BatchValidationState,
  originalName: string,
  validatedIngredient: ingredientTableElement
): void {
  const key = normalizeKey(originalName);
  state.ingredientMappings.set(key, validatedIngredient);

  bulkImportLogger.debug('Added ingredient mapping', {
    original: originalName,
    validated: validatedIngredient.name,
  });
}

/**
 * Adds a validated tag mapping to the batch state
 *
 * @param state - Current batch validation state
 * @param originalName - Original tag name from the import
 * @param validatedTag - Validated tag from the database
 */
export function addTagMapping(
  state: BatchValidationState,
  originalName: string,
  validatedTag: tagTableElement
): void {
  const key = normalizeKey(originalName);
  state.tagMappings.set(key, validatedTag);

  bulkImportLogger.debug('Added tag mapping', {
    original: originalName,
    validated: validatedTag.name,
  });
}

/**
 * Applies validated mappings to convert imported recipes to database format
 *
 * Replaces imported ingredients and tags with their validated database equivalents,
 * preserving quantity and unit from the original import.
 *
 * @param recipes - Array of converted import recipes
 * @param state - Batch validation state containing mappings
 * @returns Array of validated recipes ready for database insertion
 */
export function applyMappingsToRecipes(
  recipes: ConvertedImportRecipe[],
  state: BatchValidationState
): ValidatedRecipe[] {
  const validatedRecipes: ValidatedRecipe[] = [];

  for (const recipe of recipes) {
    const mappedIngredients: ingredientTableElement[] = [];

    for (const ing of recipe.ingredients) {
      if (!ing.name) continue;

      const key = normalizeKey(ing.name);
      const mappedIngredient = state.ingredientMappings.get(key);

      if (mappedIngredient) {
        mappedIngredients.push({
          ...mappedIngredient,
          quantity: ing.quantity || mappedIngredient.quantity,
          unit: ing.unit || mappedIngredient.unit,
        });
      } else {
        bulkImportLogger.warn('Ingredient not found in mappings, skipping', {
          ingredient: ing.name,
          recipe: recipe.title,
        });
      }
    }

    const mappedTags: tagTableElement[] = [];

    for (const tag of recipe.tags) {
      const key = normalizeKey(tag.name);
      const mappedTag = state.tagMappings.get(key);

      if (mappedTag) {
        mappedTags.push(mappedTag);
      } else {
        bulkImportLogger.warn('Tag not found in mappings, skipping', {
          tag: tag.name,
          recipe: recipe.title,
        });
      }
    }

    const validatedRecipe: ValidatedRecipe = {
      title: recipe.title,
      description: recipe.description,
      image_Source: recipe.imageUrl,
      persons: recipe.persons,
      time: recipe.time,
      ingredients: mappedIngredients,
      tags: mappedTags,
      preparation: recipe.preparation,
      nutrition: recipe.nutrition,
      season: [],
      sourceUrl: recipe.sourceUrl,
      sourceProvider: recipe.sourceProvider,
    };

    validatedRecipes.push(validatedRecipe);
  }

  bulkImportLogger.info('Applied mappings to recipes', {
    recipeCount: validatedRecipes.length,
  });

  return validatedRecipes;
}

/**
 * Gets the current validation progress from batch state
 *
 * @param state - Current batch validation state
 * @returns Progress metrics for ingredients and tags validation
 */
export function getValidationProgress(state: BatchValidationState): {
  totalIngredients: number;
  validatedIngredients: number;
  totalTags: number;
  validatedTags: number;
  remainingIngredients: number;
  remainingTags: number;
} {
  const totalIngredients = state.uniqueIngredients.size;
  const validatedIngredients = state.ingredientMappings.size;
  const totalTags = state.uniqueTags.size;
  const validatedTags = state.tagMappings.size;

  return {
    totalIngredients,
    validatedIngredients,
    totalTags,
    validatedTags,
    remainingIngredients: state.ingredientsToValidate.length,
    remainingTags: state.tagsToValidate.length,
  };
}
