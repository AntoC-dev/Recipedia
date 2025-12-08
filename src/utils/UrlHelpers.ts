/**
 * URL validation and normalization utilities.
 *
 * @module utils/UrlHelpers
 */

/**
 * Validates URL format.
 *
 * Accepts URLs with or without protocol. URLs without protocol
 * are tested with https:// prefix.
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
    new URL(urlToTest);
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
