/**
 * URL validation, normalization, and fetching utilities.
 *
 * @module utils/UrlHelpers
 */

import { uiLogger } from '@utils/logger';

/** Timeout for HTML fetch requests in milliseconds */
const FETCH_TIMEOUT_MS = 15000;

/**
 * Returns true if the URL is a lazy-load placeholder image (e.g. Sylius LiipImagine).
 *
 * @param url - Image URL to test
 * @returns true if the URL contains 'placeholder' (case-insensitive)
 */
export function isPlaceholderImageUrl(url: string): boolean {
  return url.toLowerCase().includes('placeholder');
}

/**
 * Validates URL format.
 *
 * Accepts URLs with or without protocol. URLs without protocol
 * are tested with https:// prefix. Requires a valid hostname with
 * at least one dot (e.g., example.com).
 *
 * @param url - URL string to validate
 * @returns true if URL is valid
 */
export function isValidUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  const hasHttpProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://');
  const urlToTest = hasHttpProtocol ? trimmed : `https://${trimmed}`;

  if (!hasHttpProtocol && trimmed.includes('://')) {
    return false;
  }

  try {
    const parsed = new URL(urlToTest);
    if (!parsed.hostname.includes('.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes URL by adding protocol if missing.
 *
 * @param url - URL string to normalize
 * @returns URL with https:// prefix if no protocol present
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Result of fetching HTML from a URL.
 */
export interface FetchHtmlResult {
  html: string;
  finalUrl: string;
}

/**
 * Fetches HTML content from a URL with timeout handling.
 *
 * Returns both the HTML and the final URL after any redirects,
 * which is needed for auth redirect detection on iOS.
 *
 * @param url - The URL to fetch
 * @param signal - Optional abort signal for cancellation
 * @returns The HTML content and final URL after redirects
 * @throws Error if fetch fails or times out
 */
export async function fetchHtml(url: string, signal?: AbortSignal): Promise<FetchHtmlResult> {
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const response = await fetch(url, {
    signal: combinedSignal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RecipediaApp/1.0; +https://github.com/recipedia)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const finalUrl = response.url ?? url;

  uiLogger.debug('fetchHtml', { finalUrl, htmlLength: html.length });

  return { html, finalUrl };
}

/**
 * Extracts image URL from JSON-LD schema in HTML
 *
 * Parses JSON-LD Recipe schema to find the recipe image URL.
 * Skips placeholder images.
 *
 * @param html - The HTML content to parse
 * @returns The image URL or null if not found
 */
export function extractImageFromJsonLd(html: string): string | null {
  try {
    const jsonLdMatch = html.match(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
    );
    if (!jsonLdMatch) {
      return null;
    }

    const jsonLd = JSON.parse(jsonLdMatch[1]!);

    // Find Recipe object: direct, in @graph, or in root-level array
    let recipe: Record<string, unknown> | undefined;
    if (jsonLd['@type'] === 'Recipe') {
      recipe = jsonLd;
    } else if (jsonLd['@graph']) {
      recipe = jsonLd['@graph'].find((item: Record<string, unknown>) => item['@type'] === 'Recipe');
    } else if (Array.isArray(jsonLd)) {
      recipe = jsonLd.find((item: Record<string, unknown>) => item['@type'] === 'Recipe');
    }

    if (!recipe?.image) {
      return null;
    }

    const image = recipe.image;
    if (typeof image === 'string' && !isPlaceholderImageUrl(image)) return image;
    if (Array.isArray(image)) {
      const first = image[0];
      const imgUrl = typeof first === 'string' ? first : first?.url;
      if (imgUrl && !isPlaceholderImageUrl(imgUrl)) return imgUrl;
    }
    if (typeof image === 'object' && image !== null) {
      const imgUrl = (image as Record<string, unknown>).url;
      if (typeof imgUrl === 'string' && imgUrl && !isPlaceholderImageUrl(imgUrl)) return imgUrl;
    }

    return null;
  } catch {
    return null;
  }
}
