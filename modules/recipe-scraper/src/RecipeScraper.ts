/**
 * RecipeScraper - TypeScript wrapper for the recipe-scraper module.
 *
 * Provides a complete, type-safe API for scraping recipes from URLs.
 * - Android: Uses Python recipe-scrapers library (via Chaquopy) + TypeScript enhancements
 * - iOS: Uses Python recipe-scrapers library (via Pyodide WebView) + TypeScript enhancements
 * - Web: Uses TypeScript schema.org parsing + TypeScript enhancements
 *
 * All platforms use the same TypeScript enhancement module for consistent behavior.
 *
 * @example
 * ```typescript
 * import { recipeScraper } from 'recipe-scraper';
 *
 * const result = await recipeScraper.scrapeRecipe('https://allrecipes.com/recipe/...');
 * if (result.success) {
 *   console.log(result.data.title);
 *   console.log(result.data.ingredients);
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import { applyEnhancements } from './enhancements';
import type {
  HostSupportedResult,
  ScraperErrorResult,
  ScraperResult,
  SupportedHostsResult,
} from './types';
import { pyodideLogger } from '@utils/logger';
import { detectAuthRequired } from './authDetection';
import type { ScraperBackend } from './backends/ScraperBackend';
import { createBackend } from './backends/createBackend';

/**
 * Options for scraping a recipe.
 */
export interface ScrapeOptions {
  /**
   * If true (default), attempt to scrape unsupported sites using schema.org.
   * Disable for stricter scraping that only works on known sites.
   */
  wildMode?: boolean;
}

/**
 * Recipe scraper class providing access to recipe scraping.
 *
 * This class wraps the platform-specific implementation and provides type-safe result handling.
 * Supported on Android, iOS, and Web.
 */
export class RecipeScraper {
  private readonly backend: ScraperBackend = createBackend();
  private warmupPromise?: Promise<void>;

  /**
   * Scrapes a recipe from a URL.
   *
   * @param url - The recipe page URL to scrape.
   * @param options - Optional scraping options.
   * @returns A result object with either the scraped recipe data or an error.
   *
   * @example
   * ```typescript
   * const result = await scraper.scrapeRecipe('https://allrecipes.com/recipe/...');
   * if (result.success) {
   *   console.log(result.data.title);
   *   console.log(result.data.ingredients);
   * } else {
   *   console.error(result.error.message);
   * }
   * ```
   */
  async scrapeRecipe(url: string, options?: ScrapeOptions): Promise<ScraperResult> {
    try {
      pyodideLogger.debug('Scraping recipe from URL', { url });
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (!response.ok) {
        pyodideLogger.warn('Recipe fetch failed', { url, status: response.status });
        return this.errorResult('FetchError', `HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const finalUrl = response.url;

      const authError = detectAuthRequired(html, finalUrl, url);
      if (authError) {
        pyodideLogger.info('Authentication required for recipe', { url, finalUrl });
        return authError;
      }

      return this.scrapeRecipeFromHtml(html, url, options);
    } catch (error) {
      pyodideLogger.error('Scrape failed with exception', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.exceptionError(error);
    }
  }

  /**
   * Scrapes a recipe from HTML content.
   *
   * Useful when you've already fetched the HTML yourself and want to avoid
   * an additional network request.
   *
   * @param html - The HTML content of the recipe page.
   * @param url - The original URL (used for host detection and relative URLs).
   * @param options - Optional scraping options.
   * @returns A result object with either the scraped recipe data or an error.
   */
  async scrapeRecipeFromHtml(
    html: string,
    url: string,
    options?: ScrapeOptions
  ): Promise<ScraperResult> {
    try {
      const baseResult = this.enhance(
        html,
        await this.backend.scrapeHtml(html, url, options?.wildMode ?? true)
      );

      if (baseResult.success) {
        pyodideLogger.debug('Recipe scraped successfully', { url, title: baseResult.data.title });
      } else {
        pyodideLogger.warn('Recipe scraping returned error', { url, error: baseResult.error });
      }

      return baseResult;
    } catch (error) {
      pyodideLogger.error('scrapeRecipeFromHtml failed with exception', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.exceptionError(error);
    }
  }

  /**
   * Gets a list of all supported recipe website hosts.
   *
   * Note: On iOS and Web, this returns an empty array as they use generic schema.org parsing.
   *
   * @returns A result object with an array of supported host domains.
   *
   * @example
   * ```typescript
   * const result = await scraper.getSupportedHosts();
   * if (result.success) {
   *   console.log(`Supported: ${result.data.length} sites`);
   * }
   * ```
   */
  async getSupportedHosts(): Promise<SupportedHostsResult> {
    return this.guard(() => this.backend.getSupportedHosts());
  }

  /**
   * Checks if a specific host is in the supported list.
   *
   * Note: Even if a host is not in the supported list, scraping may still
   * work if the site uses schema.org recipe markup.
   * On iOS and Web, this always returns false as they use generic schema.org parsing.
   *
   * @param host - Domain to check (e.g., "allrecipes.com").
   * @returns A result object with a boolean indicating support.
   */
  async isHostSupported(host: string): Promise<HostSupportedResult> {
    return this.guard(() => this.backend.isHostSupported(host));
  }

  /**
   * Scrapes a recipe from an authentication-protected URL.
   *
   * Logs into the site using provided credentials and scrapes the recipe.
   * - Android: Uses Python requests.Session via Chaquopy.
   * - iOS: Navigates a hidden WKWebView to the login page, then injects a
   *   same-origin JavaScript script that performs the full auth flow using
   *   WebKit's own cookie jar (WKHTTPCookieStore). The fetched recipe HTML
   *   is then parsed by Pyodide.
   * Returns an error on unsupported platforms or unsupported auth hosts.
   *
   * @param url - The recipe page URL to scrape.
   * @param username - Username/email for authentication.
   * @param password - Password for authentication.
   * @param options - Optional scraping options.
   * @returns A result object with either the scraped recipe data or an error.
   */
  async scrapeRecipeAuthenticated(
    url: string,
    username: string,
    password: string,
    options?: ScrapeOptions
  ): Promise<ScraperResult> {
    pyodideLogger.debug('Starting authenticated scrape', { url });

    try {
      const outcome = await this.backend.scrapeAuthenticated(
        url,
        username,
        password,
        options?.wildMode ?? true
      );

      if ('success' in outcome) {
        return outcome;
      }

      return this.enhance(outcome.html, outcome.result);
    } catch (error) {
      return this.exceptionError(error);
    }
  }

  /**
   * Gets a list of hosts that support authentication.
   *
   * Available on Android (via Chaquopy) and iOS (via Pyodide WebView).
   * Returns an empty array on unsupported platforms.
   *
   * @returns A result object with an array of host domains supporting auth.
   */
  async getSupportedAuthHosts(): Promise<SupportedHostsResult> {
    return this.guard(() => this.backend.getSupportedAuthHosts());
  }

  /**
   * Checks if the Python runtime is ready for scraping.
   *
   * On Android, returns true once Chaquopy Python has finished initializing.
   * On iOS, returns true once Pyodide WebView has finished loading.
   * On Web, this always returns true (no Python needed).
   *
   * @returns true if ready, false if still initializing.
   */
  async isPythonReady(): Promise<boolean> {
    return this.backend.isReady();
  }

  /**
   * Returns a promise that resolves when Python is ready, or rejects on failure.
   *
   * On iOS, waits for Pyodide WebView initialization.
   * On Android, waits for Chaquopy Python initialization.
   * On Web, resolves immediately (no Python needed).
   *
   * @throws Error if Python initialization fails permanently.
   */
  async whenReady(): Promise<void> {
    this.warmupPromise ??= this.backend.warmup();
    try {
      await this.warmupPromise;
    } catch (error) {
      this.warmupPromise = undefined;
      throw error;
    }
  }

  private errorResult(type: string, message: string): ScraperErrorResult {
    return {
      success: false,
      error: { type, message },
    };
  }

  private exceptionError(error: unknown): ScraperErrorResult {
    return {
      success: false,
      error: {
        type: 'EXCEPTION',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  private async guard<T extends ScraperResult | SupportedHostsResult | HostSupportedResult>(
    op: () => Promise<T>
  ): Promise<T> {
    try {
      return await op();
    } catch (error) {
      return this.exceptionError(error) as T;
    }
  }

  private enhance(html: string, result: ScraperResult): ScraperResult {
    if (result.success) {
      result.data = applyEnhancements({ html, baseResult: result.data });
    }
    return result;
  }
}

/**
 * Default scraper instance for convenience.
 */
export const recipeScraper = new RecipeScraper();

/**
 * Hook to check if the Python scraper is ready.
 *
 * Use this to conditionally enable/disable web parsing features
 * while Python is still loading.
 *
 * @example
 * ```tsx
 * function WebParsingButton() {
 *   const isPythonReady = usePythonReady();
 *
 *   return (
 *     <Button
 *       disabled={!isPythonReady}
 *       onPress={handleParse}
 *     >
 *       {isPythonReady ? 'Parse Recipe' : 'Loading...'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function usePythonReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkReady = async () => {
      try {
        await recipeScraper.whenReady();
        if (mounted) setIsReady(true);
      } catch {
        if (mounted) setIsReady(false);
      }
    };

    checkReady();

    return () => {
      mounted = false;
    };
  }, []);

  return isReady;
}
