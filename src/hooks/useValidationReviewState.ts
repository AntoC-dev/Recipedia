/**
 * useValidationReviewState - Per-item resolution state for bulk import validation
 *
 * Manages the review state for each tag and ingredient needing validation.
 * Provides sorted items (unknown first, with-suggestion next, resolved last),
 * batch actions, and similarity re-check after adding new items.
 *
 * @module hooks/useValidationReviewState
 */

import { useState } from 'react';
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
import { namesMatch, normalizeKey } from '@utils/NutritionUtils';

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

/**
 * Builds a map key for a review item
 */
function makeKey(type: 'Tag' | 'Ingredient', name: string): string {
  return `${type}:${normalizeKey(name)}`;
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

  const getState = (type: 'Tag' | 'Ingredient', name: string): ReviewItemState => {
    return stateMap.get(makeKey(type, name)) ?? { status: 'pending' };
  };

  const tags: TagReviewItem[] = sortAlphabetically(
    tagItems.map(tag => ({ ...tag, reviewState: getState('Tag', tag.name) }))
  );

  const ingredients: IngredientReviewItem[] = sortAlphabetically(
    ingredientItems.map(ing => ({
      ...ing,
      reviewState: getState('Ingredient', ing.name!),
    }))
  );

  const allResolved =
    tags.length + ingredients.length > 0 &&
    tags.every(t => t.reviewState.status !== 'pending') &&
    ingredients.every(i => i.reviewState.status !== 'pending');

  const recheckTagSimilarity = () => {
    setTagItems(prev =>
      prev.map(tag => {
        const state = stateMap.get(makeKey('Tag', tag.name));
        if (state && state.status !== 'pending') return tag;
        const newSimilar = findSimilarTags(tag.name);
        return { ...tag, similarItems: newSimilar };
      })
    );
  };

  const recheckIngredientSimilarity = () => {
    setIngredientItems(prev =>
      prev.map(ing => {
        if (!ing.name) return ing;
        const state = stateMap.get(makeKey('Ingredient', ing.name));
        if (state && state.status !== 'pending') return ing;
        const newSimilar = findSimilarIngredients(ing.name);
        return { ...ing, similarItems: newSimilar };
      })
    );
  };

  const autoResolveExactMatches = (type: 'Tag' | 'Ingredient') => {
    if (type === 'Tag') {
      setTagItems(prev => {
        const updates = new Map<string, ReviewItemState>();
        const updatedTags = prev.map(tag => {
          const key = makeKey('Tag', tag.name);
          const state = stateMap.get(key);
          if (state && state.status !== 'pending') return tag;

          const newSimilar = findSimilarTags(tag.name);
          const exactMatch = newSimilar.find(s => namesMatch(s.name, tag.name));
          if (exactMatch) {
            updates.set(key, {
              status: 'resolved',
              resolution: { type: 'add-new', resolvedItem: exactMatch },
            });
          }
          return { ...tag, similarItems: newSimilar };
        });

        if (updates.size > 0) {
          setStateMap(prev => {
            const next = new Map(prev);
            for (const [k, v] of updates) {
              next.set(k, v);
            }
            return next;
          });
        }
        return updatedTags;
      });
    } else {
      setIngredientItems(prev => {
        const updates = new Map<string, ReviewItemState>();
        const updatedIngs = prev.map(ing => {
          if (!ing.name) return ing;
          const key = makeKey('Ingredient', ing.name);
          const state = stateMap.get(key);
          if (state && state.status !== 'pending') return ing;

          const newSimilar = findSimilarIngredients(ing.name);
          const exactMatch = newSimilar.find(s => namesMatch(s.name, ing.name!));
          if (exactMatch) {
            updates.set(key, {
              status: 'resolved',
              resolution: {
                type: 'add-new',
                resolvedItem: mergeIngredient(ing, exactMatch),
              },
            });
          }
          return { ...ing, similarItems: newSimilar };
        });

        if (updates.size > 0) {
          setStateMap(prev => {
            const next = new Map(prev);
            for (const [k, v] of updates) {
              next.set(k, v);
            }
            return next;
          });
        }
        return updatedIngs;
      });
    }
  };

  const resolveTag = (itemName: string, resolution: ValidationResolution) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Tag', itemName), { status: 'resolved', resolution });
      return next;
    });

    if (resolution.type === 'add-new') {
      autoResolveExactMatches('Tag');
    }
  };

  const resolveIngredient = (itemName: string, resolution: ValidationResolution) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Ingredient', itemName), { status: 'resolved', resolution });
      return next;
    });

    if (resolution.type === 'add-new') {
      autoResolveExactMatches('Ingredient');
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
    recheckTagSimilarity();
  };

  const undoIngredient = (itemName: string) => {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(makeKey('Ingredient', itemName), { status: 'pending' });
      return next;
    });
    recheckIngredientSimilarity();
  };

  const getResolutionMappings = (): {
    tagMappings: Map<string, tagTableElement>;
    ingredientMappings: Map<string, ingredientTableElement>;
  } => {
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
