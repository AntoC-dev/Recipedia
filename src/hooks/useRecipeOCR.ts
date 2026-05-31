/**
 * React hook for managing OCR (Optical Character Recognition) workflow in recipe forms.
 *
 * This hook provides comprehensive OCR functionality for extracting recipe data from images,
 * including modal state management, image processing, and automatic recipe field population
 * with validation support for ingredients and tags.
 *
 * @module useRecipeOCR
 */

import { useState } from 'react';
import { FormIngredientElement, nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { extractFieldFromImage, OcrModalTarget } from '@utils/OCR';
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
import { namesMatch } from '@utils/NutritionUtils';
import { parseQuantity } from '@utils/Quantity';
import { ocrLogger } from '@utils/logger';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';
import { useRecipeForm } from '@context/RecipeFormContext';
import { useRecipeTags } from '@hooks/useRecipeTags';
import { useRecipeIngredients } from '@hooks/useRecipeIngredients';

/**
 * Return value of the useRecipeOCR hook.
 *
 * Provides OCR state management, modal controls, image handling, and field extraction functionality.
 */
export interface UseRecipeOCRReturn {
  /** Currently active recipe field for OCR modal, or undefined if modal is closed */
  modalField: OcrModalTarget | undefined;
  /** Whether OCR extraction is currently in progress */
  isProcessingOcrExtraction: boolean;
  /** Opens the OCR modal for a specific recipe field */
  openModalForField: (field: OcrModalTarget) => void;
  /** Closes the OCR modal */
  closeModal: () => void;
  /** Extracts data from an image for a specific recipe field and updates recipe state */
  fillOneField: (uri: string, field: OcrModalTarget) => Promise<void>;
  /** Adds a new image URI to the available OCR images */
  addImageUri: (uri: string) => void;
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
 * The hook integrates with RecipeFormContext to access and update form state.
 * It uses useRecipeTags and useRecipeIngredients hooks for duplicate-safe additions.
 *
 * @returns OCR state, controls, and extraction functions
 *
 * @example
 * ```tsx
 * const {
 *   modalField,
 *   isProcessingOcrExtraction,
 *   openModalForField,
 *   closeModal,
 *   fillOneField,
 *   addImageUri,
 * } = useRecipeOCR();
 *
 * // Open OCR modal for title field
 * openModalForField('recipeTitle');
 *
 * // Process an image for title extraction
 * await fillOneField(imageUri, 'recipeTitle');
 * ```
 */
export function useRecipeOCR(): UseRecipeOCRReturn {
  const { setValidationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { addTagIfNotDuplicate } = useRecipeTags();
  const { addOrMergeIngredient } = useRecipeIngredients();
  const { findSimilarTags } = useTags();
  const { findSimilarIngredients } = useIngredients();

  const { recipePreparation, recipePersons, recipeTags, recipeIngredients } = state;
  const {
    setRecipeImage,
    setRecipeTitle,
    setRecipeDescription,
    setRecipePreparation,
    setRecipePersons,
    setRecipeTime,
    setRecipeIngredients,
    setRecipeNutrition,
    setImgForOCR,
  } = setters;
  const [modalField, setModalField] = useState<OcrModalTarget | undefined>(undefined);
  const [isProcessingOcrExtraction, setIsProcessingOcrExtraction] = useState(false);

  /**
   * Opens the OCR image selection modal for a specific recipe field.
   *
   * Sets the target field that will receive the extracted data when
   * the user selects and processes an image.
   *
   * @param field - The recipe field to extract data for
   */
  const openModalForField = (field: OcrModalTarget) => {
    setModalField(field);
  };

  /**
   * Closes the OCR image selection modal.
   *
   * Resets the modal field to undefined, hiding the image selection UI.
   */
  const closeModal = () => {
    setModalField(undefined);
  };

  /**
   * Adds a new image URI to the available OCR images list.
   *
   * Appends the URI to the existing list of images that can be used
   * for OCR extraction.
   *
   * @param uri - The URI of the image to add
   */
  const addImageUri = (uri: string) => {
    setImgForOCR(prev => [...prev, uri]);
  };

  const prepopulateIngredients = (items: FormIngredientElement[]) => {
    setRecipeIngredients(prev => addNonDuplicateByName(prev, items));
  };

  /**
   * Extracts data from an image for a specific recipe field and updates the form.
   *
   * Performs OCR extraction using ML Kit text recognition, then processes the
   * extracted data based on the target field type:
   * - Simple fields (title, description, image, time, persons): Direct update
   * - Tags: Filters duplicates, validates against database, queues similar matches
   * - Ingredients: Validates against database, merges quantities for duplicates
   * - Nutrition: Creates nutrition object with default values for missing fields
   * - Preparation: Directly replaces preparation steps
   *
   * @param uri - The image URI to extract data from
   * @param field - The recipe field type to extract
   */
  const fillOneField = async (uri: string, field: OcrModalTarget) => {
    setIsProcessingOcrExtraction(true);

    const newFieldData = await extractFieldFromImage(
      uri,
      field,
      {
        recipePreparation: recipePreparation,
        recipePersons: recipePersons,
        recipeIngredients: recipeIngredients,
        recipeTags: recipeTags,
      },
      msg => {
        ocrLogger.warn('OCR processing warning', { message: msg });
      }
    );

    if (newFieldData.recipeImage) {
      setRecipeImage(newFieldData.recipeImage);
    }
    if (newFieldData.recipeTitle) {
      setRecipeTitle(newFieldData.recipeTitle);
    }
    if (newFieldData.recipeDescription) {
      setRecipeDescription(newFieldData.recipeDescription);
    }
    if (newFieldData.recipeTags && newFieldData.recipeTags.length > 0) {
      const filteredTags = filterOutExistingTags(newFieldData.recipeTags, recipeTags);
      if (filteredTags.length > 0) {
        validateAndQueueTags(
          filteredTags,
          findSimilarTags,
          addTagIfNotDuplicate,
          setValidationQueue
        );
      }
    }
    if (newFieldData.recipePreparation) {
      setRecipePreparation(newFieldData.recipePreparation);
    }
    if (newFieldData.recipePersons) {
      setRecipePersons(newFieldData.recipePersons);
    }
    if (newFieldData.recipeTime) {
      setRecipeTime(newFieldData.recipeTime);
    }
    if (newFieldData.recipeIngredients && newFieldData.recipeIngredients.length > 0) {
      const ocrIngredients = newFieldData.recipeIngredients;
      prepopulateIngredients(ocrIngredients);
      validateAndQueueIngredients(
        ocrIngredients,
        findSimilarIngredients,
        match => {
          const original = ocrIngredients.find(ing => namesMatch(ing.name, match.name));
          addOrMergeIngredient({ ...match, quantity: original?.quantity || match.quantity });
        },
        setValidationQueue,
        { onValidated: (_, validatedIngredient) => addOrMergeIngredient(validatedIngredient) }
      );
    }
    if (newFieldData.ingredientNames !== undefined) {
      const ingredientsWithNoQuantity: FormIngredientElement[] = newFieldData.ingredientNames.map(
        ({ name, unit }) => ({ name, unit, quantity: '' })
      );
      if (ingredientsWithNoQuantity.length > 0) {
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
      }
    }
    if (newFieldData.ingredientQuantities !== undefined) {
      const quantities = newFieldData.ingredientQuantities.map(parseQuantity);
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
    }
    if (newFieldData.recipeNutrition) {
      const newNutrition: nutritionTableElement = {
        energyKcal: defaultValueNumber,
        energyKj: defaultValueNumber,
        fat: defaultValueNumber,
        saturatedFat: defaultValueNumber,
        carbohydrates: defaultValueNumber,
        sugars: defaultValueNumber,
        fiber: defaultValueNumber,
        protein: defaultValueNumber,
        salt: defaultValueNumber,
        portionWeight: defaultValueNumber,
      };

      for (const [key, value] of Object.entries(newFieldData.recipeNutrition)) {
        if (value !== undefined) {
          newNutrition[key as keyof nutritionTableElement] = value;
        }
      }

      setRecipeNutrition(newNutrition);
    }
    setIsProcessingOcrExtraction(false);
  };

  return {
    modalField,
    isProcessingOcrExtraction,
    openModalForField,
    closeModal,
    fillOneField,
    addImageUri,
  };
}
