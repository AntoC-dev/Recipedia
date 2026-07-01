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
import {
  BatchValidationState,
  ConvertedImportRecipe,
  SkippedRecipeInfo,
} from '@customTypes/BulkImportTypes';
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
export type ValidationPhase =
  'initializing' | 'warning' | 'reviewing' | 'importing' | 'complete' | 'error';

/** Sub-phase during initialization for more granular progress */
export type InitializationStage = 'analyzing' | 'matching-ingredients' | 'matching-tags' | 'ready';

/** Handler functions returned by the hook */
export interface ValidationHandlers {
  /** Called when the user maps or skips a tag during the review phase */
  onTagValidated: (originalTag: tagTableElement, validatedTag: tagTableElement) => void;
  /** Called when the user maps or skips an ingredient during the review phase */
  onIngredientValidated: (
    originalName: string,
    validatedIngredient: ingredientTableElement
  ) => void;
  /** Triggers the final import after all items have been reviewed */
  startImport: () => void;
  /** Dismisses the pre-validation skipped-recipes warning and advances to the next phase */
  acknowledgeWarning: () => void;
}

/** Progress information for validation */
export interface ValidationProgress {
  /** Total number of unique ingredients requiring user review */
  totalIngredients: number;
  /** Number of ingredients already validated or auto-resolved */
  validatedIngredients: number;
  /** Total number of unique tags requiring user review */
  totalTags: number;
  /** Number of tags already validated or auto-resolved */
  validatedTags: number;
  /** Number of ingredients still awaiting review */
  remainingIngredients: number;
  /** Number of tags still awaiting review */
  remainingTags: number;
}

/** Return value of the useValidationWorkflow hook */
export interface UseValidationWorkflowReturn {
  /** Current high-level phase of the workflow */
  phase: ValidationPhase;
  /** Granular stage within the 'initializing' phase */
  initStage: InitializationStage;
  /** Current batch validation state, or null while initializing */
  validationState: BatchValidationState | null;
  /** Validation progress counters, or null while initializing */
  progress: ValidationProgress | null;
  /** Number of recipes successfully saved to the database */
  importedCount: number;
  /**
   * Recipes omitted from the import because they had no valid ingredient names.
   * Populated at two points: before validation (pre-validation skips) and after
   * import (post-mapping skips where all ingredients were mapped away).
   */
  skippedRecipes: SkippedRecipeInfo[];
  /** Error message when phase is 'error', otherwise null */
  errorMessage: string | null;
  /** Stable handler callbacks to pass to child components */
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
 * @param defaultPersons - User's default serving count to apply to all imported recipes
 * @param findSimilarTags - Function to find similar tags by name (from RecipeDatabase)
 * @param findSimilarIngredients - Function to find similar ingredients by name (from RecipeDatabase)
 * @param onImportComplete - Optional async callback called after successful import with source URLs
 * @returns Workflow state and handlers
 */
export function useValidationWorkflow(
  selectedRecipes: ConvertedImportRecipe[],
  addMultipleRecipes: (recipes: recipeTableElement[]) => Promise<void>,
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
  const [skippedRecipes, setSkippedRecipes] = useState<SkippedRecipeInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recipesRef = useRef<ConvertedImportRecipe[]>(selectedRecipes);
  const hasInitializedRef = useRef(false);
  const hasItemsToReviewRef = useRef(false);
  const validationStateRef = useRef<BatchValidationState | null>(null);
  const findSimilarTagsRef = useRef(findSimilarTags);
  const findSimilarIngredientsRef = useRef(findSimilarIngredients);

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

      const allSkipped = recipesRef.current
        .filter((_, i) => validatedRecipes[i].ingredients.length === 0)
        .map(r => ({ title: r.title, sourceUrl: r.sourceUrl }));

      setSkippedRecipes(allSkipped);

      if (recipesWithIngredients.length === 0) {
        throw new Error(t('bulkImport.validation.noValidRecipes'));
      }

      bulkImportLogger.info('Saving recipes to database', {
        count: recipesWithIngredients.length,
        skippedWithoutIngredients: allSkipped.length,
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

  useEffect(() => {
    validationStateRef.current = validationState;
    findSimilarTagsRef.current = findSimilarTags;
    findSimilarIngredientsRef.current = findSimilarIngredients;
    saveRecipesRef.current = saveRecipes;
  });

  useEffect(() => {
    if (hasInitializedRef.current) {
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

      const preValidationSkips = selectedRecipes
        .filter(r => r.ingredients.filter(i => !!i.name).length === 0)
        .map(r => ({ title: r.title, sourceUrl: r.sourceUrl }));

      if (preValidationSkips.length > 0) {
        bulkImportLogger.warn('Recipes with no valid ingredient names detected before validation', {
          count: preValidationSkips.length,
          titles: preValidationSkips.map(r => r.title),
        });
        setSkippedRecipes(preValidationSkips);
      }

      const hasItemsToReview =
        state.tagsToValidate.length > 0 || state.ingredientsToValidate.length > 0;
      hasItemsToReviewRef.current = hasItemsToReview;

      if (preValidationSkips.length > 0) {
        setPhase('warning');
      } else if (hasItemsToReview) {
        setPhase('reviewing');
      } else {
        saveRecipesRef.current(state);
      }
    };

    runInit();
  }, [selectedRecipes]);

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
   * Acknowledges the pre-validation warning and proceeds to the next phase
   *
   * Transitions to 'reviewing' if there are items to validate, or directly
   * triggers the import if all items were auto-resolved.
   */
  const handleAcknowledgeWarning = () => {
    if (hasItemsToReviewRef.current) {
      setPhase('reviewing');
    } else {
      const state = validationStateRef.current;
      if (state) saveRecipesRef.current(state);
    }
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
    skippedRecipes,
    errorMessage,
    handlers: {
      onTagValidated: handleTagValidated,
      onIngredientValidated: handleIngredientValidated,
      startImport: handleStartImport,
      acknowledgeWarning: handleAcknowledgeWarning,
    },
  };
}
