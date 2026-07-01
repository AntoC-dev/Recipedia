import type {
  HostSupportedResult,
  ScraperErrorResult,
  ScraperResult,
  SupportedHostsResult,
} from '../types';
import type { AuthenticatedScrape, ScraperBackend } from './ScraperBackend';
import { unsupportedPlatformError } from './ScraperBackend';
import { schemaRecipeParser } from '../web/SchemaRecipeParser';

/**
 * Web and test backend. Has no Python runtime: parses recipes purely from
 * schema.org markup and reports no native scraping or authentication support.
 */
export class SchemaBackend implements ScraperBackend {
  async warmup(): Promise<void> {}

  async isReady(): Promise<boolean> {
    return true;
  }

  async scrapeHtml(html: string, url: string): Promise<ScraperResult> {
    return schemaRecipeParser.parse(html, url);
  }

  async getSupportedHosts(): Promise<SupportedHostsResult> {
    return { success: true, data: [] };
  }

  async isHostSupported(): Promise<HostSupportedResult> {
    return { success: true, data: false };
  }

  async getSupportedAuthHosts(): Promise<SupportedHostsResult> {
    return { success: true, data: [] };
  }

  async scrapeAuthenticated(): Promise<AuthenticatedScrape | ScraperErrorResult> {
    return unsupportedPlatformError();
  }
}
