/**
 * QuitoqueProvider - Quitoque recipe provider implementation
 *
 * Provides support for discovering and importing recipes from Quitoque,
 * a French meal-kit service. Uses pagination instead of categories.
 *
 * @module providers/QuitoqueProvider
 */

import { bulkImportLogger } from '@utils/logger';
import { extractImageFromJsonLd } from '@utils/UrlHelpers';
import { BaseRecipeProvider } from './BaseRecipeProvider';

/** URL to Quitoque's logo (may need updating when anniversary branding changes) */
const QUITOQUE_LOGO_URL =
  'https://www.quitoque.fr/media/cache/logo_10_years/build/quitoque/theme/images/logo-10-years.47dd494d.png';

/** Base URL for Quitoque (French only) */
const QUITOQUE_BASE_URL = 'https://www.quitoque.fr';

/** Safety limit to prevent infinite loops during pagination discovery */
const MAX_PAGES_SAFETY_LIMIT = 200;

/** Number of pages to probe concurrently when discovering pagination */
const PAGINATION_PROBE_BATCH_SIZE = 5;

/** Regex to extract recipe URLs from HTML */
const RECIPE_URL_REGEX = /href="(\/recettes\/[a-z0-9-]+)"/gi;

/** Pattern to validate recipe paths (excludes pagination and other links) */
const RECIPE_PATH_PATTERN = /^\/recettes\/[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * Quitoque recipe provider implementation
 *
 * Extends BaseRecipeProvider with Quitoque-specific URL patterns and
 * pagination-based discovery. Treats each page as a "category" for
 * compatibility with the base class discovery flow.
 */
export class QuitoqueProvider extends BaseRecipeProvider {
  readonly id = 'quitoque';
  readonly name = 'Quitoque';
  readonly logoUrl = QUITOQUE_LOGO_URL;
  readonly supportedLanguages = ['fr'] as const;

  /**
   * Gets the base URL for Quitoque
   *
   * Quitoque is only available in France, so no regional selection needed.
   *
   * @returns Promise resolving to the Quitoque base URL
   */
  async getBaseUrl(): Promise<string> {
    bulkImportLogger.debug('Quitoque base URL', { baseUrl: QUITOQUE_BASE_URL });
    return QUITOQUE_BASE_URL;
  }

  /**
   * Discovers recipe page URLs using dynamic pagination
   *
   * Quitoque uses pagination instead of categories. This method probes pages
   * in batches until finding one with no recipes, then returns all valid page URLs.
   *
   * @param baseUrl - The Quitoque base URL
   * @param signal - Optional abort signal for cancellation
   * @returns Promise resolving to array of paginated page URLs
   */
  async discoverCategoryUrls(baseUrl: string, signal?: AbortSignal): Promise<string[]> {
    bulkImportLogger.debug('Discovering Quitoque pages via dynamic pagination');

    try {
      const lastPage = await this.findLastPageWithRecipes(baseUrl, signal);

      if (lastPage === 0) {
        bulkImportLogger.warn('No recipes found on any page');
        return [];
      }

      const pageUrls = Array.from(
        { length: lastPage },
        (_, i) => `${baseUrl}/recettes?page=${i + 1}`
      );

      bulkImportLogger.info('Discovered pagination URLs', { count: pageUrls.length });
      return pageUrls;
    } catch (error) {
      bulkImportLogger.error('Failed to discover Quitoque pages', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Extracts recipe links from HTML content
   *
   * Parses HTML to find recipe URLs matching the Quitoque pattern
   * (/recettes/[slug]). Extracts titles from URL slugs.
   *
   * @param html - Raw HTML content to parse
   * @returns Array of recipe links with URLs and extracted titles
   */
  extractRecipeLinksFromHtml(html: string): { url: string; title?: string; imageUrl?: string }[] {
    const results: { url: string; title?: string; imageUrl?: string }[] = [];
    const seenUrls = new Set<string>();

    let match;
    while ((match = RECIPE_URL_REGEX.exec(html)) !== null) {
      const path = match[1];

      if (!RECIPE_PATH_PATTERN.test(path)) {
        continue;
      }

      const fullUrl = QUITOQUE_BASE_URL + path;

      if (seenUrls.has(fullUrl)) {
        continue;
      }

      seenUrls.add(fullUrl);
      const title = this.extractTitleFromSlug(path);
      results.push({ url: fullUrl, title });
    }

    RECIPE_URL_REGEX.lastIndex = 0;

    return results;
  }

  /**
   * Fetches the image URL for a Quitoque recipe page
   *
   * The Python recipe-scrapers library returns placeholder images for Quitoque.
   * This override extracts the real image directly from JSON-LD schema.
   *
   * @param url - Recipe page URL
   * @param signal - Abort signal for cancellation
   * @returns Promise resolving to image URL or null
   */
  override async fetchImageUrlForRecipe(url: string, signal: AbortSignal): Promise<string | null> {
    try {
      const html = await this.fetchHtml(url, signal);

      const jsonLdImage = extractImageFromJsonLd(html);
      if (jsonLdImage) {
        return jsonLdImage;
      }

      const metadata = await this.extractPreviewMetadata(html, url);
      if (metadata.imageUrl && !metadata.imageUrl.includes('placeholder')) {
        return metadata.imageUrl;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Finds the last page that contains recipes using binary search-like probing
   *
   * Probes pages in batches to find where recipes end, then narrows down
   * to find the exact last page with recipes.
   */
  private async findLastPageWithRecipes(baseUrl: string, signal?: AbortSignal): Promise<number> {
    let lastKnownGoodPage = 0;
    let currentPage = 1;

    while (currentPage <= MAX_PAGES_SAFETY_LIMIT) {
      if (signal?.aborted) break;

      const pagesToProbe = Array.from(
        { length: PAGINATION_PROBE_BATCH_SIZE },
        (_, i) => currentPage + i
      ).filter(p => p <= MAX_PAGES_SAFETY_LIMIT);

      const results = await Promise.allSettled(
        pagesToProbe.map(async page => {
          const url = `${baseUrl}/recettes?page=${page}`;
          const html = await this.fetchHtml(url, signal);
          const hasRecipes = this.pageHasRecipes(html);
          return { page, hasRecipes };
        })
      );

      let foundEmptyPage = false;
      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.hasRecipes) {
            lastKnownGoodPage = Math.max(lastKnownGoodPage, result.value.page);
          } else {
            foundEmptyPage = true;
          }
        }
      }

      if (foundEmptyPage) {
        break;
      }

      currentPage += PAGINATION_PROBE_BATCH_SIZE;
    }

    return lastKnownGoodPage;
  }

  /**
   * Checks if a page contains recipe links
   */
  private pageHasRecipes(html: string): boolean {
    const hasRecipes = RECIPE_URL_REGEX.test(html);
    RECIPE_URL_REGEX.lastIndex = 0;
    return hasRecipes;
  }

  /**
   * Extracts a human-readable title from a recipe URL slug
   *
   * Converts URL slugs like "/recettes/poulet-roti-aux-herbes" to
   * readable titles like "Poulet roti aux herbes".
   *
   * @param path - Recipe URL path
   * @returns Formatted title with first letter capitalized
   */
  private extractTitleFromSlug(path: string): string {
    const slug = path.replace('/recettes/', '');
    const title = slug.replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }
}

export const quitoqueProvider = new QuitoqueProvider();
