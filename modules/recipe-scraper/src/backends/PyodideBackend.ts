import type {
  HostSupportedResult,
  ScraperErrorResult,
  ScraperResult,
  SupportedHostsResult,
} from '../types';
import type { AuthenticatedScrape, ScraperBackend } from './ScraperBackend';
import { schemaRecipeParser } from '../web/SchemaRecipeParser';
import { AuthBridge } from '../ios/AuthBridge';
import { extractHost } from '../urlUtils';
import { pyodideLogger } from '@utils/logger';

type PyodideBridgeInstance = typeof import('../ios/PyodideBridge').PyodideBridge;

function getPyodideBridge(): PyodideBridgeInstance {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../ios/PyodideBridge').PyodideBridge;
}

/**
 * iOS backend backed by the Python recipe-scrapers library running in a Pyodide
 * WebView. Falls back to schema.org parsing when Pyodide is unavailable, and
 * routes authenticated scraping through the native {@link AuthBridge}.
 */
export class PyodideBackend implements ScraperBackend {
  async warmup(): Promise<void> {
    await getPyodideBridge().whenReady();
  }

  async isReady(): Promise<boolean> {
    return getPyodideBridge().isPythonReady();
  }

  async scrapeHtml(html: string, url: string, wildMode: boolean): Promise<ScraperResult> {
    const bridge = getPyodideBridge();
    try {
      return JSON.parse(await bridge.scrapeRecipeFromHtml(html, url, wildMode));
    } catch (pyodideError) {
      const initError = bridge.getInitializationError();
      if (initError) {
        pyodideLogger.warn('Pyodide never initialized', { error: initError.message });
      }
      pyodideLogger.warn('Pyodide failed, falling back to schema.org', { error: pyodideError });
      return schemaRecipeParser.parse(html, url);
    }
  }

  async getSupportedHosts(): Promise<SupportedHostsResult> {
    return JSON.parse(await getPyodideBridge().getSupportedHosts());
  }

  async isHostSupported(host: string): Promise<HostSupportedResult> {
    return JSON.parse(await getPyodideBridge().isHostSupported(host));
  }

  async getSupportedAuthHosts(): Promise<SupportedHostsResult> {
    return { success: true, data: AuthBridge.getAuthHandlerHosts() };
  }

  async scrapeAuthenticated(
    url: string,
    username: string,
    password: string
  ): Promise<AuthenticatedScrape | ScraperErrorResult> {
    const host = extractHost(url);
    if (!AuthBridge.isHostSupported(host)) {
      return {
        success: false,
        error: {
          type: 'UnsupportedAuthSite',
          message: `Authentication not supported for ${host} on iOS`,
          host,
        },
      };
    }
    const html = await AuthBridge.fetchAuthenticatedHtml(url, username, password);
    // Force wildMode=false: auth targets known supported sites that have dedicated
    // scrapers. wildMode=true would trigger an early schema.org check that these
    // sites fail (they use custom formats), discarding the dedicated scraper path.
    const result = await this.scrapeHtml(html, url, false);
    return { html, result };
  }
}
