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

import {Platform} from 'react-native';
import {useEffect, useState} from 'react';
import {SchemaRecipeParser} from './web/SchemaRecipeParser';
import {applyEnhancements} from './enhancements';
import type {HostSupportedResult, ScraperErrorResult, ScraperResult, SupportedHostsResult,} from './types';
import {AuthBridge} from './ios/AuthBridge';
import {pyodideLogger} from '@utils/logger';
import {extractHost} from './urlUtils';

 
type PyodideBridgeInstance = typeof import('./ios/PyodideBridge').PyodideBridge;

function getPyodideBridge(): PyodideBridgeInstance {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./ios/PyodideBridge').PyodideBridge;
}

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
const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';
const useNativeModule = isAndroid && !isTestEnv;
const usePyodide = isIOS && !isTestEnv;

function getNativeModule(): NativeScraperInterface | null {
    if (!useNativeModule) {
        return null;
    }
    // Only import native module on Android (Chaquopy)
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
            pyodideLogger.debug('Scraping recipe from URL', {url});
            const response = await fetch(url, {
                headers: {'User-Agent': 'Mozilla/5.0'},
            });

            if (!response.ok) {
                pyodideLogger.warn('Recipe fetch failed', {url, status: response.status});
                return this.errorResult(
                    'FetchError',
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const html = await response.text();
            const finalUrl = response.url;

            const authError = this.detectAuthRequired(html, finalUrl, url);
            if (authError) {
                pyodideLogger.info('Authentication required for recipe', {url, finalUrl});
                return authError;
            }

            return this.scrapeRecipeFromHtml(html, url, options);
        } catch (error) {
            pyodideLogger.error('Scrape failed with exception', {url, error: error instanceof Error ? error.message : String(error)});
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
            let baseResult: ScraperResult;

            if (nativeModule) {
                // Android: Use Python recipe-scrapers via Chaquopy
                const json = await nativeModule.scrapeRecipeFromHtml(
                    html,
                    url,
                    options?.wildMode ?? true
                );
                baseResult = JSON.parse(json);
            } else if (usePyodide) {
                // iOS: Use Python recipe-scrapers via Pyodide WebView
                try {
                    const json = await getPyodideBridge().scrapeRecipeFromHtml(
                        html,
                        url,
                        options?.wildMode ?? true
                    );
                    baseResult = JSON.parse(json);
                } catch (pyodideError) {
                    // Fallback to TypeScript schema.org parser if Pyodide fails
                    const initError = getPyodideBridge().getInitializationError();
                    if (initError) {
                        pyodideLogger.warn('Pyodide never initialized', {error: initError.message});
                    }
                    pyodideLogger.warn('Pyodide failed, falling back to schema.org', {
                        error: pyodideError,
                    });
                    baseResult = schemaParser.parse(html, url);
                }
            } else {
                // Web: Use TypeScript schema.org parser
                baseResult = schemaParser.parse(html, url);
            }

            if (baseResult.success) {
                baseResult.data = applyEnhancements({
                    html,
                    baseResult: baseResult.data,
                });
                pyodideLogger.debug('Recipe scraped successfully', {url, title: baseResult.data.title});
            } else {
                pyodideLogger.warn('Recipe scraping returned error', {url, error: baseResult.error});
            }

            return baseResult;
        } catch (error) {
            pyodideLogger.error('scrapeRecipeFromHtml failed with exception', {url, error: error instanceof Error ? error.message : String(error)});
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
        if (nativeModule) {
            try {
                const json = await nativeModule.getSupportedHosts();
                return JSON.parse(json);
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        if (usePyodide) {
            try {
                const json = await getPyodideBridge().getSupportedHosts();
                return JSON.parse(json);
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        return {success: true, data: []};
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
        if (nativeModule) {
            try {
                const json = await nativeModule.isHostSupported(host);
                return JSON.parse(json);
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        if (usePyodide) {
            try {
                const json = await getPyodideBridge().isHostSupported(host);
                return JSON.parse(json);
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        return {success: true, data: false};
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
        pyodideLogger.debug('Starting authenticated scrape', {url});

        if (nativeModule?.scrapeRecipeAuthenticated) {
            try {
                const json = await nativeModule.scrapeRecipeAuthenticated(
                    url,
                    username,
                    password,
                    options?.wildMode ?? true
                );
                const {html = '', ...result} = JSON.parse(json);
                if (result.success) {
                    result.data = applyEnhancements({html, baseResult: result.data});
                }
                return result as ScraperResult;
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        if (usePyodide) {
            const host = extractHost(url);

            if (!AuthBridge.isHostSupported(host)) {
                return {
                    success: false,
                    error: {
                        type: 'UnsupportedAuthSite',
                        message: `Authentication not supported for ${host} on iOS`,
                        host,
                    },
                };
            }

            try {
                const html = await AuthBridge.fetchAuthenticatedHtml(url, username, password);
                // Force wildMode=false: auth targets known supported sites that have dedicated
                // scrapers. wildMode=true would trigger an early schema.org check that these
                // sites fail (they use custom formats), discarding the dedicated scraper path.
                return this.scrapeRecipeFromHtml(html, url, {wildMode: false});
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        return {
            success: false,
            error: {
                type: 'UnsupportedPlatform',
                message: 'Authenticated scraping requires Android or iOS',
            },
        };
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
        if (nativeModule?.getSupportedAuthHosts) {
            try {
                const json = await nativeModule.getSupportedAuthHosts();
                return JSON.parse(json);
            } catch (error) {
                return this.exceptionError(error);
            }
        }

        if (usePyodide) {
            return {success: true, data: AuthBridge.getAuthHandlerHosts()};
        }

        return {success: true, data: []};
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
        if (nativeModule?.isPythonAvailable) {
            try {
                return await nativeModule.isPythonAvailable();
            } catch {
                return false;
            }
        }

        if (usePyodide) {
            return getPyodideBridge().isPythonReady();
        }

        // Web platform - always ready (no Python)
        return true;
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
        if (usePyodide) {
            await getPyodideBridge().whenReady();
            return;
        }

        if (!nativeModule?.isPythonAvailable) {
            return;
        }

        const isReady = await nativeModule.isPythonAvailable();
        if (!isReady) {
            throw new Error('Native Python is not available');
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
        const host = extractHost(originalUrl);

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
