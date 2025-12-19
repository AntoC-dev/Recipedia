/**
 * BaseRecipeProvider - Abstract base class for recipe providers
 *
 * Implements the RecipeProvider interface with common functionality for
 * discovering, parsing, and fetching recipes from external websites.
 *
 * @module providers/BaseRecipeProvider
 */

import { SchemaRecipeParser } from '@app/modules/recipe-scraper/src/web/SchemaRecipeParser';
import {
  cleanImageUrl,
  convertScrapedRecipe,
  IgnoredIngredientPatterns,
} from '@utils/RecipeScraperConverter';
import { downloadImageToCache } from '@utils/FileGestion';
import {
  ConvertedImportRecipe,
  DiscoveredRecipe,
  DiscoveryOptions,
  DiscoveryProgress,
  FailedDiscoveryRecipe,
  FetchedRecipe,
  FullyDiscoveredRecipe,
  ParsingProgress,
  RecipeProvider,
} from '@customTypes/BulkImportTypes';
import { bulkImportLogger } from '@utils/logger';

/** Delay between HTTP requests to avoid rate limiting */
const FETCH_DELAY_MS = 300;

/** Maximum time to wait for an HTTP request before timing out */
const FETCH_TIMEOUT_MS = 15000;

/** Maximum concurrent image fetch requests to prevent memory exhaustion */
const MAX_CONCURRENT_IMAGE_FETCHES = 5;

/**
 * Preview metadata extracted from a recipe page for display before full parsing
 */
export interface RecipePreviewMetadata {
  /** Recipe title extracted from JSON-LD or null if not found */
  title: string | null;
  /** Recipe image URL extracted from JSON-LD or null if not found */
  imageUrl: string | null;
}

/**
 * Abstract base class for recipe providers
 *
 * Implements the RecipeProvider interface with common functionality for
 * discovering, parsing, and fetching recipes from external websites.
 * Subclasses must implement provider-specific methods for URL extraction.
 */
export abstract class BaseRecipeProvider implements RecipeProvider {
  /** Unique identifier for this provider */
  abstract readonly id: string;

  /** Display name for this provider */
  abstract readonly name: string;

  /** URL to the provider's logo image */
  abstract readonly logoUrl: string;

  /**
   * JSON-LD schema parser instance for extracting recipe data
   * @hidden
   */
  protected parser = new SchemaRecipeParser();

  /** Currently active image fetch count */
  private activeImageFetches = 0;

  /** Queue of pending image fetch requests */
  private pendingImageFetches: {
    url: string;
    onImageLoaded: (recipeUrl: string, imageUrl: string) => void;
    signal?: AbortSignal;
  }[] = [];

  /**
   * Gets the base URL for this provider based on user locale
   *
   * @returns Promise resolving to the provider's base URL
   */
  abstract getBaseUrl(): Promise<string>;

  /**
   * Discovers all recipe category URLs from the provider
   *
   * @param baseUrl - The provider's base URL
   * @param signal - Optional abort signal for cancellation
   * @returns Promise resolving to array of category page URLs
   */
  abstract discoverCategoryUrls(baseUrl: string, signal?: AbortSignal): Promise<string[]>;

  /**
   * Extracts recipe links from an HTML page
   *
   * @param html - Raw HTML content of a page
   * @returns Array of discovered recipe links with optional title and image
   */
  abstract extractRecipeLinksFromHtml(
    html: string
  ): { url: string; title?: string; imageUrl?: string }[];

  /**
   * Discovers recipe URLs from the provider with streaming progress
   *
   * Scans category pages and yields progress updates as recipes are found.
   * Optionally triggers background image fetching via the onImageLoaded callback.
   *
   * @param options - Discovery options including abort signal and callbacks
   * @yields Progress updates with discovered recipes
   */
  async *discoverRecipeUrls(options: DiscoveryOptions = {}): AsyncGenerator<DiscoveryProgress> {
    const { maxRecipes, signal } = options;
    const baseUrl = await this.getBaseUrl();
    const recipes: DiscoveredRecipe[] = [];
    const discoveredUrls = new Set<string>();

    const categoryUrls = await this.discoverCategoryUrls(baseUrl, signal);

    bulkImportLogger.info('Starting recipe discovery', {
      provider: this.id,
      categoryCount: categoryUrls.length,
      maxRecipes,
    });

    yield {
      phase: 'discovering',
      recipesFound: 0,
      categoriesScanned: 0,
      totalCategories: categoryUrls.length,
      isComplete: false,
      recipes: [],
    };

    const CONCURRENT_CATEGORY_LIMIT = 3;
    let categoriesScanned = 0;
    let reachedMaxRecipes = false;

    for (let i = 0; i < categoryUrls.length; i += CONCURRENT_CATEGORY_LIMIT) {
      if (signal?.aborted) {
        bulkImportLogger.info('Discovery aborted by user');
        break;
      }

      if (reachedMaxRecipes) {
        break;
      }

      const batch = categoryUrls.slice(i, i + CONCURRENT_CATEGORY_LIMIT);

      const results = await Promise.allSettled(
        batch.map(async categoryUrl => {
          const html = await this.fetchHtml(categoryUrl, signal);
          return {
            categoryUrl,
            links: this.extractRecipeLinksFromHtml(html),
          };
        })
      );

      for (const result of results) {
        categoriesScanned++;

        if (result.status === 'fulfilled') {
          const { categoryUrl, links } = result.value;

          bulkImportLogger.debug('Found recipe links in category', {
            category: categoryUrl,
            linkCount: links.length,
          });

          for (const link of links) {
            if (!discoveredUrls.has(link.url)) {
              discoveredUrls.add(link.url);
              recipes.push({
                url: link.url,
                title: link.title ?? '',
                imageUrl: link.imageUrl,
              });

              if (maxRecipes && recipes.length >= maxRecipes) {
                bulkImportLogger.info('Max recipes reached', { count: recipes.length });
                reachedMaxRecipes = true;
                break;
              }
            }
          }
        } else {
          bulkImportLogger.warn('Failed to fetch category', {
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }

        if (reachedMaxRecipes) {
          break;
        }
      }

      yield {
        phase: 'discovering',
        recipesFound: recipes.length,
        categoriesScanned,
        totalCategories: categoryUrls.length,
        isComplete: false,
        recipes: [...recipes],
      };

      if (!reachedMaxRecipes && i + CONCURRENT_CATEGORY_LIMIT < categoryUrls.length) {
        await this.delay(FETCH_DELAY_MS);
      }
    }

    bulkImportLogger.info('Discovery complete', {
      provider: this.id,
      totalRecipes: recipes.length,
    });

    yield {
      phase: 'complete',
      recipesFound: recipes.length,
      categoriesScanned: categoryUrls.length,
      totalCategories: categoryUrls.length,
      isComplete: true,
      recipes: [...recipes],
    };
  }

  /**
   * Parses selected recipes to extract full recipe data
   *
   * Fetches and parses each selected recipe, downloading images to cache
   * and converting to the app's internal format. Yields progress updates
   * for UI feedback during the parsing process.
   *
   * @param selectedRecipes - Recipes selected by the user for import
   * @param options - Parsing options including abort signal and default persons
   * @yields Progress updates with parsed and failed recipes
   */
  async *parseSelectedRecipes(
    selectedRecipes: DiscoveredRecipe[],
    options: DiscoveryOptions = {}
  ): AsyncGenerator<ParsingProgress> {
    const {
      signal,
      defaultPersons = 4,
      ignoredPatterns = { prefixes: [], exactMatches: [] },
    } = options;
    const parsedRecipes: FullyDiscoveredRecipe[] = [];
    const failedRecipes: FailedDiscoveryRecipe[] = [];

    bulkImportLogger.info('Starting recipe parsing', {
      provider: this.id,
      count: selectedRecipes.length,
    });

    const CONCURRENT_PARSE_LIMIT = 3;
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
        batch.map(async recipe => {
          const html = await this.fetchHtml(recipe.url, signal);
          const result = this.parser.parse(html, recipe.url);

          if (result.success) {
            const converted = convertScrapedRecipe(result.data, ignoredPatterns, defaultPersons);

            let localImageUri: string | undefined;
            const imageUrl = cleanImageUrl(converted.image_Source || recipe.imageUrl || '');
            if (imageUrl) {
              const downloadedUri = await downloadImageToCache(imageUrl);
              localImageUri = downloadedUri || undefined;
            }

            return {
              success: true as const,
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
          } else {
            return {
              success: false as const,
              recipe,
              error: result.error.message,
            };
          }
        })
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
        await this.delay(FETCH_DELAY_MS);
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
      provider: this.id,
      totalParsed: parsedRecipes.length,
      totalFailed: failedRecipes.length,
    });
  }

  /**
   * Fetches and parses a single recipe from its URL
   *
   * @param url - URL of the recipe page to fetch
   * @param defaultPersons - Default serving size if not specified in recipe
   * @param ignoredPatterns - Patterns for ingredients to skip during parsing
   * @param signal - Optional abort signal for cancellation
   * @returns Promise resolving to the fetched and converted recipe
   * @throws Error if recipe cannot be parsed
   */
  async fetchRecipe(
    url: string,
    defaultPersons: number,
    ignoredPatterns: IgnoredIngredientPatterns,
    signal?: AbortSignal
  ): Promise<FetchedRecipe> {
    bulkImportLogger.debug('Fetching recipe', { url });

    const html = await this.fetchHtml(url, signal);
    const result = this.parser.parse(html, url);

    if (!result.success) {
      throw new Error(`Failed to parse recipe: ${result.error.message}`);
    }

    const converted = convertScrapedRecipe(result.data, ignoredPatterns, defaultPersons);

    const importRecipe: ConvertedImportRecipe = {
      title: converted.title ?? '',
      description: converted.description ?? '',
      imageUrl: converted.image_Source ?? '',
      persons: converted.persons ?? defaultPersons,
      time: converted.time ?? 0,
      ingredients: converted.ingredients,
      tags: converted.tags ?? [],
      preparation: converted.preparation ?? [],
      nutrition: converted.nutrition,
      skippedIngredients: converted.skippedIngredients,
      sourceUrl: url,
      sourceProvider: this.id,
    };

    bulkImportLogger.debug('Recipe parsed successfully', {
      url,
      title: importRecipe.title,
      ingredientCount: importRecipe.ingredients.length,
      tagCount: importRecipe.tags.length,
    });

    return {
      url,
      converted: importRecipe,
    };
  }

  /**
   * Fetches just the image URL for a recipe page on-demand
   *
   * Used for visibility-based lazy loading of images. Fetches the recipe
   * page HTML and extracts the image URL from JSON-LD schema data.
   *
   * @param url - Recipe page URL to fetch image for
   * @param signal - Abort signal for cancellation
   * @returns Promise resolving to image URL or null if not found/failed
   */
  async fetchImageUrlForRecipe(url: string, signal: AbortSignal): Promise<string | null> {
    try {
      const html = await this.fetchHtml(url, signal);
      const metadata = this.extractPreviewMetadata(html);
      return metadata.imageUrl;
    } catch {
      return null;
    }
  }

  /**
   * Fetches HTML content from a URL with timeout handling
   *
   * @param url - URL to fetch
   * @param signal - Optional abort signal for cancellation
   * @returns Promise resolving to the HTML content
   * @throws Error if request fails or times out
   */
  protected async fetchHtml(url: string, signal?: AbortSignal): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const combinedSignal = signal
      ? this.combineAbortSignals(signal, controller.signal)
      : controller.signal;

    try {
      const response = await fetch(url, {
        signal: combinedSignal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipediaApp/1.0; +https://github.com/recipedia)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Extracts preview metadata from HTML for display before full parsing
   *
   * @param html - Raw HTML content
   * @returns Preview metadata with title and image URL
   */
  protected extractPreviewMetadata(html: string): RecipePreviewMetadata {
    const result = this.parser.parse(html, '');
    if (!result.success) {
      return { title: null, imageUrl: null };
    }
    return {
      title: result.data.title ?? null,
      imageUrl: result.data.image ? cleanImageUrl(result.data.image) : null,
    };
  }

  /**
   * Delays execution for rate limiting
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Queues a recipe image fetch for background processing
   *
   * Adds the request to a queue and triggers processing. Uses a semaphore
   * pattern to limit concurrent requests and prevent memory exhaustion.
   *
   * @param url - Recipe URL to fetch image for
   * @param onImageLoaded - Callback invoked when an image URL is found
   * @param signal - Optional abort signal for cancellation
   */
  private fetchSingleImageInBackground(
    url: string,
    onImageLoaded: (recipeUrl: string, imageUrl: string) => void,
    signal?: AbortSignal
  ): void {
    this.pendingImageFetches.push({ url, onImageLoaded, signal });
    this.processImageFetchQueue();
  }

  /**
   * Processes queued image fetch requests with concurrency limiting
   *
   * Dequeues requests and executes them up to MAX_CONCURRENT_IMAGE_FETCHES
   * at a time. Each completed request triggers queue processing to maintain
   * throughput while preventing memory exhaustion.
   */
  private processImageFetchQueue(): void {
    while (
      this.activeImageFetches < MAX_CONCURRENT_IMAGE_FETCHES &&
      this.pendingImageFetches.length > 0
    ) {
      const request = this.pendingImageFetches.shift();
      if (!request) break;

      this.activeImageFetches++;

      (async () => {
        const { url, onImageLoaded, signal } = request;
        if (signal?.aborted) {
          this.activeImageFetches--;
          this.processImageFetchQueue();
          return;
        }
        try {
          const html = await this.fetchHtml(url, signal);
          const metadata = this.extractPreviewMetadata(html);
          if (metadata.imageUrl) {
            onImageLoaded(url, metadata.imageUrl);
          }
        } catch {
          // Silently ignore - image loading is optional
        } finally {
          this.activeImageFetches--;
          this.processImageFetchQueue();
        }
      })();
    }
  }

  /**
   * Combines two abort signals into one
   *
   * Creates a new abort signal that triggers when either input signal aborts.
   *
   * @param signal1 - First abort signal
   * @param signal2 - Second abort signal
   * @returns Combined abort signal
   */
  private combineAbortSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const abort = () => controller.abort();

    signal1.addEventListener('abort', abort);
    signal2.addEventListener('abort', abort);

    if (signal1.aborted || signal2.aborted) {
      controller.abort();
    }

    return controller.signal;
  }
}
