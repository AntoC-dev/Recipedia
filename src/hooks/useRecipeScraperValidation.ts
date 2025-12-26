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
  processIngredientsForValidation,
  processTagsForValidation,
  removeIngredientByName,
  removeTagByName,
  replaceMatchingIngredients,
  replaceMatchingTags,
} from '@utils/RecipeValidationHelpers';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useRecipeForm } from '@context/RecipeFormContext';
import { useRecipeTags } from '@hooks/useRecipeTags';
import { useRecipeIngredients } from '@hooks/useRecipeIngredients';
import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';

/**
 * Hook that triggers ValidationQueue for scraped recipe data.
 *
 * When the Recipe screen loads in 'addScrape' mode, this hook processes
 * all ingredients and tags to determine which ones need user validation.
 * Items found in the database are auto-added, while unknown items are
 * queued for validation.
 */
export function useRecipeScraperValidation(): void {
  const { findSimilarTags, findSimilarIngredients } = useRecipeDatabase();
  const { setValidationQueue, validationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { addTagIfNotDuplicate } = useRecipeTags();
  const { replaceAllMatchingFormIngredients } = useRecipeIngredients();

  const { stackMode, recipeIngredients, recipeTags } = state;
  const { setRecipeIngredients, setRecipeTags } = setters;

  const hasRunRef = useRef(false);
  const pendingIngredientsRef = useRef<FormIngredientElement[] | null>(null);

  const getIngredientsNeedingValidation = (): FormIngredientElement[] => {
    if (recipeIngredients.length === 0) {
      return [];
    }
    const formIngredients = recipeIngredients as FormIngredientElement[];
    const { exactMatches, needsValidation } = processIngredientsForValidation(
      formIngredients,
      findSimilarIngredients
    );

    if (exactMatches.length > 0) {
      setRecipeIngredients(prev => replaceMatchingIngredients(prev, exactMatches));
    }

    return deduplicateIngredientsByName(needsValidation);
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

  const getTagsNeedingValidation = () => {
    if (recipeTags.length === 0) return [];

    const { exactMatches, needsValidation } = processTagsForValidation(recipeTags, findSimilarTags);

    if (exactMatches.length > 0) {
      setRecipeTags(prev => replaceMatchingTags(prev, exactMatches));
    }

    return needsValidation;
  };

  const startTagValidation = (tags: typeof recipeTags) => {
    setValidationQueue({
      type: 'Tag',
      items: tags,
      onValidated: (_, validatedTag) => addTagIfNotDuplicate(validatedTag),
      onDismissed: tag => {
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

    const ingredientsNeedingValidation = getIngredientsNeedingValidation();
    const tagsNeedingValidation = getTagsNeedingValidation();

    if (tagsNeedingValidation.length > 0) {
      if (ingredientsNeedingValidation.length > 0) {
        pendingIngredientsRef.current = ingredientsNeedingValidation;
      }
      startTagValidation(tagsNeedingValidation);
      return;
    }

    if (ingredientsNeedingValidation.length > 0) {
      startIngredientValidation(ingredientsNeedingValidation);
    }
  }, [stackMode]);
}
