/**
 * URL utility functions for the recipe scraper module.
 */

/**
 * Extracts the hostname from a URL, stripping the `www.` prefix if present.
 *
 * @param url - A URL string to parse.
 * @returns The hostname without the `www.` prefix, or an empty string if the URL is invalid.
 */
export function extractHost(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}
