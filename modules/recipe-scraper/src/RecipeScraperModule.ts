import {NativeModule, requireNativeModule} from 'expo-modules-core';

/**
 * Native module interface for recipe scraping using embedded Python.
 *
 * All methods return JSON strings that must be parsed on the JS side.
 * This allows for consistent error handling across the native bridge.
 */
declare class RecipeScraperModuleType extends NativeModule {
    /**
     * Scrapes a recipe from the given URL.
     * @param url - The URL of the recipe page to scrape.
     * @param wildMode - If true, attempt to scrape unsupported sites using schema.org.
     * @returns A JSON string containing the scraped recipe data or an error.
     */
    scrapeRecipe(url: string, wildMode?: boolean): Promise<string>;

    /**
     * Scrapes a recipe from HTML content.
     * @param html - The HTML content of the recipe page.
     * @param url - The original URL (used for host detection).
     * @param wildMode - If true, attempt to scrape using schema.org.
     * @returns A JSON string containing the scraped recipe data or an error.
     */
    scrapeRecipeFromHtml(html: string, url: string, wildMode?: boolean): Promise<string>;

    /**
     * Gets list of all supported recipe website hosts.
     * @returns A JSON string containing an array of supported host domains.
     */
    getSupportedHosts(): Promise<string>;

    /**
     * Checks if a specific host is supported.
     * @param host - Domain to check (e.g., "allrecipes.com").
     * @returns A JSON string containing a boolean result.
     */
    isHostSupported(host: string): Promise<string>;

    /**
     * Checks if the Python scraper is available on this platform.
     * @returns true if available, false otherwise.
     */
    isAvailable(): Promise<boolean>;

    /**
     * Scrapes a recipe from an authentication-protected URL.
     * @param url - The URL of the recipe page to scrape.
     * @param username - Username/email for authentication.
     * @param password - Password for authentication.
     * @param wildMode - If true, attempt to scrape unsupported sites using schema.org.
     * @returns A JSON string containing the scraped recipe data or an error.
     */
    scrapeRecipeAuthenticated(
        url: string,
        username: string,
        password: string,
        wildMode?: boolean
    ): Promise<string>;

    /**
     * Gets list of hosts that support authentication.
     * @returns A JSON string containing an array of host domains supporting auth.
     */
    getSupportedAuthHosts(): Promise<string>;

    /**
     * Checks if the Python runtime is initialized and ready.
     * @returns true if Python is ready, false otherwise.
     */
    isPythonAvailable(): Promise<boolean>;
}

export default requireNativeModule<RecipeScraperModuleType>('RecipeScraper');
