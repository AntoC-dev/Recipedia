/**
 * RecipeScraper - TypeScript wrapper for the recipe-scraper module.
 *
 * Provides a complete, type-safe API for scraping recipes from URLs.
 * - Android: Uses Python recipe-scrapers library via Chaquopy
 * - iOS: Uses native schema.org JSON-LD parsing via SwiftSoup
 * - Web: Uses TypeScript schema.org JSON-LD parsing
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

import {Platform} from 'react-native';
import {RecipeScraperWeb} from './web/RecipeScraperWeb';
import type {HostSupportedResult, ScraperErrorResult, ScraperResult, SupportedHostsResult,} from './types';

type ScraperInterface = {
    scrapeRecipe(url: string, wildMode?: boolean): Promise<string>;
    scrapeRecipeFromHtml(html: string, url: string, wildMode?: boolean): Promise<string>;
    getSupportedHosts(): Promise<string>;
    isHostSupported(host: string): Promise<string>;
    isAvailable(): Promise<boolean>;
};

const isTestEnv = process.env.NODE_ENV === 'test';
const useWebImplementation = Platform.OS === 'web' || isTestEnv;

function getScraper(): ScraperInterface {
    if (useWebImplementation) {
        return new RecipeScraperWeb();
    }
    // Only import native module when actually needed (not in test/web environments)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./RecipeScraperModule').default;
}

const scraper = getScraper();

/**
 * Options for scraping a recipe.
 */
export interface ScrapeOptions {
    /**
     * If true (default), attempt to scrape unsupported sites using schema.org.
     * Disable for stricter scraping that only works on known sites.
     * Note: On iOS, this option is ignored as it always uses schema.org parsing.
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
    /**
     * Checks if the scraper is available on the current platform.
     * Always returns true on Android, iOS, and Web.
     */
    async isAvailable(): Promise<boolean> {
        try {
            return await scraper.isAvailable();
        } catch {
            return false;
        }
    }

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
            const json = await scraper.scrapeRecipe(url, options?.wildMode ?? true);
            return JSON.parse(json);
        } catch (error) {
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
            const json = await scraper.scrapeRecipeFromHtml(
                html,
                url,
                options?.wildMode ?? true
            );
            return JSON.parse(json);
        } catch (error) {
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
        try {
            const json = await scraper.getSupportedHosts();
            return JSON.parse(json);
        } catch (error) {
            return this.exceptionError(error);
        }
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
        try {
            const json = await scraper.isHostSupported(host);
            return JSON.parse(json);
        } catch (error) {
            return this.exceptionError(error);
        }
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
}

/**
 * Default scraper instance for convenience.
 */
export const recipeScraper = new RecipeScraper();
