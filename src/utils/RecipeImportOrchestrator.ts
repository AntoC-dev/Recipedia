/**
 * RecipeImportOrchestrator - Pure orchestration utilities for the recipe scraper
 *
 * Glues together a `RecipeProvider` with scraper functions and conversion
 * helpers. Lives outside any React component so the bulk-import flow can
 * be unit-tested in isolation, while `useRecipeScraper` exposes these
 * utilities to UI consumers.
 *
 * @module utils/RecipeImportOrchestrator
 */

import {
  DiscoveredRecipe,
  FailedDiscoveryRecipe,
  FullyDiscoveredRecipe,
  ParsingProgress,
  RecipeProvider,
} from '@customTypes/BulkImportTypes';
import {
  cleanImageUrl,
  convertScrapedRecipe,
  IgnoredIngredientPatterns,
} from '@utils/RecipeScraperConverter';
import { isScraperSuccess } from '@app/modules/recipe-scraper';
import type { ScrapedRecipe, ScraperResult } from '@app/modules/recipe-scraper';
import { fetchHtml, isPlaceholderImageUrl } from '@utils/UrlHelpers';
import { downloadImageToCache } from '@utils/FileGestion';
import { bulkImportLogger } from '@utils/logger';

/** Delay between batches of recipe-page fetches to avoid rate limiting */
const FETCH_DELAY_MS = 300;

/** Number of recipe pages parsed concurrently per batch */
const CONCURRENT_PARSE_LIMIT = 3;

/** Function signature for scraping recipe HTML — injected by the caller. */
export type ScrapeFromHtml = (html: string, url: string) => Promise<ScraperResult<ScrapedRecipe>>;

/**
 * Options accepted by {@link parseSelectedRecipes}
 */
export interface ParseSelectedOptions {
  /** Scrape function injected from context — no singleton import needed */
  scrapeFromHtml: ScrapeFromHtml;
  /** Abort signal for cancelling the operation */
  signal?: AbortSignal;
  /** Default serving size used when the recipe omits it */
  defaultPersons?: number;
  /** Ingredient patterns to skip during conversion */
  ignoredPatterns?: IgnoredIngredientPatterns;
}

/**
 * Parses a list of selected recipes by fetching each page, scraping it via
 * the recipe-scraper module, converting the result to the app's import shape,
 * and downloading the recipe image to local cache.
 *
 * Yields streaming progress updates for UI feedback. The provider is used
 * only for HTML-side pre-processing (`extractImageFromHtml`) — all scraping
 * and conversion is performed here.
 *
 * @param provider - The recipe provider that owns the selected URLs
 * @param selectedRecipes - The recipes the user picked during discovery
 * @param options - Cancellation, default servings, and ingredient filters
 */
export async function* parseSelectedRecipes(
  provider: RecipeProvider,
  selectedRecipes: DiscoveredRecipe[],
  options: ParseSelectedOptions
): AsyncGenerator<ParsingProgress> {
  const {
    scrapeFromHtml,
    signal,
    defaultPersons = 4,
    ignoredPatterns = { prefixes: [], exactMatches: [] },
  } = options;

  const parsedRecipes: FullyDiscoveredRecipe[] = [];
  const failedRecipes: FailedDiscoveryRecipe[] = [];

  bulkImportLogger.info('Starting recipe parsing', {
    provider: provider.id,
    count: selectedRecipes.length,
  });

  let processedCount = 0;

  for (let i = 0; i < selectedRecipes.length; i += CONCURRENT_PARSE_LIMIT) {
    if (signal?.aborted) {
      bulkImportLogger.info('Parsing aborted by user');
      break;
    }

    const batch = selectedRecipes.slice(i, i + CONCURRENT_PARSE_LIMIT);

    yield {
      phase: 'parsing',
      current: processedCount,
      total: selectedRecipes.length,
      currentRecipeTitle: batch.map(r => r.title).join(', '),
      parsedRecipes: [...parsedRecipes],
      failedRecipes: [...failedRecipes],
    };

    const results = await Promise.allSettled(
      batch.map(recipe =>
        parseSingleRecipe(recipe, scrapeFromHtml, defaultPersons, ignoredPatterns, signal)
      )
    );

    for (let j = 0; j < results.length; j++) {
      const originalRecipe = batch[j];
      const result = results[j];
      processedCount++;

      if (result.status === 'fulfilled') {
        if (result.value.success) {
          parsedRecipes.push(result.value.recipe);
          bulkImportLogger.debug('Recipe parsed successfully', {
            url: result.value.recipe.url,
            title: result.value.recipe.title,
            hasImage: !!result.value.recipe.localImageUri,
          });
        } else {
          failedRecipes.push({
            url: originalRecipe.url,
            title: originalRecipe.title,
            error: result.value.error,
          });
          bulkImportLogger.warn('Failed to parse recipe', {
            url: originalRecipe.url,
            error: result.value.error,
          });
        }
      } else {
        const errorMessage =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        failedRecipes.push({
          url: originalRecipe.url,
          title: originalRecipe.title,
          error: errorMessage,
        });
        bulkImportLogger.warn('Failed to fetch recipe', {
          url: originalRecipe.url,
          error: errorMessage,
        });
      }
    }

    if (i + CONCURRENT_PARSE_LIMIT < selectedRecipes.length) {
      await delay(FETCH_DELAY_MS);
    }
  }

  yield {
    phase: 'complete',
    current: selectedRecipes.length,
    total: selectedRecipes.length,
    parsedRecipes: [...parsedRecipes],
    failedRecipes: [...failedRecipes],
  };

  bulkImportLogger.info('Parsing complete', {
    provider: provider.id,
    totalParsed: parsedRecipes.length,
    totalFailed: failedRecipes.length,
  });
}

/**
 * Fetches the recipe page for `url` and resolves a usable image URL.
 *
 * Tries the provider's HTML-side extractor first (e.g. JSON-LD parsing)
 * before falling back to the recipe-scraper output. Placeholder images are
 * filtered out. Returns `null` when nothing usable is found.
 *
 * @param provider - The recipe provider for `url`
 * @param url - Recipe page URL
 * @param signal - Abort signal for cancellation
 */
export async function fetchRecipeImageUrl(
  provider: RecipeProvider,
  url: string,
  signal: AbortSignal,
  scrapeFromHtml: ScrapeFromHtml
): Promise<string | null> {
  try {
    const { html } = await fetchHtml(url, signal);

    const providerImage = provider.extractImageFromHtml(html);
    if (providerImage && !isPlaceholderImageUrl(providerImage)) {
      return providerImage;
    }

    const scraperResult = await scrapeFromHtml(html, url);
    if (isScraperSuccess(scraperResult) && scraperResult.data.image) {
      const cleaned = cleanImageUrl(scraperResult.data.image);
      if (cleaned && !isPlaceholderImageUrl(cleaned)) {
        return cleaned;
      }
    }

    return null;
  } catch (error) {
    bulkImportLogger.warn('Failed to fetch recipe image URL', { url, error });
    return null;
  }
}

interface ParseSuccess {
  success: true;
  recipe: FullyDiscoveredRecipe;
}

interface ParseFailure {
  success: false;
  error: string;
}

async function parseSingleRecipe(
  recipe: DiscoveredRecipe,
  scrapeFromHtml: ScrapeFromHtml,
  defaultPersons: number,
  ignoredPatterns: IgnoredIngredientPatterns,
  signal: AbortSignal | undefined
): Promise<ParseSuccess | ParseFailure> {
  const { html } = await fetchHtml(recipe.url, signal);
  const result = await scrapeFromHtml(html, recipe.url);

  if (!isScraperSuccess(result)) {
    return { success: false, error: result.error.message };
  }

  const converted = convertScrapedRecipe(result.data, ignoredPatterns, defaultPersons);

  let localImageUri: string | undefined;
  const rawImageUrl = cleanImageUrl(converted.image_Source || recipe.imageUrl || '');
  const imageUrl = isPlaceholderImageUrl(rawImageUrl) ? '' : rawImageUrl;
  if (imageUrl) {
    const downloadedUri = await downloadImageToCache(imageUrl);
    localImageUri = downloadedUri || undefined;
  }

  return {
    success: true,
    recipe: {
      url: recipe.url,
      title: converted.title || recipe.title,
      description: converted.description || '',
      localImageUri,
      persons: converted.persons ?? defaultPersons,
      time: converted.time ?? 0,
      ingredients: converted.ingredients,
      tags: converted.tags ?? [],
      preparation: converted.preparation ?? [],
      nutrition: converted.nutrition,
      skippedIngredients: converted.skippedIngredients,
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
