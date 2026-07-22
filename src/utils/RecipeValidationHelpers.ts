/**
 * Pure helper functions for the recipe import validation pipeline.
 *
 * Covers ingredient and tag list manipulation (merging, deduplication, filtering,
 * replacement) as well as the higher-level orchestration functions that split
 * items into exact database matches and fuzzy-match queues requiring user review.
 *
 * All functions are side-effect-free and return new arrays; none mutate their
 * inputs.
 *
 * @module RecipeValidationHelpers
 */

import {
  FormIngredientElement,
  ingredientTableElement,
  TagDraft,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { IngredientWithSimilarity, TagWithSimilarity } from '@customTypes/ValidationTypes';
import { namesMatch, normalizeKey } from '@utils/NutritionUtils';

/**
 * Mutable ingredient list that may contain a mix of fully validated database
 * records and partial form entries produced by OCR or web scraping.
 */
export type IngredientState = (ingredientTableElement | FormIngredientElement)[];

/**
 * Returns the sum of two numeric quantity strings, or the non-empty side when
 * one is missing/empty. Falls back to `incoming` when at least one side is
 * non-numeric.
 */
export function mergeQuantities(
  existing: string | undefined,
  incoming: string | undefined
): string {
  const a = (existing ?? '').trim();
  const b = (incoming ?? '').trim();
  if (!a) return b;
  if (!b) return a;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return String(na + nb);
  return b;
}

/**
 * Merges an original ingredient from import with a validated database ingredient.
 * Preserves the original quantity and note while using the validated ingredient's metadata.
 *
 * @param original - The ingredient from the import source
 * @param validated - The matched ingredient from the database
 * @returns A merged ingredient element
 */
export function mergeIngredient(
  original: FormIngredientElement,
  validated: ingredientTableElement
): ingredientTableElement {
  return {
    ...validated,
    quantity: original.quantity || validated.quantity,
    unit: validated.unit,
    note: original.note,
  };
}

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
export function removeTagByName(tags: TagDraft[], nameToRemove: string): TagDraft[] {
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
          quantity: mergeQuantities(existing.quantity, ingredient.quantity),
          note: ingredient.note || existing.note,
        };
      } else {
        updated[existingIndex] = {
          ...ingredient,
          quantity: ingredient.quantity || existing?.quantity || '',
        };
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
  current: TagDraft[],
  exactMatches: tagTableElement[]
): TagDraft[] {
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
 * Appends items whose name doesn't already exist in `current`, comparing
 * by `namesMatch` (lowercase + NFC + whitespace normalize).
 */
export function addNonDuplicateByName<T extends { name?: string }>(
  current: T[],
  itemsToAdd: T[]
): T[] {
  const updated = [...current];
  for (const item of itemsToAdd) {
    if (!item.name) continue;
    if (updated.some(existing => namesMatch(existing.name, item.name))) continue;
    updated.push(item);
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
  tags: TagDraft[],
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
      exactMatches.push({
        ...exactMatch,
        quantity: ingredient.quantity || exactMatch.quantity || '',
        unit: exactMatch.unit,
        note: ingredient.note,
      });
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
    if (!ing.name) continue;
    const key = normalizeKey(ing.name);

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...ing });
    } else if (existing.unit === ing.unit) {
      existing.quantity = mergeQuantities(existing.quantity, ing.quantity);
    }
  }

  return Array.from(seen.values());
}

/**
 * Configuration object passed to the validation queue for tag items that
 * require user review.
 */
interface TagQueueConfig {
  type: 'Tag';
  items: TagWithSimilarity[];
  onValidated: (original: TagWithSimilarity, validated: tagTableElement) => void;
  onDismissed?: (tag: TagWithSimilarity) => void;
}

/**
 * Configuration object passed to the validation queue for ingredient items
 * that require user review.
 */
interface IngredientQueueConfig {
  type: 'Ingredient';
  items: IngredientWithSimilarity[];
  onValidated: (original: IngredientWithSimilarity, validated: ingredientTableElement) => void;
  onDismissed?: (ingredient: IngredientWithSimilarity) => void;
}

/**
 * Pre-computes tag similarity, handles exact matches immediately, and queues fuzzy matches.
 *
 * Orchestrates the full tag validation flow:
 * 1. Runs `processTagsForValidation` to separate exact vs fuzzy matches
 * 2. Calls `onMatch` for each exact match (adds them directly)
 * 3. Queues remaining fuzzy matches for user validation via `setQueue`
 *
 * The `onMatch` callback is reused as `onValidated` in the queue — when a user
 * confirms a fuzzy match, it's treated the same as an exact match.
 *
 * @param tags - Tags to validate against the database
 * @param findSimilarTags - Database lookup function for fuzzy tag matching
 * @param onMatch - Callback for exact matches and validated fuzzy matches
 * @param setQueue - Setter for the validation queue (from RecipeDialogsContext)
 * @param onDismissed - Optional callback when user dismisses a tag from the queue
 */
export function validateAndQueueTags(
  tags: tagTableElement[],
  findSimilarTags: (name: string) => tagTableElement[],
  onMatch: (tag: tagTableElement) => void,
  setQueue: (config: TagQueueConfig) => void,
  onDismissed?: (tag: TagWithSimilarity) => void
): void {
  const { exactMatches, needsValidation } = processTagsForValidation(tags, findSimilarTags);
  for (const match of exactMatches) {
    onMatch(match);
  }
  if (needsValidation.length > 0) {
    setQueue({
      type: 'Tag',
      items: needsValidation,
      onValidated: (_, validatedTag) => onMatch(validatedTag),
      onDismissed,
    });
  }
}

/**
 * Pre-computes ingredient similarity, handles exact matches immediately, and queues fuzzy matches.
 *
 * Orchestrates the full ingredient validation flow:
 * 1. Runs `processIngredientsForValidation` to separate exact vs fuzzy matches
 * 2. Calls `onExactMatch` for each exact match (adds/merges them directly)
 * 3. Queues remaining fuzzy matches for user validation via `setQueue`
 *
 * If `options.onValidated` is not provided, defaults to calling `onExactMatch`
 * with the validated ingredient — suitable when exact and fuzzy matches are handled identically.
 *
 * @param ingredients - Ingredients to validate against the database
 * @param findSimilarIngredients - Database lookup function for fuzzy ingredient matching
 * @param onExactMatch - Callback for exact database matches
 * @param setQueue - Setter for the validation queue (from RecipeDialogsContext)
 * @param options - Optional callbacks for validated and dismissed items
 */
export function validateAndQueueIngredients(
  ingredients: FormIngredientElement[],
  findSimilarIngredients: (name: string) => ingredientTableElement[],
  onExactMatch: (ingredient: ingredientTableElement) => void,
  setQueue: (config: IngredientQueueConfig) => void,
  options?: {
    onValidated?: IngredientQueueConfig['onValidated'];
    onDismissed?: IngredientQueueConfig['onDismissed'];
  }
): void {
  const { exactMatches, needsValidation } = processIngredientsForValidation(
    ingredients,
    findSimilarIngredients
  );
  for (const match of exactMatches) {
    onExactMatch(match);
  }
  if (needsValidation.length > 0) {
    setQueue({
      type: 'Ingredient',
      items: needsValidation,
      onValidated: options?.onValidated ?? ((_, validated) => onExactMatch(validated)),
      onDismissed: options?.onDismissed,
    });
  }
}

/**
 * Sorts items alphabetically by name using locale-aware comparison
 *
 * @param items - Array of items with optional name field
 * @returns New sorted array
 */
export function sortAlphabetically<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
}

/**
 * Computes initial similarity for raw tags, excluding exact-name matches
 *
 * @param tags - Raw tags to enrich with similarity info
 * @param findSimilarTags - Database lookup function
 * @returns Tags with pre-computed similar items
 */
export function computeTagSimilarity(
  tags: TagDraft[],
  findSimilarTags: (name: string) => tagTableElement[]
): TagWithSimilarity[] {
  return tags.map(tag => ({
    ...tag,
    similarItems: findSimilarTags(tag.name).filter(s => !namesMatch(s.name, tag.name)),
  }));
}

/**
 * Computes initial similarity for raw ingredients, excluding exact-name matches
 *
 * @param ingredients - Raw form ingredients to enrich with similarity info
 * @param findSimilarIngredients - Database lookup function
 * @returns Ingredients with pre-computed similar items (unnamed ingredients skipped)
 */
export function computeIngredientSimilarity(
  ingredients: FormIngredientElement[],
  findSimilarIngredients: (name: string) => ingredientTableElement[]
): IngredientWithSimilarity[] {
  return ingredients
    .filter(ing => !!ing.name)
    .map(ing => ({
      ...ing,
      similarItems: findSimilarIngredients(ing.name!).filter(s => !namesMatch(s.name, ing.name!)),
    }));
}
