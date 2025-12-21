/**
 * BaseRecipeProvider - Abstract base class for recipe providers
 *
 * Implements the RecipeProvider interface with common functionality for
 * discovering, parsing, and fetching recipes from external websites.
 *
 * @module providers/BaseRecipeProvider
 */

import { isScraperSuccess, recipeScraper } from '@utils/RecipeScraper';
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

/** Delay before retrying failed pages (longer to avoid rate limits) */
const RETRY_DELAY_MS = 2000;

/** Maximum number of retry attempts for pages with no results */
const MAX_RETRIES = 3;

/** Reduced concurrency for retries to be gentler on the server */
const RETRY_CONCURRENT_LIMIT = 1;

/** Maximum time to wait for an HTTP request before timing out */
const FETCH_TIMEOUT_MS = 15000;

/** Maximum concurrent image fetch requests to prevent memory exhaustion */
const MAX_CONCURRENT_IMAGE_FETCHES = 5;

/** Number of category pages to fetch concurrently */
const CONCURRENT_CATEGORY_LIMIT = 3;

/**
 * Internal state for tracking discovery progress.
 * Used by BaseRecipeProvider during recipe URL discovery.
 */
export interface DiscoveryState {
  /** List of discovered recipes */
  recipes: DiscoveredRecipe[];
  /** Set of already discovered URLs to avoid duplicates */
  discoveredUrls: Set<string>;
  /** Number of category pages scanned */
  categoriesScanned: number;
  /** List of category URLs that returned no recipes */
  emptyPages: string[];
  /** Index of the last page that had recipes */
  lastNonEmptyPageIndex: number;
  /** Whether the max recipe limit has been reached */
  reachedMaxRecipes: boolean;
}

/**
 * Result of processing a single category page.
 * Contains the extracted recipe links from the page.
 */
export interface CategoryResult {
  /** URL of the category page that was fetched */
  categoryUrl: string;
  /** List of recipe links extracted from the page */
  links: { url: string; title?: string; imageUrl?: string }[];
}

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
   * Scans category pages in batches and yields progress updates as recipes are found.
   * Automatically retries pages that appear rate-limited.
   *
   * @param options - Discovery options including abort signal and max recipes
   * @yields Progress updates with discovered recipes
   */
  async *discoverRecipeUrls(options: DiscoveryOptions = {}): AsyncGenerator<DiscoveryProgress> {
    const { maxRecipes, signal } = options;
    const baseUrl = await this.getBaseUrl();
    const categoryUrls = await this.discoverCategoryUrls(baseUrl, signal);

    bulkImportLogger.info('Starting recipe discovery', {
      provider: this.id,
      categoryCount: categoryUrls.length,
      maxRecipes,
    });

    const state = this.createDiscoveryState();

    yield this.createProgressUpdate(state, categoryUrls.length, false);

    yield* this.scanCategoryPages(categoryUrls, state, maxRecipes, signal);

    await this.retryEmptyPages(categoryUrls, state, maxRecipes, signal);

    bulkImportLogger.info('Discovery complete', {
      provider: this.id,
      totalRecipes: state.recipes.length,
    });

    yield this.createProgressUpdate(state, categoryUrls.length, true);
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
          const result = await recipeScraper.scrapeRecipeFromHtml(html, recipe.url);

          if (isScraperSuccess(result)) {
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
    const result = await recipeScraper.scrapeRecipeFromHtml(html, url);

    if (!isScraperSuccess(result)) {
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
      const metadata = await this.extractPreviewMetadata(html, url);
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
   * @param url - Recipe page URL for host detection
   * @returns Promise resolving to preview metadata with title and image URL
   */
  protected async extractPreviewMetadata(
    html: string,
    url: string
  ): Promise<RecipePreviewMetadata> {
    const result = await recipeScraper.scrapeRecipeFromHtml(html, url);
    if (!isScraperSuccess(result)) {
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
   * Creates initial discovery state
   */
  private createDiscoveryState(): DiscoveryState {
    return {
      recipes: [],
      discoveredUrls: new Set<string>(),
      categoriesScanned: 0,
      emptyPages: [],
      lastNonEmptyPageIndex: -1,
      reachedMaxRecipes: false,
    };
  }

  /**
   * Creates a progress update object from current state
   */
  private createProgressUpdate(
    state: DiscoveryState,
    totalCategories: number,
    isComplete: boolean
  ): DiscoveryProgress {
    return {
      phase: isComplete ? 'complete' : 'discovering',
      recipesFound: state.recipes.length,
      categoriesScanned: isComplete ? totalCategories : state.categoriesScanned,
      totalCategories,
      isComplete,
      recipes: [...state.recipes],
    };
  }

  /**
   * Scans category pages in batches and yields progress updates
   */
  private async *scanCategoryPages(
    categoryUrls: string[],
    state: DiscoveryState,
    maxRecipes: number | undefined,
    signal: AbortSignal | undefined
  ): AsyncGenerator<DiscoveryProgress> {
    for (let i = 0; i < categoryUrls.length; i += CONCURRENT_CATEGORY_LIMIT) {
      if (signal?.aborted || state.reachedMaxRecipes) break;

      const batch = categoryUrls.slice(i, i + CONCURRENT_CATEGORY_LIMIT);
      const results = await this.fetchCategoryBatch(batch, signal);

      this.processCategoryResults(results, batch, state, i, maxRecipes);

      yield this.createProgressUpdate(state, categoryUrls.length, false);

      if (!state.reachedMaxRecipes && i + CONCURRENT_CATEGORY_LIMIT < categoryUrls.length) {
        await this.delay(FETCH_DELAY_MS);
      }
    }
  }

  /**
   * Fetches a batch of category pages concurrently
   */
  private async fetchCategoryBatch(
    urls: string[],
    signal: AbortSignal | undefined
  ): Promise<PromiseSettledResult<CategoryResult>[]> {
    return Promise.allSettled(
      urls.map(async categoryUrl => {
        const html = await this.fetchHtml(categoryUrl, signal);
        return {
          categoryUrl,
          links: this.extractRecipeLinksFromHtml(html),
        };
      })
    );
  }

  /**
   * Processes results from a batch of category page fetches
   */
  private processCategoryResults(
    results: PromiseSettledResult<CategoryResult>[],
    batch: string[],
    state: DiscoveryState,
    batchStartIndex: number,
    maxRecipes: number | undefined
  ): void {
    for (let j = 0; j < results.length; j++) {
      if (state.reachedMaxRecipes) break;

      const result = results[j];
      const categoryUrl = batch[j];
      state.categoriesScanned++;

      if (result.status === 'fulfilled') {
        this.processSuccessfulCategory(result.value, state, batchStartIndex + j, maxRecipes);
      } else {
        this.processFailedCategory(categoryUrl, result.reason, state);
      }
    }
  }

  /**
   * Processes a successfully fetched category page
   */
  private processSuccessfulCategory(
    result: CategoryResult,
    state: DiscoveryState,
    pageIndex: number,
    maxRecipes: number | undefined
  ): void {
    const { categoryUrl, links } = result;

    bulkImportLogger.debug('Found recipe links in category', {
      category: categoryUrl,
      linkCount: links.length,
    });

    if (links.length === 0) {
      state.emptyPages.push(categoryUrl);
      return;
    }

    state.lastNonEmptyPageIndex = pageIndex;
    this.addRecipesToState(links, state, maxRecipes);
  }

  /**
   * Processes a failed category page fetch
   */
  private processFailedCategory(categoryUrl: string, error: unknown, state: DiscoveryState): void {
    bulkImportLogger.warn('Failed to fetch category', {
      error: error instanceof Error ? error.message : String(error),
    });
    state.emptyPages.push(categoryUrl);
  }

  /**
   * Adds discovered recipe links to state, avoiding duplicates
   */
  private addRecipesToState(
    links: { url: string; title?: string; imageUrl?: string }[],
    state: DiscoveryState,
    maxRecipes: number | undefined
  ): void {
    for (const link of links) {
      if (state.reachedMaxRecipes) break;

      if (!state.discoveredUrls.has(link.url)) {
        state.discoveredUrls.add(link.url);
        state.recipes.push({
          url: link.url,
          title: link.title ?? '',
          imageUrl: link.imageUrl,
        });

        if (maxRecipes && state.recipes.length >= maxRecipes) {
          bulkImportLogger.info('Max recipes reached', { count: state.recipes.length });
          state.reachedMaxRecipes = true;
        }
      }
    }
  }

  /**
   * Retries empty pages that appeared before the last successful page (likely rate-limited)
   */
  private async retryEmptyPages(
    categoryUrls: string[],
    state: DiscoveryState,
    maxRecipes: number | undefined,
    signal: AbortSignal | undefined
  ): Promise<void> {
    const pagesToRetry = state.emptyPages.filter(url => {
      const pageIndex = categoryUrls.indexOf(url);
      return pageIndex !== -1 && pageIndex < state.lastNonEmptyPageIndex;
    });

    if (pagesToRetry.length === 0 || signal?.aborted || state.reachedMaxRecipes) {
      return;
    }

    bulkImportLogger.info('Retrying potentially rate-limited pages', {
      count: pagesToRetry.length,
    });

    for (let attempt = 1; attempt <= MAX_RETRIES && pagesToRetry.length > 0; attempt++) {
      await this.delay(RETRY_DELAY_MS * attempt);
      if (signal?.aborted) break;

      const stillEmpty = await this.executeRetryAttempt(
        pagesToRetry,
        state,
        maxRecipes,
        signal,
        attempt
      );

      pagesToRetry.length = 0;
      pagesToRetry.push(...stillEmpty);

      if (pagesToRetry.length === 0) {
        bulkImportLogger.info('All retries succeeded');
        break;
      }
    }

    if (pagesToRetry.length > 0) {
      bulkImportLogger.warn('Some pages still empty after retries', {
        count: pagesToRetry.length,
      });
    }
  }

  /**
   * Executes a single retry attempt for failed pages
   */
  private async executeRetryAttempt(
    pagesToRetry: string[],
    state: DiscoveryState,
    maxRecipes: number | undefined,
    signal: AbortSignal | undefined,
    attempt: number
  ): Promise<string[]> {
    const stillEmpty: string[] = [];
    let recovered = 0;

    for (let i = 0; i < pagesToRetry.length; i += RETRY_CONCURRENT_LIMIT) {
      if (signal?.aborted || state.reachedMaxRecipes) break;

      const batch = pagesToRetry.slice(i, i + RETRY_CONCURRENT_LIMIT);
      const results = await this.fetchCategoryBatch(batch, signal);

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const categoryUrl = batch[j];

        if (result.status === 'fulfilled' && result.value.links.length > 0) {
          recovered++;
          this.addRecipesToState(result.value.links, state, maxRecipes);
        } else {
          stillEmpty.push(categoryUrl);
        }
      }

      if (i + RETRY_CONCURRENT_LIMIT < pagesToRetry.length) {
        await this.delay(RETRY_DELAY_MS);
      }
    }

    bulkImportLogger.info('Retry attempt completed', {
      attempt,
      recovered,
      stillPending: stillEmpty.length,
    });

    return stillEmpty;
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
          const metadata = await this.extractPreviewMetadata(html, url);
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
