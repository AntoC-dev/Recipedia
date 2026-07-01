import type {
  HostSupportedResult,
  ScraperErrorResult,
  ScraperResult,
  SupportedHostsResult,
} from '../types';
import type { AuthenticatedScrape, ScraperBackend } from './ScraperBackend';
import { unsupportedPlatformError } from './ScraperBackend';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nativeModule = require('../RecipeScraperModule').default;

/**
 * Android backend backed by the embedded Python recipe-scrapers library via
 * Chaquopy. Each method delegates to the native module, which returns JSON.
 */
export class ChaquopyBackend implements ScraperBackend {
  async warmup(): Promise<void> {
    if (nativeModule.warmup) {
      await nativeModule.warmup();
    }
  }

  async isReady(): Promise<boolean> {
    if (!nativeModule.isPythonAvailable) {
      return false;
    }
    try {
      return await nativeModule.isPythonAvailable();
    } catch {
      return false;
    }
  }

  async scrapeHtml(html: string, url: string, wildMode: boolean): Promise<ScraperResult> {
    return JSON.parse(await nativeModule.scrapeRecipeFromHtml(html, url, wildMode));
  }

  async getSupportedHosts(): Promise<SupportedHostsResult> {
    return JSON.parse(await nativeModule.getSupportedHosts());
  }

  async isHostSupported(host: string): Promise<HostSupportedResult> {
    return JSON.parse(await nativeModule.isHostSupported(host));
  }

  async getSupportedAuthHosts(): Promise<SupportedHostsResult> {
    if (!nativeModule.getSupportedAuthHosts) {
      return { success: true, data: [] };
    }
    return JSON.parse(await nativeModule.getSupportedAuthHosts());
  }

  async scrapeAuthenticated(
    url: string,
    username: string,
    password: string,
    wildMode: boolean
  ): Promise<AuthenticatedScrape | ScraperErrorResult> {
    if (!nativeModule.scrapeRecipeAuthenticated) {
      return unsupportedPlatformError();
    }
    const json = await nativeModule.scrapeRecipeAuthenticated(url, username, password, wildMode);
    const { html = '', ...result } = JSON.parse(json);
    return { html, result: result as ScraperResult };
  }
}
