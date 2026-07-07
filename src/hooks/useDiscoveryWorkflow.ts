/**
 * useDiscoveryWorkflow - Hook for managing bulk import discovery workflow
 *
 * Encapsulates all state management and handler logic for the BulkImportDiscovery
 * screen, including recipe discovery, selection, and parsing phases.
 *
 * @module hooks/useDiscoveryWorkflow
 */

import { useEffect, useRef, useState } from 'react';
import {
  ConvertedImportRecipe,
  DiscoveredRecipe,
  DiscoveryProgress,
  ParsingProgress,
  RecipeProvider,
} from '@customTypes/BulkImportTypes';
import { bulkImportLogger } from '@utils/logger';
import { useI18n } from '@utils/i18n';
import { useImportMemory } from '@hooks/useImportMemory';
import { useImportHistory } from '@hooks/useImportHistory';
import { useRecipeScraper } from '@hooks/useRecipeScraper';

/** Current phase of the discovery screen */
export type DiscoveryPhase = 'discovering' | 'selecting' | 'parsing';

/** Return value of the useDiscoveryWorkflow hook */
export interface UseDiscoveryWorkflowReturn {
  phase: DiscoveryPhase;
  recipes: DiscoveredRecipe[];
  recipesWithImages: DiscoveredRecipe[];
  freshRecipes: DiscoveredRecipe[];
  seenRecipes: DiscoveredRecipe[];
  selectedCount: number;
  allSelected: boolean;
  isDiscovering: boolean;
  showSelectionUI: boolean;
  discoveryProgress: DiscoveryProgress | null;
  parsingProgress: ParsingProgress | null;
  error: string | null;
  isSelected: (url: string) => boolean;
  isDismissed: (url: string) => boolean;
  selectRecipe: (url: string) => void;
  unselectRecipe: (url: string) => void;
  toggleSelectAll: () => void;
  parseSelectedRecipes: () => Promise<ConvertedImportRecipe[] | null>;
  abort: () => void;
  markUrlsAsSeen: () => Promise<void>;
  dismissRecipe: (recipe: DiscoveredRecipe) => void;
  restoreRecipe: (recipe: DiscoveredRecipe) => void;
  commitDismissals: () => Promise<void>;
}

/**
 * Custom hook for managing bulk import discovery workflow
 *
 * Handles the complete discovery lifecycle including:
 * - Recipe discovery from provider with streaming progress
 * - Selection management (select, unselect, toggle all)
 * - Parsing selected recipes for validation
 * - Import memory tracking (hide imported, mark seen)
 *
 * Note: Image loading is now handled externally via useVisibleImageLoader hook.
 * The imageMap parameter allows injecting visibility-based loaded images.
 *
 * @param provider - The bulk import provider to use for discovery
 * @param providerId - Provider identifier for import memory tracking
 * @param imageMap - External map of recipe URLs to image URLs (from visibility-based loader)
 * @returns Workflow state and handlers
 */
export function useDiscoveryWorkflow(
  provider: RecipeProvider | undefined,
  providerId: string,
  imageMap: Map<string, string> = new Map()
): UseDiscoveryWorkflowReturn {
  const { t } = useI18n();
  const { parseSelectedRecipes: parseSelectedRecipesViaScraper } = useRecipeScraper();
  const { processDiscoveredRecipes } = useImportMemory(providerId);
  const { markUrlsAsSeen, markRecipesAsDismissed } = useImportHistory();

  const [phase, setPhase] = useState<DiscoveryPhase>(provider ? 'discovering' : 'selecting');
  const [recipes, setRecipes] = useState<DiscoveredRecipe[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [pendingDismissed, setPendingDismissed] = useState<Map<string, DiscoveredRecipe>>(
    new Map()
  );
  const [discoveryProgress, setDiscoveryProgress] = useState<DiscoveryProgress | null>(null);
  const [parsingProgress, setParsingProgress] = useState<ParsingProgress | null>(null);
  const [error, setError] = useState<string | null>(() =>
    provider ? null : t('discovery.unknownProvider')
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!provider) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const runDiscovery = async () => {
      setPhase('discovering');
      setError(null);

      try {
        const generator = provider.discoverRecipeUrls({
          signal: abortController.signal,
        });

        for await (const progressUpdate of generator) {
          setDiscoveryProgress(progressUpdate);
          setRecipes(progressUpdate.recipes);

          if (progressUpdate.isComplete) {
            break;
          }
        }

        bulkImportLogger.info('Discovery finished', {
          recipeCount: recipes.length,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          bulkImportLogger.info('Discovery aborted by user');
        } else {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg);
          bulkImportLogger.error('Discovery failed', { error: errorMsg });
        }
      } finally {
        setPhase(prev => (prev === 'discovering' ? 'selecting' : prev));
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    runDiscovery();

    return () => {
      abortController.abort();
    };
  }, [provider, t]);

  /**
   * Aborts the current discovery or parsing operation
   */
  const abort = () => {
    abortControllerRef.current?.abort();
  };

  /**
   * Checks if a recipe is currently selected
   *
   * @param url - The recipe URL to check
   * @returns True if the recipe is selected
   */
  const isSelected = (url: string) => selectedUrls.has(url);

  /**
   * Checks if a recipe is pending dismissal for this session.
   *
   * Pending-dismissed recipes stay visible in the list (styled as hidden) until
   * the user presses Continue, at which point the dismissals are persisted.
   *
   * @param url - The recipe URL to check
   * @returns True if the recipe is pending dismissal
   */
  const isDismissed = (url: string) => pendingDismissed.has(url);

  /**
   * Adds a recipe to the selection
   *
   * @param url - The URL of the recipe to select
   */
  const selectRecipe = (url: string) => {
    setSelectedUrls(prev => new Set(prev).add(url));
  };

  /**
   * Removes a recipe from the selection
   *
   * @param url - The URL of the recipe to unselect
   */
  const unselectRecipe = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  /**
   * Toggles selection state of all visible recipes
   *
   * If all visible recipes are selected, deselects all.
   * Otherwise, selects all visible recipes (excluding hidden imported ones).
   */
  const toggleSelectAll = () => {
    const selectableUrls = [...freshRecipes, ...seenRecipes]
      .map(r => r.url)
      .filter(url => !pendingDismissed.has(url));
    if (selectedUrls.size === selectableUrls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(selectableUrls));
    }
  };

  /**
   * Parses selected recipes and returns converted data for validation
   *
   * Streams progress updates during parsing. Returns null if parsing
   * fails or is aborted.
   *
   * @returns Converted recipes ready for validation, or null on failure
   */
  const parseSelectedRecipes = async (): Promise<ConvertedImportRecipe[] | null> => {
    if (selectedUrls.size === 0 || !provider) {
      return null;
    }

    const selectedRecipes = recipes.filter(r => selectedUrls.has(r.url));

    setPhase('parsing');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const generator = parseSelectedRecipesViaScraper(provider, selectedRecipes, {
        signal: abortController.signal,
      });

      let finalProgress: ParsingProgress | null = null;

      for await (const progressUpdate of generator) {
        setParsingProgress(progressUpdate);
        finalProgress = progressUpdate;

        if (progressUpdate.phase === 'complete') {
          break;
        }
      }

      if (finalProgress && finalProgress.parsedRecipes.length > 0) {
        const convertedRecipes: ConvertedImportRecipe[] = finalProgress.parsedRecipes.map(r => ({
          title: r.title,
          description: r.description,
          imageUrl: r.localImageUri || '',
          persons: r.persons,
          time: r.time,
          ingredients: r.ingredients,
          tags: r.tags,
          preparation: r.preparation,
          nutrition: r.nutrition,
          skippedIngredients: r.skippedIngredients,
          sourceUrl: r.url,
          sourceProvider: providerId,
        }));

        bulkImportLogger.info('Recipes parsed successfully', {
          count: convertedRecipes.length,
          failed: finalProgress.failedRecipes.length,
        });

        return convertedRecipes;
      } else {
        setError(t('selection.noRecipesParsed'));
        setPhase('selecting');
        return null;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        bulkImportLogger.info('Parsing aborted by user');
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        bulkImportLogger.error('Parsing failed', { error: errorMsg });
      }
      setPhase('selecting');
      return null;
    }
  };

  const recipesWithImages = recipes.map(r => ({
    ...r,
    imageUrl: imageMap.get(r.url) ?? r.imageUrl,
  }));

  const processedRecipes = processDiscoveredRecipes(recipesWithImages, true);

  const freshRecipes = processedRecipes.filter(r => r.memoryStatus === 'fresh');
  const seenRecipes = processedRecipes.filter(r => r.memoryStatus === 'seen');
  const selectableCount = freshRecipes.length + seenRecipes.length - pendingDismissed.size;

  const selectedCount = selectedUrls.size;
  const allSelected = selectedCount === selectableCount && selectableCount > 0;
  const isDiscovering = phase === 'discovering';
  const showSelectionUI = isDiscovering || phase === 'selecting';

  const markDiscoveredUrlsAsSeen = async () => {
    const urls = recipes.map(r => r.url);
    await markUrlsAsSeen(providerId, urls);
  };

  /**
   * Marks a discovered recipe as pending dismissal for this session.
   *
   * The recipe stays visible (styled as hidden) and is removed from the
   * selection, but nothing is persisted until {@link commitDismissals} runs on
   * Continue. This lets the user change their mind beforehand.
   *
   * @param recipe - The recipe to dismiss
   */
  const dismissRecipe = (recipe: DiscoveredRecipe) => {
    setPendingDismissed(prev => new Map(prev).set(recipe.url, recipe));
    unselectRecipe(recipe.url);
  };

  /**
   * Cancels a pending dismissal, restoring the recipe to a normal state.
   *
   * @param recipe - The recipe to restore
   */
  const restoreRecipe = (recipe: DiscoveredRecipe) => {
    setPendingDismissed(prev => {
      const next = new Map(prev);
      next.delete(recipe.url);
      return next;
    });
  };

  /**
   * Persists every pending dismissal so the recipes are hidden from all future
   * discovery runs. Called when the user confirms with Continue.
   */
  const commitDismissals = async () => {
    if (pendingDismissed.size === 0) return;
    const dismissed = Array.from(pendingDismissed.values()).map(r => ({
      url: r.url,
      title: r.title,
      imageUrl: imageMap.get(r.url) ?? r.imageUrl,
    }));
    await markRecipesAsDismissed(providerId, dismissed);
  };

  return {
    phase,
    recipes,
    recipesWithImages,
    freshRecipes,
    seenRecipes,
    selectedCount,
    allSelected,
    isDiscovering,
    showSelectionUI,
    discoveryProgress,
    parsingProgress,
    error,
    isSelected,
    isDismissed,
    selectRecipe,
    unselectRecipe,
    toggleSelectAll,
    parseSelectedRecipes,
    abort,
    markUrlsAsSeen: markDiscoveredUrlsAsSeen,
    dismissRecipe,
    restoreRecipe,
    commitDismissals,
  };
}
