import {
  DEFAULT_SCRAPER_ERROR_I18N_KEY,
  isScraperSuccess,
  SCRAPER_ERROR_I18N_KEYS,
  ScraperErrorTypes,
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

  describe('SCRAPER_ERROR_I18N_KEYS', () => {
    test('maps NoSchemaFoundInWildMode to errorNoRecipeFound', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.NoSchemaFoundInWildMode]).toBe(
        'urlDialog.errorNoRecipeFound'
      );
    });

    test('maps WebsiteNotImplementedError to errorUnsupportedSite', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.WebsiteNotImplementedError]).toBe(
        'urlDialog.errorUnsupportedSite'
      );
    });

    test('maps ConnectionError to errorNetwork', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.ConnectionError]).toBe(
        'urlDialog.errorNetwork'
      );
    });

    test('maps HTTPError to errorNetwork', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.HTTPError]).toBe('urlDialog.errorNetwork');
    });

    test('maps URLError to errorNetwork', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.URLError]).toBe('urlDialog.errorNetwork');
    });

    test('maps Timeout to errorTimeout', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.Timeout]).toBe('urlDialog.errorTimeout');
    });

    test('maps AuthenticationRequired to errorAuthRequired', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.AuthenticationRequired]).toBe(
        'urlDialog.errorAuthRequired'
      );
    });

    test('maps AuthenticationFailed to errorAuthFailed', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.AuthenticationFailed]).toBe(
        'urlDialog.errorAuthFailed'
      );
    });

    test('maps UnsupportedAuthSite to errorUnsupportedAuth', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.UnsupportedAuthSite]).toBe(
        'urlDialog.errorUnsupportedAuth'
      );
    });

    test('maps UnsupportedPlatform to errorUnsupportedPlatform', () => {
      expect(SCRAPER_ERROR_I18N_KEYS[ScraperErrorTypes.UnsupportedPlatform]).toBe(
        'urlDialog.errorUnsupportedPlatform'
      );
    });
  });

  describe('ScraperErrorTypes', () => {
    test('has all expected error type values', () => {
      expect(ScraperErrorTypes.AuthenticationRequired).toBe('AuthenticationRequired');
      expect(ScraperErrorTypes.AuthenticationFailed).toBe('AuthenticationFailed');
      expect(ScraperErrorTypes.UnsupportedAuthSite).toBe('UnsupportedAuthSite');
      expect(ScraperErrorTypes.NoRecipeFoundError).toBe('NoRecipeFoundError');
      expect(ScraperErrorTypes.FetchError).toBe('FetchError');
      expect(ScraperErrorTypes.NoSchemaFoundInWildMode).toBe('NoSchemaFoundInWildMode');
      expect(ScraperErrorTypes.WebsiteNotImplementedError).toBe('WebsiteNotImplementedError');
      expect(ScraperErrorTypes.ConnectionError).toBe('ConnectionError');
      expect(ScraperErrorTypes.HTTPError).toBe('HTTPError');
      expect(ScraperErrorTypes.URLError).toBe('URLError');
      expect(ScraperErrorTypes.Timeout).toBe('timeout');
      expect(ScraperErrorTypes.UnsupportedPlatform).toBe('UnsupportedPlatform');
    });

    test('can be used as keys in SCRAPER_ERROR_I18N_KEYS', () => {
      const networkErrors = [
        ScraperErrorTypes.ConnectionError,
        ScraperErrorTypes.HTTPError,
        ScraperErrorTypes.URLError,
      ];

      networkErrors.forEach(errorType => {
        expect(SCRAPER_ERROR_I18N_KEYS[errorType]).toBe('urlDialog.errorNetwork');
      });
    });
  });

  describe('DEFAULT_SCRAPER_ERROR_I18N_KEY', () => {
    test('is urlDialog.errorScraping', () => {
      expect(DEFAULT_SCRAPER_ERROR_I18N_KEY).toBe('urlDialog.errorScraping');
    });
  });
});
