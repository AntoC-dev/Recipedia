import {
  DEFAULT_SCRAPER_ERROR_I18N_KEY,
  isScraperError,
  isScraperSuccess,
  SCRAPER_ERROR_I18N_KEYS,
  ScraperResult,
} from '@utils/RecipeScraper';
import { createEmptyScrapedRecipe } from '@mocks/modules/recipe-scraper-mock';

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

describe('RecipeScraper', () => {
  describe('isScraperSuccess', () => {
    test('returns true for success result', () => {
      const result: ScraperResult = {
        success: true,
        data: createEmptyScrapedRecipe({ title: 'Test', host: 'example.com' }),
      };

      expect(isScraperSuccess(result)).toBe(true);
    });

    test('returns false for error result', () => {
      const result: ScraperResult = {
        success: false,
        error: { type: 'Error', message: 'Failed' },
      };

      expect(isScraperSuccess(result)).toBe(false);
    });

    test('type narrows to ScraperSuccessResult', () => {
      const result: ScraperResult = {
        success: true,
        data: createEmptyScrapedRecipe({ title: 'Test', host: 'example.com' }),
      };

      if (isScraperSuccess(result)) {
        expect(result.data.title).toBe('Test');
      }
    });
  });

  describe('isScraperError', () => {
    test('returns true for error result', () => {
      const result: ScraperResult = {
        success: false,
        error: { type: 'Error', message: 'Failed' },
      };

      expect(isScraperError(result)).toBe(true);
    });

    test('returns false for success result', () => {
      const result: ScraperResult = {
        success: true,
        data: createEmptyScrapedRecipe({ title: 'Test', host: 'example.com' }),
      };

      expect(isScraperError(result)).toBe(false);
    });

    test('type narrows to ScraperErrorResult', () => {
      const result: ScraperResult = {
        success: false,
        error: { type: 'Error', message: 'Failed' },
      };

      if (isScraperError(result)) {
        expect(result.error.message).toBe('Failed');
      }
    });
  });

  describe('SCRAPER_ERROR_I18N_KEYS', () => {
    test('maps NoSchemaFoundInWildMode to errorNoRecipeFound', () => {
      expect(SCRAPER_ERROR_I18N_KEYS.NoSchemaFoundInWildMode).toBe('urlDialog.errorNoRecipeFound');
    });

    test('maps WebsiteNotImplementedError to errorUnsupportedSite', () => {
      expect(SCRAPER_ERROR_I18N_KEYS.WebsiteNotImplementedError).toBe(
        'urlDialog.errorUnsupportedSite'
      );
    });

    test('maps ConnectionError to errorNetwork', () => {
      expect(SCRAPER_ERROR_I18N_KEYS.ConnectionError).toBe('urlDialog.errorNetwork');
    });

    test('maps HTTPError to errorNetwork', () => {
      expect(SCRAPER_ERROR_I18N_KEYS.HTTPError).toBe('urlDialog.errorNetwork');
    });

    test('maps URLError to errorNetwork', () => {
      expect(SCRAPER_ERROR_I18N_KEYS.URLError).toBe('urlDialog.errorNetwork');
    });

    test('maps timeout to errorTimeout', () => {
      expect(SCRAPER_ERROR_I18N_KEYS.timeout).toBe('urlDialog.errorTimeout');
    });
  });

  describe('DEFAULT_SCRAPER_ERROR_I18N_KEY', () => {
    test('is urlDialog.errorScraping', () => {
      expect(DEFAULT_SCRAPER_ERROR_I18N_KEY).toBe('urlDialog.errorScraping');
    });
  });
});
