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
  ScrapedNutrients,
  IngredientGroup,
  RecipeLink,
  ScrapedRecipe,
  ScraperError,
  ScraperSuccessResult,
  ScraperErrorResult,
  ScraperResult,
  SupportedHostsResult,
  HostSupportedResult,
  ScrapeOptions,
} from '@app/modules/recipe-scraper';

export function isScraperSuccess<T>(result: ScraperResult<T>): result is ScraperSuccessResult<T> {
  return result.success;
}

export function isScraperError<T>(result: ScraperResult<T>): result is ScraperErrorResult {
  return !result.success;
}
