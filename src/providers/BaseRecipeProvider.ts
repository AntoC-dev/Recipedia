/**
 * BaseRecipeProvider - Abstract base class for recipe providers
 *
 * Implements the RecipeProvider interface with common functionality for
 * discovering recipe URLs from external websites. Scraping and recipe
 * conversion are orchestrated by the `useRecipeScraper` hook so providers
 * stay free of scraper coupling and IO around content parsing.
 *
 * @module providers/BaseRecipeProvider
 */

import {
  DiscoveredRecipe,
  DiscoveryOptions,
  DiscoveryProgress,
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
 * Abstract base class for recipe providers
 *
 * Implements the RecipeProvider interface with common functionality for
 * discovering recipe URLs and identifying provider ownership. Subclasses
 * must implement provider-specific URL extraction and may override
 * {@link extractImageFromHtml} when they have a faster path than the
 * default scraper-based extraction performed by `useRecipeScraper`.
 */
export abstract class BaseRecipeProvider implements RecipeProvider {
  /** Unique identifier for this provider */
  abstract readonly id: string;

  /** Display name for this provider */
  abstract readonly name: string;

  /** URL to the provider's logo image */
  abstract readonly logoUrl: string;

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
   * Returns true if this provider can handle the given recipe source URL
   *
   * Default implementation returns false. Subclasses should override to check
   * whether the URL belongs to their domain.
   *
   * @param _url - Recipe source URL to test
   * @returns false by default
   */
  canHandleUrl(_url: string): boolean {
    return false;
  }

  /**
   * Extracts a real image URL directly from page HTML, without invoking the
   * recipe scraper.
   *
   * Default implementation returns `null`, signalling the caller (typically
   * `useRecipeScraper`) to fall back to the scraper-based image. Subclasses
   * may override when they have a cheaper or more reliable path (for example,
   * Quitoque returns a placeholder via the scraper but exposes the real image
   * in JSON-LD schema markup).
   *
   * @param _html - Raw HTML content of the recipe page
   * @returns Image URL when found via the provider-specific path, otherwise null
   */
  extractImageFromHtml(_html: string): string | null {
    return null;
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

      const result = results[j]!;
      const categoryUrl = batch[j]!;
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
        const result = results[j]!;
        const categoryUrl = batch[j]!;

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
