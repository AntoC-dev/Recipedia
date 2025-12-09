/**
 * useRecipeScraper - Hook for scraping recipes from URLs
 *
 * Encapsulates the scraping logic including:
 * - URL validation
 * - Calling the recipe scraper module
 * - Converting scraped data to app format
 * - Downloading recipe images
 * - Error handling
 *
 * @example
 * ```typescript
 * const { scrapeAndPrepare, isLoading, error, clearError } = useRecipeScraper();
 *
 * const handleImport = async (url: string) => {
 *   const result = await scrapeAndPrepare(url);
 *   if (result.success) {
 *     navigation.navigate('Recipe', {
 *       mode: 'addFromScrape',
 *       scrapedData: result.data,
 *       sourceUrl: url,
 *     });
 *   }
 * };
 * ```
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isScraperSuccess, recipeScraper } from '@utils/RecipeScraper';
import { downloadImageToCache } from '@utils/FileGestion';
import { uiLogger } from '@utils/logger';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import { convertScrapedRecipe, ScrapedRecipeResult } from '@utils/RecipeScraperConverter';

export type { ScrapedRecipeResult } from '@utils/RecipeScraperConverter';

/**
 * Result type for scrapeAndPrepare function.
 */
export type ScrapeResult =
  | { success: true; data: ScrapedRecipeResult; sourceUrl: string }
  | { success: false; error: string };

/**
 * Return type for useRecipeScraper hook.
 */
export interface UseRecipeScraperReturn {
  scrapeAndPrepare: (url: string) => Promise<ScrapeResult>;
  isLoading: boolean;
  error: string | undefined;
  clearError: () => void;
}

/**
 * Hook for scraping recipes from URLs.
 */
export function useRecipeScraper(): UseRecipeScraperReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { defaultPersons } = useDefaultPersons();
  const { t } = useTranslation();

  const getIgnoredPrefixes = (): string[] => {
    const prefixes = t('recipe.scraper.ignoredIngredientPrefixes', { returnObjects: true });
    if (!Array.isArray(prefixes)) {
      return [];
    }
    return prefixes.filter((p): p is string => typeof p === 'string');
  };

  const getStepTitle = (index: number) => t('recipe.scraper.stepTitle', { number: index + 1 });

  const clearError = () => setError(undefined);

  const scrapeAndPrepare = async (url: string): Promise<ScrapeResult> => {
    setIsLoading(true);
    setError(undefined);

    uiLogger.info('Starting recipe scrape', { url });

    try {
      const scraperResult = await recipeScraper.scrapeRecipe(url);

      if (!isScraperSuccess(scraperResult)) {
        const errorMessage = scraperResult.error.message || 'urlDialog.errorScraping';
        uiLogger.warn('Scraping failed', { url, error: scraperResult.error });
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, error: errorMessage };
      }

      uiLogger.info('Scraping successful', {
        url,
        title: scraperResult.data.title,
        ingredientCount: scraperResult.data.ingredients.length,
        ingredients: scraperResult.data.ingredients,
        category: scraperResult.data.category,
        cuisine: scraperResult.data.cuisine,
        keywords: scraperResult.data.keywords,
        dietaryRestrictions: scraperResult.data.dietaryRestrictions,
        totalTime: scraperResult.data.totalTime,
        prepTime: scraperResult.data.prepTime,
        cookTime: scraperResult.data.cookTime,
      });

      const recipeData = convertScrapedRecipe(
        scraperResult.data,
        getIgnoredPrefixes(),
        defaultPersons,
        getStepTitle
      );

      if (recipeData.skippedIngredients?.length) {
        uiLogger.warn('Some ingredients could not be parsed', {
          skipped: recipeData.skippedIngredients,
        });
      }

      if (scraperResult.data.image) {
        uiLogger.info('Downloading recipe image', { imageUrl: scraperResult.data.image });
        const localImageUri = await downloadImageToCache(scraperResult.data.image);
        if (localImageUri) {
          recipeData.image_Source = localImageUri;
        }
      }

      setIsLoading(false);
      return { success: true, data: recipeData, sourceUrl: url };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'urlDialog.errorNetwork';
      uiLogger.error('Unexpected error during scraping', { url, error: err });
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    scrapeAndPrepare,
    isLoading,
    error,
    clearError,
  };
}
