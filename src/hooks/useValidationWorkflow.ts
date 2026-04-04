/**
 * useValidationWorkflow - Hook for managing bulk import validation workflow
 *
 * Encapsulates all state management and handler logic for the BulkImportValidation
 * screen, including the review phase and recipe import.
 *
 * @module hooks/useValidationWorkflow
 */

import { useEffect, useRef, useState } from 'react';
import {
  ingredientTableElement,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { BatchValidationState, ConvertedImportRecipe } from '@customTypes/BulkImportTypes';
import {
  addIngredientMapping,
  addTagMapping,
  applyMappingsToRecipes,
  getValidationProgress,
  initializeBatchValidation,
} from '@utils/BatchValidation';
import {
  processIngredientsForValidation,
  processTagsForValidation,
} from '@utils/RecipeValidationHelpers';
import { bulkImportLogger } from '@utils/logger';
import { useI18n } from '@utils/i18n';

/** Current phase of the validation workflow */
export type ValidationPhase = 'initializing' | 'reviewing' | 'importing' | 'complete' | 'error';

/** Sub-phase during initialization for more granular progress */
export type InitializationStage = 'analyzing' | 'matching-ingredients' | 'matching-tags' | 'ready';

/** Handler functions returned by the hook */
export interface ValidationHandlers {
  onTagValidated: (originalTag: tagTableElement, validatedTag: tagTableElement) => void;
  onIngredientValidated: (
    originalName: string,
    validatedIngredient: ingredientTableElement
  ) => void;
  startImport: () => void;
}

/** Progress information for validation */
export interface ValidationProgress {
  totalIngredients: number;
  validatedIngredients: number;
  totalTags: number;
  validatedTags: number;
  remainingIngredients: number;
  remainingTags: number;
}

/** Return value of the useValidationWorkflow hook */
export interface UseValidationWorkflowReturn {
  phase: ValidationPhase;
  initStage: InitializationStage;
  validationState: BatchValidationState | null;
  progress: ValidationProgress | null;
  importedCount: number;
  errorMessage: string | null;
  handlers: ValidationHandlers;
}

/**
 * Custom hook for managing bulk import validation workflow
 *
 * Handles the complete validation lifecycle including:
 * - Initialization and analysis of imported recipes
 * - Review phase where user validates all items inline
 * - Final recipe import to database
 *
 * @param selectedRecipes - Recipes to validate and import
 * @param addMultipleRecipes - Database function to save recipes
 * @param isDatabaseReady - Whether the database context has loaded data
 * @param defaultPersons - User's default serving count to apply to all imported recipes
 * @param findSimilarTags - Function to find similar tags by name (from RecipeDatabase)
 * @param findSimilarIngredients - Function to find similar ingredients by name (from RecipeDatabase)
 * @param onImportComplete - Optional async callback called after successful import with source URLs
 * @returns Workflow state and handlers
 */
export function useValidationWorkflow(
  selectedRecipes: ConvertedImportRecipe[],
  addMultipleRecipes: (recipes: recipeTableElement[]) => Promise<void>,
  isDatabaseReady: boolean,
  defaultPersons: number,
  findSimilarTags: (name: string) => tagTableElement[],
  findSimilarIngredients: (name: string) => ingredientTableElement[],
  onImportComplete?: (importedSourceUrls: string[]) => void | Promise<void>
): UseValidationWorkflowReturn {
  const { t } = useI18n();

  const [phase, setPhase] = useState<ValidationPhase>('initializing');
  const [initStage, setInitStage] = useState<InitializationStage>('analyzing');
  const [validationState, setValidationState] = useState<BatchValidationState | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recipesRef = useRef<ConvertedImportRecipe[]>(selectedRecipes);
  const hasInitializedRef = useRef(false);
  const validationStateRef = useRef<BatchValidationState | null>(null);
  validationStateRef.current = validationState;

  const findSimilarTagsRef = useRef(findSimilarTags);
  findSimilarTagsRef.current = findSimilarTags;
  const findSimilarIngredientsRef = useRef(findSimilarIngredients);
  findSimilarIngredientsRef.current = findSimilarIngredients;

  /**
   * Saves validated recipes to the database
   *
   * @param state - The current batch validation state with mappings
   */
  const saveRecipes = async (state: BatchValidationState) => {
    setPhase('importing');

    try {
      const validatedRecipes = applyMappingsToRecipes(recipesRef.current, state, defaultPersons);
      const recipesWithIngredients = validatedRecipes.filter(r => r.ingredients.length > 0);

      if (recipesWithIngredients.length === 0) {
        throw new Error(t('bulkImport.validation.noValidRecipes'));
      }

      bulkImportLogger.info('Saving recipes to database', {
        count: recipesWithIngredients.length,
        skippedWithoutIngredients: validatedRecipes.length - recipesWithIngredients.length,
      });

      await addMultipleRecipes(recipesWithIngredients);

      setImportedCount(recipesWithIngredients.length);

      bulkImportLogger.info('Bulk import complete', {
        importedCount: recipesWithIngredients.length,
      });

      if (onImportComplete) {
        const importedUrls = recipesRef.current.map(r => r.sourceUrl);
        await onImportComplete(importedUrls);
      }

      setPhase('complete');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(msg);
      setPhase('error');
      bulkImportLogger.error('Failed to save recipes', { error: msg });
    }
  };

  const saveRecipesRef = useRef(saveRecipes);
  saveRecipesRef.current = saveRecipes;

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    if (!isDatabaseReady) {
      return;
    }
    hasInitializedRef.current = true;

    const runInit = async () => {
      setInitStage('analyzing');
      const state = initializeBatchValidation(selectedRecipes);
      await new Promise(r => setTimeout(r, 100));

      setInitStage('matching-tags');
      const tagResult = processTagsForValidation(state.tagsToValidate, findSimilarTagsRef.current);
      for (const tag of tagResult.exactMatches) {
        addTagMapping(state, tag.name, tag);
      }
      state.tagsToValidate = tagResult.needsValidation;
      await new Promise(r => setTimeout(r, 100));

      setInitStage('matching-ingredients');
      const ingResult = processIngredientsForValidation(
        state.ingredientsToValidate,
        findSimilarIngredientsRef.current
      );
      for (const ing of ingResult.exactMatches) {
        addIngredientMapping(state, ing.name, ing);
      }
      state.ingredientsToValidate = ingResult.needsValidation;

      setValidationState(state);
      setInitStage('ready');
      await new Promise(r => setTimeout(r, 100));

      const hasItemsToReview =
        state.tagsToValidate.length > 0 || state.ingredientsToValidate.length > 0;

      if (hasItemsToReview) {
        setPhase('reviewing');
      } else {
        saveRecipesRef.current(state);
      }
    };

    runInit();
  }, [selectedRecipes, isDatabaseReady]);

  /**
   * Handles tag validation by adding a mapping from original to validated tag
   *
   * @param originalTag - The original tag from import
   * @param validatedTag - The validated/mapped tag
   */
  const handleTagValidated = (originalTag: tagTableElement, validatedTag: tagTableElement) => {
    const state = validationStateRef.current;
    if (!state) return;

    addTagMapping(state, originalTag.name, validatedTag);
  };

  /**
   * Handles ingredient validation by adding a mapping from original to validated ingredient
   *
   * @param originalName - The original ingredient name from import
   * @param validatedIngredient - The validated/mapped ingredient
   */
  const handleIngredientValidated = (
    originalName: string,
    validatedIngredient: ingredientTableElement
  ) => {
    const state = validationStateRef.current;
    if (!state) return;

    addIngredientMapping(state, originalName, validatedIngredient);
  };

  /**
   * Triggers the import phase after all items have been reviewed
   */
  const handleStartImport = () => {
    const state = validationStateRef.current;
    if (!state) {
      bulkImportLogger.error('Start import called but validation state is null');
      return;
    }
    saveRecipesRef.current(state);
  };

  const progress = validationState ? getValidationProgress(validationState) : null;

  return {
    phase,
    initStage,
    validationState,
    progress,
    importedCount,
    errorMessage,
    handlers: {
      onTagValidated: handleTagValidated,
      onIngredientValidated: handleIngredientValidated,
      startImport: handleStartImport,
    },
  };
}
