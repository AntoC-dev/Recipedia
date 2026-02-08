/**
 * RecipeScraper - App-level re-exports from the recipe-scraper module.
 *
 * This file provides convenient access to the recipe scraper functionality
 * for use throughout the app. All implementation details are in the module.
 */

import type { ScraperResult, ScraperSuccessResult } from '@app/modules/recipe-scraper';
import { ScraperErrorTypes } from '@app/modules/recipe-scraper';

export { RecipeScraper, recipeScraper, ScraperErrorTypes } from '@app/modules/recipe-scraper';

export type {
  HostSupportedResult,
  IngredientGroup,
  ParsedIngredient,
  ParsedInstruction,
  RecipeLink,
  ScrapeOptions,
  ScrapedNutrients,
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
 * Maps Python scraper error types to i18n translation keys.
 *
 * Used to display user-friendly error messages instead of raw Python exceptions.
 * Keys are Python exception class names, values are i18n keys.
 */
export const SCRAPER_ERROR_I18N_KEYS: Record<string, string> = {
  [ScraperErrorTypes.NoSchemaFoundInWildMode]: 'urlDialog.errorNoRecipeFound',
  [ScraperErrorTypes.NoRecipeFoundError]: 'urlDialog.errorNoRecipeFound',
  [ScraperErrorTypes.WebsiteNotImplementedError]: 'urlDialog.errorUnsupportedSite',
  [ScraperErrorTypes.ConnectionError]: 'urlDialog.errorNetwork',
  [ScraperErrorTypes.HTTPError]: 'urlDialog.errorNetwork',
  [ScraperErrorTypes.URLError]: 'urlDialog.errorNetwork',
  [ScraperErrorTypes.Timeout]: 'urlDialog.errorTimeout',
  [ScraperErrorTypes.AuthenticationRequired]: 'urlDialog.errorAuthRequired',
  [ScraperErrorTypes.AuthenticationFailed]: 'urlDialog.errorAuthFailed',
  [ScraperErrorTypes.UnsupportedAuthSite]: 'urlDialog.errorUnsupportedAuth',
  [ScraperErrorTypes.UnsupportedPlatform]: 'urlDialog.errorUnsupportedPlatform',
};

/** Default i18n key used when error type is not in SCRAPER_ERROR_I18N_KEYS. */
export const DEFAULT_SCRAPER_ERROR_I18N_KEY = 'urlDialog.errorScraping';
