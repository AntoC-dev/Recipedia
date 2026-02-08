/**
 * RecipeScraper - TypeScript wrapper for the recipe-scraper module.
 *
 * Provides a complete, type-safe API for scraping recipes from URLs.
 * - Android: Uses Python recipe-scrapers library (via Chaquopy) + TypeScript enhancements
 * - iOS: Uses Python recipe-scrapers library (via PythonKit) + TypeScript enhancements
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

import {Platform} from 'react-native';
import {useEffect, useState} from 'react';
import {SchemaRecipeParser} from './web/SchemaRecipeParser';
import {applyEnhancements} from './enhancements';
import type {
    HostSupportedResult,
    ScraperErrorResult,
    ScraperResult,
    SupportedHostsResult,
} from './types';

// Auth detection patterns
const AUTH_URL_PATTERNS = [
    '/login',
    '/signin',
    '/sign-in',
    '/auth',
    '/connexion',
    '/account/login',
    '/user/login',
];
const AUTH_TITLE_KEYWORDS = [
    'login',
    'sign in',
    'connexion',
    'se connecter',
    'log in',
    'anmelden',
    'iniciar sesión',
];

type NativeScraperInterface = {
    scrapeRecipeFromHtml(
        html: string,
        url: string,
        wildMode?: boolean
    ): Promise<string>;
    getSupportedHosts(): Promise<string>;
    isHostSupported(host: string): Promise<string>;
    scrapeRecipeAuthenticated?(
        url: string,
        username: string,
        password: string,
        wildMode?: boolean
    ): Promise<string>;
    getSupportedAuthHosts?(): Promise<string>;
    isPythonAvailable?(): Promise<boolean>;
};

const isTestEnv = process.env.NODE_ENV === 'test';
const useNativeModule =
    (Platform.OS === 'android' || Platform.OS === 'ios') && !isTestEnv;

function getNativeModule(): NativeScraperInterface | null {
    if (!useNativeModule) {
        return null;
    }
    // Only import native module when actually needed (not in test/web/iOS environments)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./RecipeScraperModule').default;
}

const nativeModule = getNativeModule();
const schemaParser = new SchemaRecipeParser();

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
    async scrapeRecipe(
        url: string,
        options?: ScrapeOptions
    ): Promise<ScraperResult> {
        try {
            // 1. Fetch HTML in TypeScript (works on all platforms)
            const response = await fetch(url, {
                headers: {'User-Agent': 'Mozilla/5.0'},
            });

            if (!response.ok) {
                return this.errorResult(
                    'FetchError',
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const html = await response.text();
            const finalUrl = response.url;

            // 2. Check for auth redirect
            const authError = this.detectAuthRequired(html, finalUrl, url);
            if (authError) {
                return authError;
            }

            // 3. Parse and enhance
            return this.scrapeRecipeFromHtml(html, url, options);
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
            // 1. Get base parsing from native module (Android/iOS) or TypeScript (Web)
            let baseResult: ScraperResult;

            if (nativeModule) {
                // Android/iOS: Use Python recipe-scrapers for base parsing (500+ site parsers)
                const json = await nativeModule.scrapeRecipeFromHtml(
                    html,
                    url,
                    options?.wildMode ?? true
                );
                baseResult = JSON.parse(json);
            } else {
                // Web: Use TypeScript schema.org parser
                baseResult = schemaParser.parse(html, url);
            }

            // 2. Apply TypeScript enhancements (ALL platforms)
            if (baseResult.success) {
                baseResult.data = applyEnhancements({
                    html,
                    baseResult: baseResult.data,
                });
            }

            return baseResult;
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
        if (!nativeModule) {
            return {success: true, data: []};
        }
        try {
            const json = await nativeModule.getSupportedHosts();
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
        if (!nativeModule) {
            return {success: true, data: false};
        }
        try {
            const json = await nativeModule.isHostSupported(host);
            return JSON.parse(json);
        } catch (error) {
            return this.exceptionError(error);
        }
    }

    /**
     * Scrapes a recipe from an authentication-protected URL.
     *
     * Logs into the site using provided credentials and scrapes the recipe.
     * Only available on Android. Returns an error on other platforms.
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
        if (!nativeModule?.scrapeRecipeAuthenticated) {
            return {
                success: false,
                error: {
                    type: 'UnsupportedPlatform',
                    message: 'Authenticated scraping is only available on Android',
                },
            };
        }
        try {
            const json = await nativeModule.scrapeRecipeAuthenticated(
                url,
                username,
                password,
                options?.wildMode ?? true
            );
            const baseResult: ScraperResult = JSON.parse(json);

            // Note: For authenticated scraping, we can't easily apply TypeScript enhancements
            // because we don't have access to the HTML. The Python scraper handles this.
            return baseResult;
        } catch (error) {
            return this.exceptionError(error);
        }
    }

    /**
     * Gets a list of hosts that support authentication.
     *
     * Only available on Android. Returns an empty array on other platforms.
     *
     * @returns A result object with an array of host domains supporting auth.
     */
    async getSupportedAuthHosts(): Promise<SupportedHostsResult> {
        if (!nativeModule?.getSupportedAuthHosts) {
            return {success: true, data: []};
        }
        try {
            const json = await nativeModule.getSupportedAuthHosts();
            return JSON.parse(json);
        } catch (error) {
            return this.exceptionError(error);
        }
    }

    /**
     * Detect if a page requires authentication.
     * Checks for login URL patterns and page title keywords.
     */
    private detectAuthRequired(
        html: string,
        finalUrl: string,
        originalUrl: string
    ): ScraperErrorResult | null {
        const getHost = (urlStr: string): string => {
            try {
                return new URL(urlStr).hostname.replace('www.', '');
            } catch {
                return '';
            }
        };

        const host = getHost(originalUrl);

        try {
            const finalPath = new URL(finalUrl).pathname.toLowerCase();
            for (const pattern of AUTH_URL_PATTERNS) {
                if (finalPath.includes(pattern)) {
                    return this.authErrorResult(host);
                }
            }
        } catch {
            // Invalid URL, continue
        }

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            const title = titleMatch[1].toLowerCase();
            for (const keyword of AUTH_TITLE_KEYWORDS) {
                if (title.includes(keyword)) {
                    return this.authErrorResult(host);
                }
            }
        }

        return null;
    }

    private authErrorResult(host: string): ScraperErrorResult {
        return {
            success: false,
            error: {
                type: 'AuthenticationRequired',
                message: 'This recipe requires authentication',
                host,
            },
        };
    }

    private errorResult(type: string, message: string): ScraperErrorResult {
        return {
            success: false,
            error: {type, message},
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

    /**
     * Checks if the Python runtime is ready for scraping.
     *
     * On iOS/Android, this returns true once Python has finished initializing.
     * On Web, this always returns true (no Python needed).
     *
     * @returns true if ready, false if still initializing.
     */
    async isPythonReady(): Promise<boolean> {
        if (!nativeModule?.isPythonAvailable) {
            // Web platform - always ready (no Python)
            return true;
        }
        try {
            return await nativeModule.isPythonAvailable();
        } catch {
            return false;
        }
    }

    /**
     * Waits for Python to be ready for scraping.
     *
     * Call this during app initialization to ensure Python is loaded
     * before allowing users to access web parsing features.
     *
     * @param timeoutMs - Maximum time to wait (default: 30000ms)
     * @param pollIntervalMs - Time between checks (default: 100ms)
     * @returns true if ready, false if timeout reached
     */
    async waitForReady(timeoutMs = 30000, pollIntervalMs = 100): Promise<boolean> {
        if (!nativeModule?.isPythonAvailable) {
            // Web platform - always ready
            return true;
        }

        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const isReady = await nativeModule.isPythonAvailable();
                if (isReady) {
                    return true;
                }
            } catch {
                // Ignore errors, keep polling
            }
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        return false;
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
            const ready = await recipeScraper.waitForReady();
            if (mounted) {
                setIsReady(ready);
            }
        };

        checkReady();

        return () => {
            mounted = false;
        };
    }, []);

    return isReady;
}
