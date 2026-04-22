/**
 * Auth detection utilities for identifying login/authentication pages.
 *
 * Checks both URL path patterns and page title keywords to detect
 * when a recipe page has redirected to a login page.
 *
 * @module authDetection
 */

import { extractHost } from './urlUtils';
import type { ScraperErrorResult } from './types';

/** URL path patterns indicating a login/auth page. */
export const AUTH_URL_PATTERNS = [
  '/login',
  '/signin',
  '/sign-in',
  '/auth',
  '/connexion',
  '/account/login',
  '/user/login',
];

/** Page title keywords indicating a login/auth page (multilingual). */
export const AUTH_TITLE_KEYWORDS = [
  'login',
  'sign in',
  'connexion',
  'se connecter',
  'log in',
  'anmelden',
  'iniciar sesión',
];

/**
 * Detects if a page requires authentication by checking URL patterns and title keywords.
 *
 * @param html - The HTML content of the page
 * @param finalUrl - The final URL after any redirects
 * @param originalUrl - The original URL before redirects (used for host extraction)
 * @returns A ScraperErrorResult if auth is detected, null otherwise
 */
export function detectAuthRequired(
  html: string,
  finalUrl: string,
  originalUrl: string,
): ScraperErrorResult | null {
  const host = extractHost(originalUrl);

  try {
    const finalPath = new URL(finalUrl).pathname.toLowerCase();
    for (const pattern of AUTH_URL_PATTERNS) {
      if (finalPath.includes(pattern)) {
        return authErrorResult(host);
      }
    }
  } catch {
    // Invalid URL, continue to title check
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].toLowerCase();
    for (const keyword of AUTH_TITLE_KEYWORDS) {
      if (title.includes(keyword)) {
        return authErrorResult(host);
      }
    }
  }

  return null;
}

function authErrorResult(host: string): ScraperErrorResult {
  return {
    success: false,
    error: {
      type: 'AuthenticationRequired',
      message: 'This recipe requires authentication',
      host,
    },
  };
}
