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
import { getIgnoredPatterns } from '@utils/RecipeScraperConverter';

/** Current phase of the discovery screen */
export type DiscoveryPhase = 'discovering' | 'selecting' | 'parsing';

/** Return value of the useDiscoveryWorkflow hook */
export interface UseDiscoveryWorkflowReturn {
  phase: DiscoveryPhase;
  recipes: DiscoveredRecipe[];
  recipesWithImages: DiscoveredRecipe[];
  selectedCount: number;
  allSelected: boolean;
  isDiscovering: boolean;
  showSelectionUI: boolean;
  discoveryProgress: DiscoveryProgress | null;
  parsingProgress: ParsingProgress | null;
  error: string | null;
  isSelected: (url: string) => boolean;
  selectRecipe: (url: string) => void;
  unselectRecipe: (url: string) => void;
  toggleSelectAll: () => void;
  parseSelectedRecipes: () => Promise<ConvertedImportRecipe[] | null>;
  abort: () => void;
}

/**
 * Custom hook for managing bulk import discovery workflow
 *
 * Handles the complete discovery lifecycle including:
 * - Recipe discovery from provider with streaming progress
 * - Image loading for discovered recipes
 * - Selection management (select, unselect, toggle all)
 * - Parsing selected recipes for validation
 *
 * @param provider - The bulk import provider to use for discovery
 * @param defaultPersons - Default number of persons for recipes
 * @returns Workflow state and handlers
 */
export function useDiscoveryWorkflow(
  provider: RecipeProvider | undefined,
  defaultPersons: number
): UseDiscoveryWorkflowReturn {
  const { t } = useI18n();

  const [phase, setPhase] = useState<DiscoveryPhase>('discovering');
  const [recipes, setRecipes] = useState<DiscoveredRecipe[]>([]);
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map());
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [discoveryProgress, setDiscoveryProgress] = useState<DiscoveryProgress | null>(null);
  const [parsingProgress, setParsingProgress] = useState<ParsingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!provider) {
      setError(t('discovery.unknownProvider'));
      setPhase('selecting');
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const handleImageLoaded = (recipeUrl: string, imageUrl: string) => {
      setImageMap(prev => new Map(prev).set(recipeUrl, imageUrl));
    };

    const runDiscovery = async () => {
      setPhase('discovering');
      setError(null);

      try {
        const generator = provider.discoverRecipeUrls({
          signal: abortController.signal,
          onImageLoaded: handleImageLoaded,
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
        setPhase('selecting');
        abortControllerRef.current = null;
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
   * Toggles selection state of all recipes
   *
   * If all recipes are selected, deselects all.
   * Otherwise, selects all recipes.
   */
  const toggleSelectAll = () => {
    if (selectedUrls.size === recipes.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(recipes.map(r => r.url)));
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
      const generator = provider.parseSelectedRecipes(selectedRecipes, {
        signal: abortController.signal,
        defaultPersons,
        ignoredPatterns: getIgnoredPatterns(t),
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

  const selectedCount = selectedUrls.size;
  const allSelected = selectedCount === recipes.length && recipes.length > 0;
  const isDiscovering = phase === 'discovering';
  const showSelectionUI = isDiscovering || phase === 'selecting';

  const recipesWithImages = recipes.map(r => ({
    ...r,
    imageUrl: imageMap.get(r.url) ?? r.imageUrl,
  }));

  return {
    phase,
    recipes,
    recipesWithImages,
    selectedCount,
    allSelected,
    isDiscovering,
    showSelectionUI,
    discoveryProgress,
    parsingProgress,
    error,
    isSelected,
    selectRecipe,
    unselectRecipe,
    toggleSelectAll,
    parseSelectedRecipes,
    abort,
  };
}
