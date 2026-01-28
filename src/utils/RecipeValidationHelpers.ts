import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { namesMatch } from '@utils/NutritionUtils';

export type IngredientState = (ingredientTableElement | FormIngredientElement)[];

/**
 * A tag that needs validation, with pre-computed similar items from the database.
 * Used by ValidationQueue to display appropriate dialog without re-querying.
 */
export type TagWithSimilarity = tagTableElement & {
  similarItems: tagTableElement[];
};

/**
 * An ingredient that needs validation, with pre-computed similar items from the database.
 * Used by ValidationQueue to display appropriate dialog without re-querying.
 */
export type IngredientWithSimilarity = FormIngredientElement & {
  similarItems: ingredientTableElement[];
};

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
 * Processes tags for validation by filtering exact database matches.
 *
 * Returns exact matches and items that need validation separately.
 * Items needing validation include their pre-computed similar items,
 * sorted so items WITHOUT similar matches come first (better UX: "add new" before "choose existing").
 *
 * @param tags - Array of tags to process
 * @param findSimilarTags - Function to find similar tags in database
 * @returns Object with exactMatches and needsValidation arrays (with similarity info)
 */
export function processTagsForValidation(
  tags: tagTableElement[],
  findSimilarTags: (name: string) => tagTableElement[]
): {
  exactMatches: tagTableElement[];
  needsValidation: TagWithSimilarity[];
} {
  const exactMatches: tagTableElement[] = [];
  const withoutSimilar: TagWithSimilarity[] = [];
  const withSimilar: TagWithSimilarity[] = [];

  for (const tag of tags) {
    const similarTags = findSimilarTags(tag.name);
    const exactMatch = similarTags.find(dbTag => namesMatch(dbTag.name, tag.name));

    if (exactMatch) {
      exactMatches.push(exactMatch);
    } else {
      const tagWithSimilarity: TagWithSimilarity = { ...tag, similarItems: similarTags };
      if (similarTags.length > 0) {
        withSimilar.push(tagWithSimilarity);
      } else {
        withoutSimilar.push(tagWithSimilarity);
      }
    }
  }

  return { exactMatches, needsValidation: [...withoutSimilar, ...withSimilar] };
}

/**
 * Processes ingredients for validation by filtering exact database matches.
 *
 * Returns exact matches (preserving scraped quantity/unit/note) and items
 * that need validation separately. Exact matches combine database metadata
 * with scraped recipe-specific data. Items needing validation include their
 * pre-computed similar items, sorted so items WITHOUT similar matches come first.
 *
 * Note: Ingredient names should already be cleaned (parenthetical content removed)
 * by parseIngredientString in RecipeScraperConverter before reaching this function.
 *
 * @param ingredients - Array of ingredients to process (can be partial for scraped data)
 * @param findSimilarIngredients - Function to find similar ingredients in database
 * @returns Object with exactMatches (with preserved notes) and needsValidation arrays (with similarity info)
 */
export function processIngredientsForValidation(
  ingredients: FormIngredientElement[],
  findSimilarIngredients: (name: string) => ingredientTableElement[]
): {
  exactMatches: ingredientTableElement[];
  needsValidation: IngredientWithSimilarity[];
} {
  const exactMatches: ingredientTableElement[] = [];
  const withoutSimilar: IngredientWithSimilarity[] = [];
  const withSimilar: IngredientWithSimilarity[] = [];

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
      const ingredientWithSimilarity: IngredientWithSimilarity = {
        ...ingredient,
        similarItems: similarIngredients,
      };
      if (similarIngredients.length > 0) {
        withSimilar.push(ingredientWithSimilarity);
      } else {
        withoutSimilar.push(ingredientWithSimilarity);
      }
    }
  }

  return { exactMatches, needsValidation: [...withoutSimilar, ...withSimilar] };
}

/**
 * Deduplicates ingredients by name for the validation queue.
 *
 * When the same ingredient name appears multiple times, this function:
 * - Keeps the first occurrence's data (unit, note, similarItems if present)
 * - If duplicates have the same unit, sums their quantities
 * - If units differ, keeps only the first occurrence
 *
 * @param ingredients - Array of form ingredients to deduplicate (may include similarity info)
 * @returns Deduplicated array with quantities summed where applicable
 */
export function deduplicateIngredientsByName<T extends FormIngredientElement>(
  ingredients: T[]
): T[] {
  const seen = new Map<string, T>();

  for (const ing of ingredients) {
    const key = ing.name?.toLowerCase() || '';
    if (!key) continue;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...ing });
    } else if (existing.unit === ing.unit) {
      const sum = Number(existing.quantity || 0) + Number(ing.quantity || 0);
      existing.quantity = isNaN(sum) ? existing.quantity : String(sum);
    }
  }

  return Array.from(seen.values());
}
