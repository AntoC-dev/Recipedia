/**
 * useValidationWorkflow - Hook for managing bulk import validation workflow
 *
 * Encapsulates all state management and handler logic for the BulkImportValidation
 * screen, including tag/ingredient validation phases and recipe import.
 *
 * @module hooks/useValidationWorkflow
 */

import { useEffect, useRef, useState } from 'react';
import {
  FormIngredientElement,
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
import { bulkImportLogger } from '@utils/logger';
import { useI18n } from '@utils/i18n';

/** Current phase of the validation workflow */
export type ValidationPhase =
  | 'initializing'
  | 'tags'
  | 'ingredients'
  | 'importing'
  | 'complete'
  | 'error';

/** Sub-phase during initialization for more granular progress */
export type InitializationStage = 'analyzing' | 'matching-ingredients' | 'matching-tags' | 'ready';

/** Handler functions returned by the hook */
export interface ValidationHandlers {
  onTagValidated: (originalTag: tagTableElement, validatedTag: tagTableElement) => void;
  onTagDismissed: () => void;
  onTagQueueComplete: () => void;
  onIngredientValidated: (
    originalIngredient: FormIngredientElement,
    validatedIngredient: ingredientTableElement
  ) => void;
  onIngredientDismissed: () => void;
  onIngredientQueueComplete: () => void;
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
 * - Tag validation queue management
 * - Ingredient validation queue management
 * - Final recipe import to database
 *
 * @param selectedRecipes - Recipes to validate and import
 * @param allIngredients - All ingredients from database for fuzzy matching
 * @param allTags - All tags from database for fuzzy matching
 * @param addMultipleRecipes - Database function to save recipes
 * @param isDatabaseReady - Whether the database context has loaded data
 * @param onImportComplete - Optional callback called after successful import with source URLs
 * @returns Workflow state and handlers
 */
export function useValidationWorkflow(
  selectedRecipes: ConvertedImportRecipe[],
  allIngredients: ingredientTableElement[],
  allTags: tagTableElement[],
  addMultipleRecipes: (recipes: recipeTableElement[]) => Promise<void>,
  isDatabaseReady: boolean,
  onImportComplete?: (importedSourceUrls: string[]) => void
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

  /**
   * Saves validated recipes to the database
   *
   * @param state - The current batch validation state with mappings
   */
  const saveRecipes = async (state: BatchValidationState) => {
    setPhase('importing');

    try {
      const validatedRecipes = applyMappingsToRecipes(recipesRef.current, state);
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
      setPhase('complete');

      bulkImportLogger.info('Bulk import complete', {
        importedCount: recipesWithIngredients.length,
      });

      if (onImportComplete) {
        const importedUrls = recipesRef.current.map(r => r.sourceUrl);
        onImportComplete(importedUrls);
      }
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
      await new Promise(r => setTimeout(r, 100));

      setInitStage('matching-ingredients');
      await new Promise(r => setTimeout(r, 100));

      setInitStage('matching-tags');
      const state = initializeBatchValidation(selectedRecipes, allIngredients, allTags);
      setValidationState(state);

      setInitStage('ready');
      await new Promise(r => setTimeout(r, 100));

      if (state.tagsToValidate.length > 0) {
        setPhase('tags');
      } else if (state.ingredientsToValidate.length > 0) {
        setPhase('ingredients');
      } else {
        saveRecipesRef.current(state);
      }
    };

    runInit();
  }, [selectedRecipes, allIngredients, allTags, isDatabaseReady]);

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
   * Handles tag dismissal (user skipped validation for this tag)
   */
  const handleTagDismissed = () => {
    bulkImportLogger.debug('Tag dismissed');
  };

  /**
   * Handles tag queue completion, transitions to ingredients phase or saves recipes
   */
  const handleTagQueueComplete = () => {
    const state = validationStateRef.current;
    if (!state) {
      bulkImportLogger.error('Tag queue complete but validation state is null');
      return;
    }

    bulkImportLogger.debug('Tag queue complete, checking ingredients', {
      ingredientsToValidate: state.ingredientsToValidate.length,
    });

    if (state.ingredientsToValidate.length > 0) {
      bulkImportLogger.debug('Switching to ingredients phase', {
        ingredientsCount: state.ingredientsToValidate.length,
        firstIngredientName: state.ingredientsToValidate[0]?.name,
      });
      setPhase('ingredients');
    } else {
      saveRecipesRef.current(state);
    }
  };

  /**
   * Handles ingredient validation by adding a mapping from original to validated ingredient
   *
   * @param originalIngredient - The original ingredient from import
   * @param validatedIngredient - The validated/mapped ingredient
   */
  const handleIngredientValidated = (
    originalIngredient: FormIngredientElement,
    validatedIngredient: ingredientTableElement
  ) => {
    const state = validationStateRef.current;
    if (!state || !originalIngredient.name) return;

    addIngredientMapping(state, originalIngredient.name, validatedIngredient);
  };

  /**
   * Handles ingredient dismissal (user skipped validation for this ingredient)
   */
  const handleIngredientDismissed = () => {
    bulkImportLogger.debug('Ingredient dismissed');
  };

  /**
   * Handles ingredient queue completion, saves validated recipes to database
   */
  const handleIngredientQueueComplete = () => {
    bulkImportLogger.debug('Ingredient queue complete, saving recipes');
    const state = validationStateRef.current;
    if (!state) return;
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
      onTagDismissed: handleTagDismissed,
      onTagQueueComplete: handleTagQueueComplete,
      onIngredientValidated: handleIngredientValidated,
      onIngredientDismissed: handleIngredientDismissed,
      onIngredientQueueComplete: handleIngredientQueueComplete,
    },
  };
}
