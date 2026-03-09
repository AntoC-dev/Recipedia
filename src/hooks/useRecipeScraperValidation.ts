/**
 * Hook for validating scraped recipe data on screen load.
 *
 * Triggers ValidationQueue for ingredients and tags from scraped recipes
 * that need user validation (not found in database).
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
} from '@utils/RecipeValidationHelpers';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useRecipeForm } from '@context/RecipeFormContext';
import { useRecipeIngredients } from '@hooks/useRecipeIngredients';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

/**
 * Hook that triggers ValidationQueue for scraped recipe data.
 *
 * When the Recipe screen loads in 'addScrape' mode, this hook processes
 * all ingredients and tags to determine which ones need user validation.
 * The ValidationQueue handles exact-match detection and similarity computation
 * internally, so raw items are passed directly.
 */
export function useRecipeScraperValidation(): void {
  const { setValidationQueue, validationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { replaceAllMatchingFormIngredients } = useRecipeIngredients();

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
    setValidationQueue({
      type: 'Ingredient',
      items: ingredients,
      onValidated: (_, validatedIngredient: ingredientTableElement) =>
        replaceAllMatchingFormIngredients(validatedIngredient),
      onDismissed: (item: FormIngredientElement) => {
        setRecipeIngredients(prev => removeIngredientByName(prev, item.name));
      },
    });
  };

  const startTagValidation = (tags: tagTableElement[]) => {
    setValidationQueue({
      type: 'Tag',
      items: tags,
      onValidated: (originalTag: tagTableElement, validatedTag: tagTableElement) => {
        setRecipeTags(prev => replaceMatchingTags(prev, [validatedTag]));
      },
      onDismissed: (tag: tagTableElement) => {
        setRecipeTags(prev => removeTagByName(prev, tag.name));
      },
    });
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
