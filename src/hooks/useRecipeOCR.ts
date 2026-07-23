/**
 * React hook for managing OCR (Optical Character Recognition) workflow in recipe forms.
 *
 * This hook provides comprehensive OCR functionality for extracting recipe data from images,
 * including modal state management, image processing, and automatic recipe field population
 * with validation support for ingredients and tags.
 *
 * @module useRecipeOCR
 */

import { useState, Dispatch, SetStateAction } from 'react';
import {
  FormIngredientElement,
  ingredientTableElement,
  nutritionTableElement,
  preparationStepElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  computeOcrFieldStatus,
  extractFieldFromImage,
  OcrFieldStatus,
  OcrModalTarget,
} from '@utils/OCR';
import {
  addNonDuplicateByName,
  addOrMergeIngredientMatches,
  filterOutExistingTags,
  processIngredientsForValidation,
  validateAndQueueIngredients,
  validateAndQueueTags,
} from '@utils/RecipeValidationHelpers';
import { useTags } from '@hooks/useTags';
import { useIngredients } from '@hooks/useIngredients';
import { defaultValueNumber } from '@utils/Constants';
import { emptyNutrition } from '@utils/NutritionUtils';
import { parseQuantity } from '@utils/Quantity';
import { ocrLogger } from '@utils/logger';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useFormContext } from 'react-hook-form';
import { makeFormSetter } from '@utils/recipeFormSetters';
import type { RecipeFormInput } from '@schemas/recipeFormSchema';
import { useRecipeTags } from '@hooks/useRecipeTags';
import { useRecipeIngredients } from '@hooks/useRecipeIngredients';

type OcrIngredientList = (ingredientTableElement | FormIngredientElement)[];

/**
 * Return value of the useRecipeOCR hook.
 *
 * The shared `RecipeFormScreen` owns the modal mount and the screen-local
 * image gallery, so the OCR hook only exposes the extraction trigger and a
 * loading flag. Modal open/close and gallery appends are handled by the body
 * (the slot only forwards `onSelectOcrField`).
 */
export interface UseRecipeOCRReturn {
  /** Whether OCR extraction is currently in progress */
  isProcessingOcrExtraction: boolean;
  /**
   * Extracts data from an image for a specific recipe field, updates recipe
   * state, and resolves with a non-blocking feedback status the caller can
   * surface as a snackbar.
   */
  fillOneField: (uri: string, field: OcrModalTarget) => Promise<OcrFieldStatus>;
}

/**
 * Hook for managing OCR workflow in recipe forms.
 *
 * This hook orchestrates the complete OCR process for recipe data extraction:
 * - Manages OCR modal state for selecting which field to extract
 * - Processes images using ML Kit text recognition
 * - Populates recipe fields with extracted data
 * - Handles validation queues for ingredients and tags with fuzzy matching
 * - Manages duplicate detection and merging for ingredients
 *
 * Reads the form via `useFormContext`. The screen-local image gallery and
 * modal mount live in `RecipeFormScreen`; the OCR hook only triggers
 * extraction and surfaces the in-flight flag.
 *
 * @returns OCR state and extraction trigger
 *
 * @example
 * ```tsx
 * const ocr = useRecipeOCR();
 *
 * // Process an image for title extraction
 * await ocr.fillOneField(imageUri, 'recipeTitle');
 * ```
 */
export function useRecipeOCR(): UseRecipeOCRReturn {
  const { setValidationQueue } = useRecipeDialogs();
  const form = useFormContext<RecipeFormInput>();
  const { addTagIfNotDuplicate } = useRecipeTags();
  const { addOrMergeIngredient } = useRecipeIngredients();
  const { findSimilarTags } = useTags();
  const { findSimilarIngredients } = useIngredients();

  // OCR writes are system-set, not user-edits: never mark the form dirty,
  // never mark fields touched. Inline row errors must only surface once the
  // user actually edits the row.
  const setRecipeIngredients = makeFormSetter(form, 'recipeIngredients', {
    shouldDirty: false,
    shouldTouch: false,
  }) as unknown as Dispatch<SetStateAction<OcrIngredientList>>;
  const [isProcessingOcrExtraction, setIsProcessingOcrExtraction] = useState(false);

  /**
   * Append OCR items to the form in scan order, skipping names already present.
   *
   * Does NOT mark rows touched — name-only inserts have empty quantities and
   * unresolved type/season, which are not user errors. Inline row errors
   * surface only after the user actually edits the row.
   */
  const prepopulateIngredients = (items: FormIngredientElement[]) => {
    setRecipeIngredients(prev => addNonDuplicateByName(prev, items));
  };

  // OCR writes never mark fields dirty or touched — see note on
  // `setRecipeIngredients` above. Validation runs on the next user edit
  // or on submit, whichever comes first.
  const ocrWriteOptions = { shouldDirty: false, shouldTouch: false };

  /**
   * Per-field OCR result handlers. Each consumes one slice of the
   * `extractFieldFromImage` response and applies it to the form. Splitting the
   * dispatcher into named handlers keeps `fillOneField` short and lets each
   * field's write semantics live next to a short, focused doc comment.
   */

  const writeImage = (value: string) => {
    form.setValue('recipeImage', value, ocrWriteOptions);
  };

  const writeTitle = (value: string) => {
    form.setValue('recipeTitle', value, ocrWriteOptions);
  };

  const writeDescription = (value: string) => {
    form.setValue('recipeDescription', value, ocrWriteOptions);
  };

  const writePreparation = (value: preparationStepElement[]) => {
    form.setValue('recipePreparation', value, ocrWriteOptions);
  };

  /** Numeric fields skip the sentinel `defaultValueNumber` and non-positive values. */
  const writePersons = (value: number) => {
    if (value === defaultValueNumber || value <= 0) return;
    form.setValue('recipePersons', value, ocrWriteOptions);
  };

  const writeTime = (value: number) => {
    if (value === defaultValueNumber || value <= 0) return;
    form.setValue('recipeTime', value, ocrWriteOptions);
  };

  const queueTags = (newTags: tagTableElement[], existingTags: tagTableElement[]) => {
    if (newTags.length === 0) return;
    const filteredTags = filterOutExistingTags(newTags, existingTags);
    if (filteredTags.length === 0) return;
    validateAndQueueTags(filteredTags, findSimilarTags, addTagIfNotDuplicate, setValidationQueue);
  };

  const queueIngredients = (ocrIngredients: FormIngredientElement[]) => {
    if (ocrIngredients.length === 0) return;
    const namePlaceholders = ocrIngredients.map(ing => ({ ...ing, quantity: '' }));
    prepopulateIngredients(namePlaceholders);
    validateAndQueueIngredients(
      ocrIngredients,
      findSimilarIngredients,
      match => {
        const original = ocrIngredients.find(
          ing => ing.name?.toLowerCase() === match.name.toLowerCase()
        );
        addOrMergeIngredient({ ...match, quantity: original?.quantity || match.quantity });
      },
      setValidationQueue,
      { onValidated: (_, validatedIngredient) => addOrMergeIngredient(validatedIngredient) }
    );
  };

  const queueIngredientNames = (names: { name: string; unit?: string }[]) => {
    const ingredientsWithNoQuantity: FormIngredientElement[] = names.map(({ name, unit }) => ({
      name,
      unit,
      quantity: '',
    }));
    if (ingredientsWithNoQuantity.length === 0) return;
    const { exactMatches, needsValidation } = processIngredientsForValidation(
      ingredientsWithNoQuantity,
      findSimilarIngredients
    );

    prepopulateIngredients(ingredientsWithNoQuantity);

    if (exactMatches.length > 0) {
      setRecipeIngredients(prev => addOrMergeIngredientMatches(prev, exactMatches));
    }

    if (needsValidation.length > 0) {
      setValidationQueue({
        type: 'Ingredient',
        items: needsValidation,
        onValidated: (_, validatedIngredient) => addOrMergeIngredient(validatedIngredient),
      });
    }
  };

  /**
   * Apply per-index OCR quantities onto the existing ingredient rows. Skips
   * rows whose quantity already matches and short-circuits when nothing
   * changed so React downstream consumers do not re-render.
   */
  const applyIngredientQuantities = (rawQuantities: string[]) => {
    const quantities = rawQuantities.map(parseQuantity);
    setRecipeIngredients(prev => {
      if (quantities.length !== prev.length) {
        ocrLogger.warn('Quantity count mismatch', {
          expected: prev.length,
          received: quantities.length,
        });
      }
      const limit = Math.min(prev.length, quantities.length);
      if (limit === 0) return prev;
      const next = prev.map((ingredient, index) =>
        index < limit && ingredient.quantity !== quantities[index]
          ? { ...ingredient, quantity: quantities[index] }
          : ingredient
      );
      return next.every((ing, i) => ing === prev[i]) ? prev : next;
    });
  };

  const writeNutrition = (partial: Partial<nutritionTableElement>) => {
    const newNutrition = emptyNutrition();
    for (const [key, value] of Object.entries(partial)) {
      if (value !== undefined) {
        newNutrition[key as keyof nutritionTableElement] = value;
      }
    }
    form.setValue('recipeNutrition', newNutrition, ocrWriteOptions);
  };

  /**
   * Extracts data from an image for a specific recipe field and updates the form.
   *
   * Performs OCR extraction using ML Kit text recognition, then dispatches the
   * extracted slices to the per-field handlers defined above. No global
   * `form.trigger()` is fired — validation runs on the next user edit or on
   * submit, whichever comes first.
   *
   * @param uri - The image URI to extract data from
   * @param field - The recipe field type to extract
   * @returns Feedback status (`empty` / `mismatch` / `success`) for the caller
   *   to surface a snackbar.
   */
  const fillOneField = async (uri: string, field: OcrModalTarget): Promise<OcrFieldStatus> => {
    ocrLogger.info('OCR extraction started', { field, uri });
    setIsProcessingOcrExtraction(true);
    try {
      const recipePreparation = (form.getValues('recipePreparation') ??
        []) as preparationStepElement[];
      const recipePersons = form.getValues('recipePersons');
      const recipeTags = (form.getValues('recipeTags') ?? []) as tagTableElement[];
      const recipeIngredients = (form.getValues('recipeIngredients') ?? []) as OcrIngredientList;

      const newFieldData = await extractFieldFromImage(
        uri,
        field,
        {
          recipePreparation,
          recipePersons,
          recipeIngredients,
          recipeTags,
        },
        msg => {
          ocrLogger.warn('OCR processing warning', { message: msg });
        }
      );

      ocrLogger.debug('OCR extraction returned', {
        field,
        extractedKeys: Object.keys(newFieldData),
        ingredientCount: newFieldData.recipeIngredients?.length ?? 0,
        ingredientNamesCount: newFieldData.ingredientNames?.length ?? 0,
        ingredientQuantitiesCount: newFieldData.ingredientQuantities?.length ?? 0,
        tagsCount: newFieldData.recipeTags?.length ?? 0,
      });

      if (newFieldData.recipeImage) writeImage(newFieldData.recipeImage);
      if (newFieldData.recipeTitle) writeTitle(newFieldData.recipeTitle);
      if (newFieldData.recipeDescription) writeDescription(newFieldData.recipeDescription);
      if (newFieldData.recipeTags) queueTags(newFieldData.recipeTags, recipeTags);
      if (newFieldData.recipePreparation) writePreparation(newFieldData.recipePreparation);
      if (newFieldData.recipePersons !== undefined) writePersons(newFieldData.recipePersons);
      if (newFieldData.recipeTime !== undefined) writeTime(newFieldData.recipeTime);
      if (newFieldData.recipeIngredients) queueIngredients(newFieldData.recipeIngredients);
      if (newFieldData.ingredientNames !== undefined) {
        queueIngredientNames(newFieldData.ingredientNames);
      }
      if (newFieldData.ingredientQuantities !== undefined) {
        applyIngredientQuantities(newFieldData.ingredientQuantities);
      }
      if (newFieldData.recipeNutrition) writeNutrition(newFieldData.recipeNutrition);

      const status = computeOcrFieldStatus(field, newFieldData, recipeIngredients.length);
      ocrLogger.info('OCR extraction completed', { field, status });
      return status;
    } catch (error) {
      ocrLogger.error('OCR extraction failed', {
        field,
        uri,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      setIsProcessingOcrExtraction(false);
    }
  };

  return {
    isProcessingOcrExtraction,
    fillOneField,
  };
}
