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
import {
  deduplicateIngredientsByName,
  removeTagByName,
  replaceMatchingTags,
  validateAndQueueIngredients,
  validateAndQueueTags,
} from '@utils/RecipeValidationHelpers';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useFormContext } from 'react-hook-form';
import { makeFormSetter } from '@utils/recipeFormSetters';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useRecipeIngredients } from '@hooks/useRecipeIngredients';
import { validationLogger } from '@utils/logger';
import { markAllRecipeFieldsTouched } from '@utils/recipeFormErrors';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { useTags } from '@hooks/useTags';
import { useIngredients } from '@hooks/useIngredients';

type ScraperIngredientList = (ingredientTableElement | FormIngredientElement)[];

/**
 * Hook that triggers ValidationQueue for scraped recipe data.
 *
 * When the Recipe screen loads in 'addScrape' mode, this hook processes
 * all ingredients and tags, pre-computes similarity, handles exact matches,
 * and passes sorted items to the ValidationQueue.
 */
export function useRecipeScraperValidation(): void {
  const { setValidationQueue, validationQueue } = useRecipeDialogs();
  const form = useFormContext<RecipeFormInput>();
  const { replaceAllMatchingFormIngredients, removeMatchingFormIngredients } =
    useRecipeIngredients();
  const { findSimilarTags } = useTags();
  const { findSimilarIngredients } = useIngredients();

  const setRecipeTags = makeFormSetter(form, 'recipeTags');

  const hasRunRef = useRef(false);
  const pendingIngredientsRef = useRef<FormIngredientElement[] | null>(null);

  const getIngredientItems = (): FormIngredientElement[] => {
    const recipeIngredients = (form.getValues('recipeIngredients') ?? []) as ScraperIngredientList;
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
      { onDismissed: item => removeMatchingFormIngredients(item.name) }
    );
  };

  const startTagValidation = (tags: tagTableElement[]) => {
    validateAndQueueTags(
      tags,
      findSimilarTags,
      tag => setRecipeTags(prev => replaceMatchingTags(prev ?? [], [tag])),
      setValidationQueue,
      tag => setRecipeTags(prev => removeTagByName(prev ?? [], tag.name))
    );
  };

  useEffect(() => {
    if (validationQueue === null && pendingIngredientsRef.current) {
      const ingredients = pendingIngredientsRef.current;
      pendingIngredientsRef.current = null;
      startIngredientValidation(ingredients);
    }
  }, [validationQueue]);

  // Mount-once: this hook is only invoked from `RecipeAddScrape`, so the route
  // name already guarantees the addScrape mode. The ref guards re-mounts.
  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const ingredientItems = getIngredientItems();
    const recipeTags = (form.getValues('recipeTags') ?? []) as tagTableElement[];
    const tagItems = recipeTags.length > 0 ? [...recipeTags] : [];

    validationLogger.info('Scraper validation kicking off', {
      ingredientsToValidate: ingredientItems.length,
      tagsToValidate: tagItems.length,
    });

    // Scraped data is pre-populated via defaultValues, which bypasses field
    // blur events. Mark every field as touched and trigger a full-form
    // validation so missing or invalid fields surface as inline errors
    // immediately rather than only on submit (inline display is gated on
    // `fieldState.isTouched`).
    markAllRecipeFieldsTouched(form);
    void form.trigger();

    if (tagItems.length > 0) {
      if (ingredientItems.length > 0) {
        pendingIngredientsRef.current = ingredientItems;
      }
      validationLogger.debug('Starting tag validation queue (ingredients deferred)');
      startTagValidation(tagItems);
      return;
    }

    if (ingredientItems.length > 0) {
      validationLogger.debug('Starting ingredient validation queue');
      startIngredientValidation(ingredientItems);
    }
  }, []);
}
