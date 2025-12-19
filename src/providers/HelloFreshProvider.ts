/**
 * HelloFreshProvider - HelloFresh recipe provider implementation
 *
 * Provides support for discovering and importing recipes from HelloFresh
 * websites across multiple regions (FR, US, DE, etc.).
 *
 * @module providers/HelloFreshProvider
 */

import { getLanguage } from '@utils/settings';
import { bulkImportLogger } from '@utils/logger';
import { BaseRecipeProvider } from './BaseRecipeProvider';

/** URL to HelloFresh's official logo */
const HELLOFRESH_LOGO_URL =
  'https://media.hellofresh.com/w_256,q_100,f_auto,c_limit,fl_lossy/hellofresh_website/logo/Hello_Fresh_Lockup.png';

/** Base URL for all HelloFresh regional sites */
const HELLOFRESH_BASE = 'https://www.hellofresh';

/** Map of ISO 639-1 language codes to HelloFresh TLD suffixes */
const HELLOFRESH_TLD_BY_LANGUAGE: Record<string, string> = {
  en: '.com',
  fr: '.fr',
  de: '.de',
  nl: '.nl',
  it: '.it',
  es: '.es',
  da: '.dk',
  sv: '.se',
  nb: '.no',
};

/** Pattern to identify HelloFresh recipe URLs by their hex ID suffix */
const RECIPE_HEX_ID_PATTERN = /[a-f0-9]{24}$/;

/** Regex to extract recipe URLs from HTML */
const RECIPE_URL_REGEX =
  /href="((?:https?:\/\/www\.hellofresh\.[a-z]+)?\/recipes\/[a-z0-9-]+-[a-f0-9]{24})"/gi;

/** Regex to extract category URLs from HTML */
const CATEGORY_URL_REGEX =
  /href="((?:https?:\/\/www\.hellofresh\.[a-z]+)?\/recipes\/[a-z0-9-]+)"/gi;

/**
 * HelloFresh recipe provider implementation
 *
 * Extends BaseRecipeProvider with HelloFresh-specific URL patterns,
 * category discovery, and ingredient filtering for French/English recipes.
 */
export class HelloFreshProvider extends BaseRecipeProvider {
  /** Unique provider identifier */
  readonly id = 'hellofresh';

  /** Display name for the provider */
  readonly name = 'HelloFresh';

  /** URL to the HelloFresh logo */
  readonly logoUrl = HELLOFRESH_LOGO_URL;

  /** Current base URL for the active discovery session */
  private currentBaseUrl: string | null = null;

  /**
   * Gets the base URL for the user's regional HelloFresh site
   *
   * Always fetches the current language setting to ensure the correct
   * regional site is used even if the user changed language settings.
   *
   * @returns Promise resolving to the regional HelloFresh URL
   * @throws Error if the user's language is not supported by HelloFresh
   */
  async getBaseUrl(): Promise<string> {
    const language = await getLanguage();
    const tld = HELLOFRESH_TLD_BY_LANGUAGE[language];

    if (!tld) {
      const supportedLanguages = Object.keys(HELLOFRESH_TLD_BY_LANGUAGE).join(', ');
      throw new Error(
        `HelloFresh is not available for language "${language}". Supported languages: ${supportedLanguages}`
      );
    }

    const baseUrl = HELLOFRESH_BASE + tld;
    bulkImportLogger.debug('HelloFresh region selected', { language, baseUrl });

    this.currentBaseUrl = baseUrl;
    return baseUrl;
  }

  /**
   * Discovers recipe category URLs from the HelloFresh recipes page
   *
   * Fetches the main recipes page and extracts all category links,
   * filtering out individual recipe pages.
   *
   * @param baseUrl - The regional HelloFresh base URL
   * @param signal - Optional abort signal for cancellation
   * @returns Promise resolving to array of category page URLs
   */
  async discoverCategoryUrls(baseUrl: string, signal?: AbortSignal): Promise<string[]> {
    const recipesPageUrl = `${baseUrl}/recipes`;

    bulkImportLogger.debug('Discovering categories from', { url: recipesPageUrl });

    try {
      const html = await this.fetchHtml(recipesPageUrl, signal);
      const categories = this.extractCategoryLinksFromHtml(html, baseUrl);

      bulkImportLogger.info('Categories discovered', {
        count: categories.length,
        categories: categories.slice(0, 5),
      });

      return categories;
    } catch (error) {
      bulkImportLogger.error('Failed to discover categories', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Extracts recipe links from HTML content
   *
   * Parses HTML to find recipe URLs matching the HelloFresh pattern
   * (URLs ending with 24-character hex IDs). Extracts titles from
   * URL slugs for immediate display.
   *
   * @param html - Raw HTML content to parse
   * @returns Array of recipe links with URLs and extracted titles
   */
  extractRecipeLinksFromHtml(html: string): { url: string; title?: string; imageUrl?: string }[] {
    const results: { url: string; title?: string; imageUrl?: string }[] = [];
    const seenUrls = new Set<string>();

    if (!this.currentBaseUrl) {
      throw new Error('Base URL not initialized. Call getBaseUrl() first.');
    }

    let match;
    while ((match = RECIPE_URL_REGEX.exec(html)) !== null) {
      const matchedUrl = match[1];
      const fullUrl = matchedUrl.startsWith('http') ? matchedUrl : this.currentBaseUrl + matchedUrl;

      if (!seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        const title = this.extractTitleFromSlug(fullUrl);
        results.push({ url: fullUrl, title });
      }
    }

    RECIPE_URL_REGEX.lastIndex = 0;

    return results;
  }

  /**
   * Extracts category links from HTML content
   *
   * Parses HTML to find category URLs matching the HelloFresh pattern,
   * filtering out individual recipe pages (those ending with hex IDs).
   *
   * @param html - Raw HTML content to parse
   * @param baseUrl - Base URL for resolving relative links
   * @returns Array of unique category URLs
   */
  private extractCategoryLinksFromHtml(html: string, baseUrl: string): string[] {
    const categories = new Set<string>();

    let match;
    while ((match = CATEGORY_URL_REGEX.exec(html)) !== null) {
      const matchedUrl = match[1];
      const fullUrl = matchedUrl.startsWith('http') ? matchedUrl : baseUrl + matchedUrl;

      const path = fullUrl.replace(/^https?:\/\/[^/]+/, '');

      if (path.startsWith('/recipes/') && !RECIPE_HEX_ID_PATTERN.test(path)) {
        if (path !== '/recipes' && path !== '/recipes/') {
          categories.add(fullUrl);
        }
      }
    }

    CATEGORY_URL_REGEX.lastIndex = 0;

    return Array.from(categories);
  }

  /**
   * Extracts a human-readable title from a recipe URL slug
   *
   * Converts URL slugs like "chicken-tikka-masala-abc123" to
   * readable titles like "Chicken tikka masala".
   *
   * @param url - Full recipe URL
   * @returns Formatted title with first letter capitalized
   */
  private extractTitleFromSlug(url: string): string {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    const slug = path.replace('/recipes/', '').replace(/-[a-f0-9]{24}$/, '');

    const title = slug.replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }
}

/** Singleton instance of HelloFresh provider */
export const helloFreshProvider = new HelloFreshProvider();
