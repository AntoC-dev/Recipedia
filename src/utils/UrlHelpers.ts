/**
 * URL validation and normalization utilities.
 *
 * @module utils/UrlHelpers
 */

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
