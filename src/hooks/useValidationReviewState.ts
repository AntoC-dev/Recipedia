/**
 * useValidationReviewState - Per-item resolution state for bulk import validation
 *
 * Manages the review state for each tag and ingredient needing validation.
 * Provides sorted items (unknown first, with-suggestion next, resolved last),
 * batch actions, and similarity re-check after adding new items.
 *
 * @module hooks/useValidationReviewState
 */

import React, { useState } from 'react';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  IngredientReviewItem,
  IngredientWithSimilarity,
  ResolutionMappings,
  ReviewItemState,
  TagReviewItem,
  TagWithSimilarity,
  ValidationResolution,
} from '@customTypes/ValidationTypes';
import {
  computeIngredientSimilarity,
  computeTagSimilarity,
  mergeIngredient,
  sortAlphabetically,
} from '@utils/RecipeValidationHelpers';
import { cleanIngredientName, namesMatch, normalizeKey } from '@utils/NutritionUtils';
import { buildItemIndex, ITEM_FUZZY, ItemSearchIndex, searchItemsFuzzy } from '@utils/FuzzyIndex';

/** Return value of the useValidationReviewState hook */
export interface UseValidationReviewStateReturn {
  tags: TagReviewItem[];
  ingredients: IngredientReviewItem[];
  allResolved: boolean;
  resolveTag: (itemName: string, resolution: ValidationResolution) => void;
  resolveIngredient: (itemName: string, resolution: ValidationResolution) => void;
  skipTag: (itemName: string) => void;
  skipIngredient: (itemName: string) => void;
  undoTag: (itemName: string) => void;
  undoIngredient: (itemName: string) => void;
  getResolutionMappings: () => ResolutionMappings;
}

function makeKey(type: 'Tag' | 'Ingredient', name: string): string {
  return `${type}:${normalizeKey(name)}`;
}

/**
 * Refreshes a single item's `similarItems` against the current finder result.
 * Filters out the item itself so a previously-added DB entry with the same
 * name doesn't suggest itself.
 */
export function refreshSimilarityFor<
  TItem extends { name?: string; similarItems: TMatch[] },
  TMatch extends { name: string },
>(
  setItems: React.Dispatch<React.SetStateAction<TItem[]>>,
  finder: (name: string) => TMatch[],
  itemName: string
) {
  setItems(prev => {
    const idx = prev.findIndex(item => item.name !== undefined && namesMatch(item.name, itemName));
    if (idx === -1) return prev;
    const target = prev[idx];
    const targetName = target.name as string;
    const newSimilar = finder(targetName).filter(s => !namesMatch(s.name, targetName));
    const next = [...prev];
    next[idx] = { ...target, similarItems: newSimilar };
    return next;
  });
}

/**
 * Hook for managing per-item validation review state
 *
 * Accepts raw items from BatchValidationState and computes similarity on init.
 * Provides sorted items, batch actions, and similarity re-check after "Add New".
 *
 * @param rawTags - Tags needing validation (from BatchValidationState)
 * @param rawIngredients - Ingredients needing validation (from BatchValidationState)
 * @param findSimilarTags - Database lookup for computing and re-checking similarity
 * @param findSimilarIngredients - Database lookup for computing and re-checking similarity
 * @returns Review state with sorted items, actions, and resolution mappings
 */
export function useValidationReviewState(
  rawTags: tagTableElement[],
  rawIngredients: FormIngredientElement[],
  findSimilarTags: (name: string) => tagTableElement[],
  findSimilarIngredients: (name: string) => ingredientTableElement[]
): UseValidationReviewStateReturn {
  const [stateMap, setStateMap] = useState<Map<string, ReviewItemState>>(() => {
    const map = new Map<string, ReviewItemState>();
    for (const tag of rawTags) {
      map.set(makeKey('Tag', tag.name), { status: 'pending' });
    }
    for (const ing of rawIngredients) {
      if (ing.name) {
        map.set(makeKey('Ingredient', ing.name), { status: 'pending' });
      }
    }
    return map;
  });

  const [tagItems, setTagItems] = useState<TagWithSimilarity[]>(() =>
    computeTagSimilarity(rawTags, findSimilarTags)
  );
  const [ingredientItems, setIngredientItems] = useState<IngredientWithSimilarity[]>(() =>
    computeIngredientSimilarity(rawIngredients, findSimilarIngredients)
  );

  const [pendingTagsIndex] = useState<ItemSearchIndex<tagTableElement>>(() =>
    buildItemIndex(rawTags, { fuzzy: ITEM_FUZZY, getName: t => t.name })
  );
  const [pendingIngredientsIndex] = useState<
    ItemSearchIndex<FormIngredientElement & { name: string }>
  >(() =>
    buildItemIndex(
      rawIngredients.filter((i): i is FormIngredientElement & { name: string } => !!i.name),
      { fuzzy: ITEM_FUZZY, getName: i => i.name, preprocess: cleanIngredientName }
    )
  );

  const getState = (type: 'Tag' | 'Ingredient', name: string): ReviewItemState => {
    return stateMap.get(makeKey(type, name)) ?? { status: 'pending' };
  };

  const tags: TagReviewItem[] = sortAlphabetically(
    tagItems.map(tag => ({ ...tag, reviewState: getState('Tag', tag.name) }))
  );

  const ingredients: IngredientReviewItem[] = sortAlphabetically(
    ingredientItems
      .filter((ing): ing is IngredientWithSimilarity & { name: string } => ing.name !== undefined)
      .map(ing => ({
        ...ing,
        reviewState: getState('Ingredient', ing.name),
      }))
  );

  const allResolved =
    tags.length + ingredients.length > 0 &&
    tags.every(t => t.reviewState.status !== 'pending') &&
    ingredients.every(i => i.reviewState.status !== 'pending');

  function autoResolveAgainst<TItem extends { name?: string }, TMatch extends { name: string }>(
    type: 'Tag' | 'Ingredient',
    items: TItem[],
    addedItem: TMatch,
    buildResolvedItem: (item: TItem, match: TMatch) => ValidationResolution['resolvedItem']
  ) {
    const updates = new Map<string, ReviewItemState>();
    for (const item of items) {
      if (!item.name) continue;
      if (!namesMatch(item.name, addedItem.name)) continue;
      const key = makeKey(type, item.name);
      const state = stateMap.get(key);
      if (state && state.status !== 'pending') continue;
      updates.set(key, {
        status: 'resolved',
        resolution: { type: 'add-new', resolvedItem: buildResolvedItem(item, addedItem) },
      });
    }
    if (updates.size === 0) return;
    setStateMap(prevMap => {
      const merged = new Map(prevMap);
      for (const [k, v] of updates) merged.set(k, v);
      return merged;
    });
  }

  function appendSimilarityAgainst<
    TItem extends { name?: string; similarItems: TMatch[] },
    TMatch extends { name: string },
  >(
    type: 'Tag' | 'Ingredient',
    setItems: React.Dispatch<React.SetStateAction<TItem[]>>,
    index: ItemSearchIndex<{ name: string }>,
    addedItem: TMatch
  ) {
    const matches = searchItemsFuzzy(index, addedItem.name);
    if (matches.length === 0) return;
    const matchedKeys = new Set(matches.map(m => normalizeKey(m.name)));
    matchedKeys.delete(normalizeKey(addedItem.name));
    if (matchedKeys.size === 0) return;

    setItems(prev => {
      let changed = false;
      const next = prev.map(item => {
        if (!item.name) return item;
        if (!matchedKeys.has(normalizeKey(item.name))) return item;
        const state = stateMap.get(makeKey(type, item.name));
        if (state && state.status !== 'pending') return item;
        if (item.similarItems.some(s => namesMatch(s.name, addedItem.name))) return item;
        changed = true;
        return { ...item, similarItems: [...item.similarItems, addedItem] };
      });
      return changed ? next : prev;
    });
  }

  const resolveTag = (itemName: string, resolution: ValidationResolution) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Tag', itemName), { status: 'resolved', resolution });
      return next;
    });

    if (resolution.type === 'add-new') {
      const addedTag = resolution.resolvedItem as tagTableElement;
      autoResolveAgainst('Tag', tagItems, addedTag, (_, match) => match);
      appendSimilarityAgainst('Tag', setTagItems, pendingTagsIndex, addedTag);
    }
  };

  const resolveIngredient = (itemName: string, resolution: ValidationResolution) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Ingredient', itemName), { status: 'resolved', resolution });
      return next;
    });

    if (resolution.type === 'add-new') {
      const addedIng = resolution.resolvedItem as ingredientTableElement;
      autoResolveAgainst('Ingredient', ingredientItems, addedIng, (ing, match) =>
        mergeIngredient(ing, match)
      );
      appendSimilarityAgainst('Ingredient', setIngredientItems, pendingIngredientsIndex, addedIng);
    }
  };

  const skipTag = (itemName: string) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Tag', itemName), { status: 'skipped' });
      return next;
    });
  };

  const skipIngredient = (itemName: string) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Ingredient', itemName), { status: 'skipped' });
      return next;
    });
  };

  const undoTag = (itemName: string) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Tag', itemName), { status: 'pending' });
      return next;
    });
    refreshSimilarityFor(setTagItems, findSimilarTags, itemName);
  };

  const undoIngredient = (itemName: string) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Ingredient', itemName), { status: 'pending' });
      return next;
    });
    refreshSimilarityFor(setIngredientItems, findSimilarIngredients, itemName);
  };

  const getResolutionMappings = (): ResolutionMappings => {
    const tagMappings = new Map<string, tagTableElement>();
    const ingredientMappings = new Map<string, ingredientTableElement>();

    for (const tag of tags) {
      if (tag.reviewState.status === 'resolved' && tag.reviewState.resolution) {
        tagMappings.set(
          normalizeKey(tag.name),
          tag.reviewState.resolution.resolvedItem as tagTableElement
        );
      }
    }

    for (const ing of ingredients) {
      if (ing.reviewState.status === 'resolved' && ing.reviewState.resolution && ing.name) {
        ingredientMappings.set(
          normalizeKey(ing.name),
          ing.reviewState.resolution.resolvedItem as ingredientTableElement
        );
      }
    }

    return { tagMappings, ingredientMappings };
  };

  return {
    tags,
    ingredients,
    allResolved,
    resolveTag,
    resolveIngredient,
    skipTag,
    skipIngredient,
    undoTag,
    undoIngredient,
    getResolutionMappings,
  };
}
