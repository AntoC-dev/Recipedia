import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { namesMatch } from '@utils/NutritionUtils';

export type IngredientState = (ingredientTableElement | FormIngredientElement)[];

/**
 * Filters out tags that already exist in the current list.
 * Used before validation to avoid processing duplicates.
 */
export function filterOutExistingTags(
  newTags: tagTableElement[],
  existingTags: tagTableElement[]
): tagTableElement[] {
  return newTags.filter(
    newTag => !existingTags.some(existing => namesMatch(existing.name, newTag.name))
  );
}

/**
 * Removes an ingredient from array by name (case-insensitive).
 * Used when user dismisses an ingredient during validation.
 */
export function removeIngredientByName(
  ingredients: IngredientState,
  nameToRemove: string | undefined
): IngredientState {
  if (!nameToRemove) return ingredients;
  return ingredients.filter(ing => !namesMatch(ing.name, nameToRemove));
}

/**
 * Removes a tag from array by name (case-insensitive).
 * Used when user dismisses a tag during validation.
 */
export function removeTagByName(tags: tagTableElement[], nameToRemove: string): tagTableElement[] {
  return tags.filter(tag => !namesMatch(tag.name, nameToRemove));
}

/**
 * Replaces ingredients in array with exact matches by name.
 * Used by scraper validation to update form ingredients with database matches.
 */
export function replaceMatchingIngredients(
  current: IngredientState,
  exactMatches: ingredientTableElement[]
): IngredientState {
  const updated = [...current];
  const replacedIndices = new Set<number>();

  for (const ingredient of exactMatches) {
    const idx = updated.findIndex(
      (e, i) => !replacedIndices.has(i) && namesMatch(e.name, ingredient.name)
    );
    if (idx !== -1) {
      updated[idx] = ingredient;
      replacedIndices.add(idx);
    }
  }
  return updated;
}

/**
 * Adds or merges ingredients with existing ones.
 *
 * Merging behavior:
 * - If ingredient doesn't exist: adds it (with its note if present)
 * - If ingredient exists with same unit: merges quantities, preserves new note
 * - If ingredient exists with different unit: replaces it entirely
 *
 * Note handling: When merging quantities, the new ingredient's note takes
 * precedence. This allows scraped data to provide usage context.
 *
 * @param current - Current ingredient state
 * @param exactMatches - Validated ingredients to add or merge
 * @returns Updated ingredient state
 */
export function addOrMergeIngredientMatches(
  current: IngredientState,
  exactMatches: ingredientTableElement[]
): IngredientState {
  const updated = [...current];
  for (const ingredient of exactMatches) {
    const existingIndex = updated.findIndex(existing => namesMatch(existing.name, ingredient.name));

    if (existingIndex === -1) {
      updated.push(ingredient);
    } else {
      const existing = updated[existingIndex];
      if (existing && existing.name && existing.unit === ingredient.unit) {
        updated[existingIndex] = {
          ...ingredient,
          quantity: String(Number(existing.quantity || 0) + Number(ingredient.quantity || 0)),
          note: ingredient.note || existing.note,
        };
      } else {
        updated[existingIndex] = ingredient;
      }
    }
  }
  return updated;
}

/**
 * Replaces tags in array with exact matches by name.
 * Used by scraper validation to update form tags with database matches.
 */
export function replaceMatchingTags(
  current: tagTableElement[],
  exactMatches: tagTableElement[]
): tagTableElement[] {
  const updated = [...current];
  for (const tag of exactMatches) {
    const idx = updated.findIndex(e => namesMatch(e.name, tag.name));
    if (idx !== -1) {
      updated[idx] = tag;
    }
  }
  return updated;
}

/**
 * Adds tags that don't already exist in the array.
 * Used by OCR to add only non-duplicate tags.
 */
export function addNonDuplicateTags(
  current: tagTableElement[],
  tagsToAdd: tagTableElement[]
): tagTableElement[] {
  const updated = [...current];
  for (const tag of tagsToAdd) {
    const isDuplicate = updated.some(existing => namesMatch(existing.name, tag.name));
    if (!isDuplicate) {
      updated.push(tag);
    }
  }
  return updated;
}

/**
 * Processes tags for validation by filtering exact database matches
 * Returns exact matches and items that need validation separately
 *
 * @param tags - Array of tags to process
 * @param findSimilarTags - Function to find similar tags in database
 * @returns Object with exactMatches and needsValidation arrays
 */
export function processTagsForValidation(
  tags: tagTableElement[],
  findSimilarTags: (name: string) => tagTableElement[]
): {
  exactMatches: tagTableElement[];
  needsValidation: tagTableElement[];
} {
  const exactMatches: tagTableElement[] = [];
  const needsValidation: tagTableElement[] = [];

  for (const tag of tags) {
    const similarTags = findSimilarTags(tag.name);
    const exactMatch = similarTags.find(dbTag => namesMatch(dbTag.name, tag.name));

    if (exactMatch) {
      exactMatches.push(exactMatch);
    } else {
      needsValidation.push(tag);
    }
  }

  return { exactMatches, needsValidation };
}

/**
 * Processes ingredients for validation by filtering exact database matches.
 *
 * Returns exact matches (preserving scraped quantity/unit/note) and items
 * that need validation separately. Exact matches combine database metadata
 * with scraped recipe-specific data.
 *
 * Note: Ingredient names should already be cleaned (parenthetical content removed)
 * by parseIngredientString in RecipeScraperConverter before reaching this function.
 *
 * @param ingredients - Array of ingredients to process (can be partial for scraped data)
 * @param findSimilarIngredients - Function to find similar ingredients in database
 * @returns Object with exactMatches (with preserved notes) and needsValidation arrays
 */
export function processIngredientsForValidation(
  ingredients: FormIngredientElement[],
  findSimilarIngredients: (name: string) => ingredientTableElement[]
): {
  exactMatches: ingredientTableElement[];
  needsValidation: FormIngredientElement[];
} {
  const exactMatches: ingredientTableElement[] = [];
  const needsValidation: FormIngredientElement[] = [];

  for (const ingredient of ingredients) {
    if (!ingredient.name) {
      continue;
    }

    const ingredientName = ingredient.name;
    const similarIngredients = findSimilarIngredients(ingredientName);
    const exactMatch = similarIngredients.find(dbIng => namesMatch(dbIng.name, ingredientName));

    if (exactMatch) {
      const mergedIngredient: ingredientTableElement = {
        ...exactMatch,
        quantity: ingredient.quantity || exactMatch.quantity,
        unit: exactMatch.unit,
        note: ingredient.note,
      };
      exactMatches.push(mergedIngredient);
    } else {
      needsValidation.push(ingredient);
    }
  }

  return { exactMatches, needsValidation };
}
