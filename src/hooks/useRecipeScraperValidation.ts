/**
 * Hook for validating scraped recipe data on screen load.
 *
 * Triggers ValidationQueue for ingredients and tags from scraped recipes
 * that need user validation (not found in database). Pre-computes similarity
 * and handles exact matches before passing sorted items to the queue.
 *
 * @module useRecipeScraperValidation
 */

import { useEffect, useRef } from 'react';
import { recipeStateType } from '@customTypes/ScreenTypes';
import {
  deduplicateIngredientsByName,
  removeIngredientByName,
  removeTagByName,
  replaceMatchingTags,
  validateAndQueueIngredients,
  validateAndQueueTags,
} from '@utils/RecipeValidationHelpers';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useRecipeForm } from '@context/RecipeFormContext';
import { useRecipeIngredients } from '@hooks/useRecipeIngredients';
import { FormIngredientElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';

/**
 * Hook that triggers ValidationQueue for scraped recipe data.
 *
 * When the Recipe screen loads in 'addScrape' mode, this hook processes
 * all ingredients and tags, pre-computes similarity, handles exact matches,
 * and passes sorted items to the ValidationQueue.
 */
export function useRecipeScraperValidation(): void {
  const { setValidationQueue, validationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { replaceAllMatchingFormIngredients } = useRecipeIngredients();
  const { findSimilarTags, findSimilarIngredients } = useRecipeDatabase();

  const { stackMode, recipeIngredients, recipeTags } = state;
  const { setRecipeIngredients, setRecipeTags } = setters;

  const hasRunRef = useRef(false);
  const pendingIngredientsRef = useRef<FormIngredientElement[] | null>(null);

  const getIngredientItems = (): FormIngredientElement[] => {
    if (recipeIngredients.length === 0) {
      return [];
    }
    return deduplicateIngredientsByName(recipeIngredients as FormIngredientElement[]);
  };

  const startIngredientValidation = (ingredients: FormIngredientElement[]) => {
    validateAndQueueIngredients(
      ingredients,
      findSimilarIngredients,
      replaceAllMatchingFormIngredients,
      setValidationQueue,
      { onDismissed: item => setRecipeIngredients(prev => removeIngredientByName(prev, item.name)) }
    );
  };

  const startTagValidation = (tags: tagTableElement[]) => {
    validateAndQueueTags(
      tags,
      findSimilarTags,
      tag => setRecipeTags(prev => replaceMatchingTags(prev, [tag])),
      setValidationQueue,
      tag => setRecipeTags(prev => removeTagByName(prev, tag.name))
    );
  };

  useEffect(() => {
    if (validationQueue === null && pendingIngredientsRef.current) {
      const ingredients = pendingIngredientsRef.current;
      pendingIngredientsRef.current = null;
      startIngredientValidation(ingredients);
    }
  }, [validationQueue]);

  useEffect(() => {
    if (stackMode !== recipeStateType.addScrape || hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const ingredientItems = getIngredientItems();
    const tagItems = recipeTags.length > 0 ? [...recipeTags] : [];

    if (tagItems.length > 0) {
      if (ingredientItems.length > 0) {
        pendingIngredientsRef.current = ingredientItems;
      }
      startTagValidation(tagItems);
      return;
    }

    if (ingredientItems.length > 0) {
      startIngredientValidation(ingredientItems);
    }
  }, [stackMode]);
}
