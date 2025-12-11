/**
 * RecipeScraper - App-level re-exports from the recipe-scraper module.
 *
 * This file provides convenient access to the recipe scraper functionality
 * for use throughout the app. All implementation details are in the module.
 */

import type {
  ScraperErrorResult,
  ScraperResult,
  ScraperSuccessResult,
} from '@app/modules/recipe-scraper';

export { RecipeScraper, recipeScraper } from '@app/modules/recipe-scraper';

export type {
  HostSupportedResult,
  IngredientGroup,
  ParsedIngredient,
  RecipeLink,
  ScrapeOptions,
  ScrapedNutrients,
  IngredientGroup,
  RecipeLink,
  ScrapedRecipe,
  ScraperError,
  ScraperErrorResult,
  ScraperResult,
  ScraperSuccessResult,
  SupportedHostsResult,
} from '@app/modules/recipe-scraper';

/**
 * Type guard to check if a scraper result is successful.
 *
 * @param result - The scraper result to check
 * @returns True if the result contains data, false if it contains an error
 */
export function isScraperSuccess<T>(result: ScraperResult<T>): result is ScraperSuccessResult<T> {
  return result.success;
}

/**
 * Type guard to check if a scraper result is an error.
 *
 * @param result - The scraper result to check
 * @returns True if the result contains an error, false if it contains data
 */
export function isScraperError<T>(result: ScraperResult<T>): result is ScraperErrorResult {
  return !result.success;
}

/**
 * Maps Python scraper error types to i18n translation keys.
 *
 * Used to display user-friendly error messages instead of raw Python exceptions.
 * Keys are Python exception class names, values are i18n keys.
 */
export const SCRAPER_ERROR_I18N_KEYS: Record<string, string> = {
  NoSchemaFoundInWildMode: 'urlDialog.errorNoRecipeFound',
  WebsiteNotImplementedError: 'urlDialog.errorUnsupportedSite',
  ConnectionError: 'urlDialog.errorNetwork',
  HTTPError: 'urlDialog.errorNetwork',
  URLError: 'urlDialog.errorNetwork',
  timeout: 'urlDialog.errorTimeout',
};

/** Default i18n key used when error type is not in SCRAPER_ERROR_I18N_KEYS. */
export const DEFAULT_SCRAPER_ERROR_I18N_KEY = 'urlDialog.errorScraping';
