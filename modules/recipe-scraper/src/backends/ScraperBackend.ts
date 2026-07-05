import type {
  HostSupportedResult,
  ScraperErrorResult,
  ScraperResult,
  SupportedHostsResult,
} from '../types';

/**
 * Successful authenticated scrape: the fetched page `html` plus the parsed
 * `result`. Both platforms return this same shape (Android extracts the html
 * embedded in its Python response; iOS parses the html it fetched), so
 * `RecipeScraper` applies enhancements once, uniformly, regardless of platform.
 */
export interface AuthenticatedScrape {
  html: string;
  result: ScraperResult;
}

/**
 * Error returned by backends that cannot perform authenticated scraping on the
 * current platform (web, or a native module without auth support).
 */
export function unsupportedPlatformError(): ScraperErrorResult {
  return {
    success: false,
    error: {
      type: 'UnsupportedPlatform',
      message: 'Authenticated scraping requires Android or iOS',
    },
  };
}

/**
 * Platform-specific scraping backend. One implementation per runtime
 * (Chaquopy on Android, Pyodide on iOS, schema.org on web/test), selected once
 * by {@link createBackend}. All cross-platform orchestration — fetching,
 * auth detection, enhancements, exception wrapping — lives in `RecipeScraper`,
 * so a backend only exposes the raw platform capability.
 */
export interface ScraperBackend {
  /** Starts the platform Python runtime if needed; resolves once ready. */
  warmup(): Promise<void>;

  /** Reports whether the platform Python runtime is ready, without starting it. */
  isReady(): Promise<boolean>;

  /** Parses HTML into a recipe result using the platform's Python (or schema) layer. */
  scrapeHtml(html: string, url: string, wildMode: boolean): Promise<ScraperResult>;

  /** Lists recipe hosts the platform's scraper explicitly supports. */
  getSupportedHosts(): Promise<SupportedHostsResult>;

  /** Reports whether a host is in the platform's supported list. */
  isHostSupported(host: string): Promise<HostSupportedResult>;

  /** Lists hosts for which the platform supports authenticated scraping. */
  getSupportedAuthHosts(): Promise<SupportedHostsResult>;

  /**
   * Performs an authenticated scrape. Resolves to an {@link AuthenticatedScrape}
   * on success, or a {@link ScraperErrorResult} when the platform or host does
   * not support authenticated scraping.
   */
  scrapeAuthenticated(
    url: string,
    username: string,
    password: string,
    wildMode: boolean
  ): Promise<AuthenticatedScrape | ScraperErrorResult>;
}
