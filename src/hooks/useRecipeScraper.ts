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
import {
  DEFAULT_SCRAPER_ERROR_I18N_KEY,
  isScraperSuccess,
  recipeScraper,
  ScrapedRecipe,
  SCRAPER_ERROR_I18N_KEYS,
  ScraperError,
  ScraperErrorTypes,
  ScraperResult,
} from '@utils/RecipeScraper';
import { downloadImageToCache } from '@utils/FileGestion';
import { uiLogger } from '@utils/logger';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import {
  convertScrapedRecipe,
  getIgnoredPatterns,
  ScrapedRecipeResult,
} from '@utils/RecipeScraperConverter';

export type { ScrapedRecipeResult } from '@utils/RecipeScraperConverter';

/**
 * Result type for scrapeAndPrepare function.
 */
export type ScrapeResult =
  | { success: true; data: ScrapedRecipeResult; sourceUrl: string }
  | { success: false; error: string };

/**
 * Authentication requirement state.
 */
export interface AuthRequirement {
  url: string;
  host: string;
}

/**
 * Return type for useRecipeScraper hook.
 */
export interface UseRecipeScraperReturn {
  scrapeAndPrepare: (url: string) => Promise<ScrapeResult>;
  scrapeWithAuth: (url: string, username: string, password: string) => Promise<ScrapeResult>;
  isLoading: boolean;
  error: string | undefined;
  clearError: () => void;
  authRequired: AuthRequirement | null;
  clearAuthRequired: () => void;
}

/**
 * Hook for scraping recipes from URLs.
 */
export function useRecipeScraper(): UseRecipeScraperReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [authRequired, setAuthRequired] = useState<AuthRequirement | null>(null);
  const { defaultPersons } = useDefaultPersons();
  const { t } = useTranslation();

  const getErrorMessage = (scraperError: ScraperError): string => {
    const key = SCRAPER_ERROR_I18N_KEYS[scraperError.type] ?? DEFAULT_SCRAPER_ERROR_I18N_KEY;
    return t(key);
  };

  const clearAuthRequired = () => setAuthRequired(null);

  const clearError = () => setError(undefined);

  const processScrapedData = async (
    scraperResult: ScraperResult<ScrapedRecipe>,
    url: string,
    logPrefix: string
  ): Promise<ScrapeResult> => {
    if (!isScraperSuccess(scraperResult)) {
      const errorMessage = getErrorMessage(scraperResult.error);
      uiLogger.warn(`${logPrefix} failed`, { url, error: scraperResult.error });
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    uiLogger.info(`${logPrefix} successful`, {
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
      yields: scraperResult.data.yields,
      description: scraperResult.data.description,
      instructionsList: scraperResult.data.instructionsList,
      parsedInstructions: scraperResult.data.parsedInstructions,
      nutrients: scraperResult.data.nutrients,
    });

    const recipeData = convertScrapedRecipe(
      scraperResult.data,
      getIgnoredPatterns(t),
      defaultPersons
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

    return { success: true, data: recipeData, sourceUrl: url };
  };

  const scrapeAndPrepare = async (url: string): Promise<ScrapeResult> => {
    setIsLoading(true);
    setError(undefined);
    setAuthRequired(null);

    uiLogger.info('Starting recipe scrape', { url });

    try {
      const scraperResult = await recipeScraper.scrapeRecipe(url);

      if (
        !isScraperSuccess(scraperResult) &&
        scraperResult.error.type === ScraperErrorTypes.AuthenticationRequired
      ) {
        const host = scraperResult.error.host ?? new URL(url).hostname.replace('www.', '');
        uiLogger.info('Authentication required', { url, host });
        setAuthRequired({ url, host });
        setIsLoading(false);
        return { success: false, error: getErrorMessage(scraperResult.error) };
      }

      const result = await processScrapedData(scraperResult, url, 'Scraping');
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = t(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.ConnectionError]);
      uiLogger.error('Unexpected error during scraping', { url, error: err });
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const scrapeWithAuth = async (
    url: string,
    username: string,
    password: string
  ): Promise<ScrapeResult> => {
    setIsLoading(true);
    setError(undefined);

    uiLogger.info('Starting authenticated recipe scrape', { url });

    try {
      const scraperResult = await recipeScraper.scrapeRecipeAuthenticated(url, username, password);
      const result = await processScrapedData(scraperResult, url, 'Authenticated scraping');

      if (result.success) {
        setAuthRequired(null);
      }

      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = t(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.ConnectionError]);
      uiLogger.error('Unexpected error during authenticated scraping', { url, error: err });
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    scrapeAndPrepare,
    scrapeWithAuth,
    isLoading,
    error,
    clearError,
    authRequired,
    clearAuthRequired,
  };
}
