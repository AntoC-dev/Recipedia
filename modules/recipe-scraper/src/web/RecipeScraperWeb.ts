import {SchemaRecipeParser} from './SchemaRecipeParser';
import {pyodideScraper} from './PyodideScraper';
import type {ScraperErrorResult} from '../types';

export class RecipeScraperWeb {
    private parser = new SchemaRecipeParser();

    constructor() {
        // Start loading Pyodide in background for subsequent calls
        this.preloadPyodide();
    }

    /**
     * Pre-load Pyodide in the background.
     * This is called automatically on construction.
     */
    private preloadPyodide(): void {
        // Only preload in browser environment
        if (typeof window !== 'undefined') {
            pyodideScraper.preload();
        }
    }

    async scrapeRecipe(url: string, wildMode?: boolean): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return this.errorJson('FetchError', `HTTP ${response.status}: ${response.statusText}`);
            }
            const html = await response.text();
            return this.scrapeRecipeFromHtml(html, url, wildMode);
        } catch (error) {
            return this.errorJson(
                'FetchError',
                error instanceof Error ? error.message : 'Unknown fetch error'
            );
        }
    }

    async scrapeRecipeFromHtml(html: string, url: string, wildMode?: boolean): Promise<string> {
        // Try Python scraper first if ready
        if (pyodideScraper.isReady) {
            const result = await pyodideScraper.scrapeFromHtml(html, url, wildMode ?? true);
            return JSON.stringify(result);
        }

        // If Pyodide is still loading but hasn't failed, try TypeScript fallback first
        // then try Python if TypeScript didn't find a recipe
        const tsResult = this.parser.parse(html, url);

        if (tsResult.success) {
            return JSON.stringify(tsResult);
        }

        // TypeScript failed - try waiting for Python if it's loading
        if (!pyodideScraper.hasFailed) {
            try {
                const pyResult = await pyodideScraper.scrapeFromHtml(html, url, wildMode ?? true);
                if (pyResult.success) {
                    return JSON.stringify(pyResult);
                }
            } catch {
                // Python also failed, return TypeScript error
            }
        }

        // Return TypeScript result (even if error)
        return JSON.stringify(tsResult);
    }

    async getSupportedHosts(): Promise<string> {
        // Use Python if available for accurate list
        if (pyodideScraper.isReady) {
            const result = await pyodideScraper.getSupportedHosts();
            return JSON.stringify(result);
        }
        // Fallback: TypeScript parser supports any site with schema.org
        return JSON.stringify({success: true, data: []});
    }

    async isHostSupported(host: string): Promise<string> {
        // Use Python if available for accurate check
        if (pyodideScraper.isReady) {
            const result = await pyodideScraper.isHostSupported(host);
            return JSON.stringify(result);
        }
        // Fallback: TypeScript parser supports any site with schema.org
        return JSON.stringify({success: true, data: false});
    }

    async isAvailable(): Promise<boolean> {
        return true;
    }

    /**
     * Check if Python scraper is available.
     */
    async isPythonAvailable(): Promise<boolean> {
        return pyodideScraper.isReady;
    }

    private errorJson(type: string, message: string): string {
        const result: ScraperErrorResult = {
            success: false,
            error: {type, message},
        };
        return JSON.stringify(result);
    }
}
