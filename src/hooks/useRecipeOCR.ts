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
import { nutritionTableElement, recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { extractFieldFromImage } from '@utils/OCR';
import {
  processIngredientsForValidation,
  processTagsForValidation,
} from '@utils/RecipeValidationHelpers';
import { defaultValueNumber } from '@utils/Constants';
import { ocrLogger } from '@utils/logger';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
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
  modalField: recipeColumnsNames | undefined;
  /** Whether OCR extraction is currently in progress */
  isProcessingOcrExtraction: boolean;
  /** Opens the OCR modal for a specific recipe field */
  openModalForField: (field: recipeColumnsNames) => void;
  /** Closes the OCR modal */
  closeModal: () => void;
  /** Extracts data from an image for a specific recipe field and updates recipe state */
  fillOneField: (uri: string, field: recipeColumnsNames) => Promise<void>;
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
  const { findSimilarTags, findSimilarIngredients } = useRecipeDatabase();
  const { setValidationQueue } = useRecipeDialogs();
  const { state, setters } = useRecipeForm();
  const { addTagIfNotDuplicate } = useRecipeTags();
  const { addOrMergeIngredient } = useRecipeIngredients();

  const { recipePreparation, recipePersons, recipeTags, recipeIngredients } = state;
  const {
    setRecipeImage,
    setRecipeTitle,
    setRecipeDescription,
    setRecipeTags,
    setRecipePreparation,
    setRecipePersons,
    setRecipeTime,
    setRecipeIngredients,
    setRecipeNutrition,
    setImgForOCR,
  } = setters;
  const [modalField, setModalField] = useState<recipeColumnsNames | undefined>(undefined);
  const [isProcessingOcrExtraction, setIsProcessingOcrExtraction] = useState(false);

  /**
   * Opens the OCR image selection modal for a specific recipe field.
   *
   * Sets the target field that will receive the extracted data when
   * the user selects and processes an image.
   *
   * @param field - The recipe field to extract data for
   */
  const openModalForField = (field: recipeColumnsNames) => {
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
  const fillOneField = async (uri: string, field: recipeColumnsNames) => {
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
      const filteredTags = newFieldData.recipeTags.filter(
        newTag =>
          !recipeTags.some(existing => existing.name.toLowerCase() === newTag.name.toLowerCase())
      );
      const { exactMatches, needsValidation } = processTagsForValidation(
        filteredTags,
        findSimilarTags
      );

      if (exactMatches.length > 0) {
        setRecipeTags(prev => {
          const updated = [...prev];
          for (const tag of exactMatches) {
            const isDuplicate = updated.some(
              existing => existing.name.toLowerCase() === tag.name.toLowerCase()
            );
            if (!isDuplicate) {
              updated.push(tag);
            }
          }
          return updated;
        });
      }

      if (needsValidation.length > 0) {
        setValidationQueue({
          type: 'Tag',
          items: needsValidation,
          onValidated: addTagIfNotDuplicate,
        });
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
      const { exactMatches, needsValidation } = processIngredientsForValidation(
        newFieldData.recipeIngredients,
        findSimilarIngredients
      );

      if (exactMatches.length > 0) {
        setRecipeIngredients(prev => {
          const updated = [...prev];
          for (const ingredient of exactMatches) {
            const existingIndex = updated.findIndex(
              existing => existing.name?.toLowerCase() === ingredient.name.toLowerCase()
            );

            if (existingIndex === -1) {
              updated.push(ingredient);
            } else {
              const existing = updated[existingIndex];
              if (existing && existing.name && existing.unit === ingredient.unit) {
                updated[existingIndex] = {
                  ...existing,
                  quantity: String(
                    Number(existing.quantity || 0) + Number(ingredient.quantity || 0)
                  ),
                };
              } else {
                updated[existingIndex] = ingredient;
              }
            }
          }
          return updated;
        });
      }

      if (needsValidation.length > 0) {
        setValidationQueue({
          type: 'Ingredient',
          items: needsValidation,
          onValidated: addOrMergeIngredient,
        });
      }
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
