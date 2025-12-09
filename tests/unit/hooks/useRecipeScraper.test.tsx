import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ScrapeResult, useRecipeScraper } from '@hooks/useRecipeScraper';
import { hellofreshKeftasRecipe } from '@test-data/scraperMocks/hellofresh';
import {
  mockScrapeRecipe,
  mockScrapeRecipeError,
  mockScrapeRecipeSuccess,
} from '@mocks/modules/recipe-scraper-mock';
import {
  mockDownloadImageToCache,
  mockDownloadImageToCacheFailure,
  mockDownloadImageToCacheSuccess,
} from '@mocks/utils/FileGestion-mock';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';

jest.mock(
  '@app/modules/recipe-scraper',
  () => require('@mocks/modules/recipe-scraper-mock').recipeScraperMock
);

jest.mock('@utils/FileGestion', () => require('@mocks/utils/FileGestion-mock').fileGestionMock());

jest.mock('react-i18next', () => require('@mocks/utils/i18n-mock').i18nMock());

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <DefaultPersonsProvider>{children}</DefaultPersonsProvider>;
  };
}

describe('useRecipeScraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadImageToCacheSuccess();
  });

  describe('HelloFresh', () => {
    beforeEach(() => {
      mockScrapeRecipeSuccess(hellofreshKeftasRecipe);
    });

    test('returns success result with recipe data', async () => {
      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      let scrapeResult: ScrapeResult | undefined;
      await act(async () => {
        scrapeResult = await result.current.scrapeAndPrepare(
          'https://www.hellofresh.fr/recipes/test'
        );
      });

      expect(scrapeResult?.success).toBe(true);
      if (scrapeResult?.success) {
        expect(scrapeResult.data.title).toBe(hellofreshKeftasRecipe.title);
        expect(scrapeResult.sourceUrl).toBe('https://www.hellofresh.fr/recipes/test');
      }
    });

    test('downloads image to cache when present', async () => {
      mockDownloadImageToCacheSuccess('/cached/image.jpg');

      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      let scrapeResult: ScrapeResult | undefined;
      await act(async () => {
        scrapeResult = await result.current.scrapeAndPrepare('https://www.hellofresh.fr/test');
      });

      expect(mockDownloadImageToCache).toHaveBeenCalledWith(hellofreshKeftasRecipe.image);
      expect(scrapeResult?.success).toBe(true);
      if (scrapeResult?.success) {
        expect(scrapeResult.data.image_Source).toBe('/cached/image.jpg');
      }
    });

    test('keeps original image URL when download fails', async () => {
      mockDownloadImageToCacheFailure();

      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      let scrapeResult: ScrapeResult | undefined;
      await act(async () => {
        scrapeResult = await result.current.scrapeAndPrepare('https://www.hellofresh.fr/test');
      });

      expect(scrapeResult?.success).toBe(true);
      if (scrapeResult?.success) {
        expect(scrapeResult.data.image_Source).toBe(hellofreshKeftasRecipe.image);
      }
    });
  });

  describe('loading state', () => {
    test('sets isLoading to true during scrape', async () => {
      mockScrapeRecipe.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true, data: hellofreshKeftasRecipe }), 100)
          )
      );

      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);

      let promise: Promise<unknown>;
      act(() => {
        promise = result.current.scrapeAndPrepare('https://example.com');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    test('returns error result when scraper fails', async () => {
      mockScrapeRecipeError('Recipe not found', 'NotFoundError');

      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      let scrapeResult: ScrapeResult | undefined;
      await act(async () => {
        scrapeResult = await result.current.scrapeAndPrepare('https://example.com');
      });

      expect(scrapeResult?.success).toBe(false);
      if (scrapeResult && !scrapeResult.success) {
        expect(scrapeResult.error).toBe('Recipe not found');
      }
      expect(result.current.error).toBe('Recipe not found');
    });

    test('returns error result when network fails', async () => {
      mockScrapeRecipe.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      let scrapeResult: ScrapeResult | undefined;
      await act(async () => {
        scrapeResult = await result.current.scrapeAndPrepare('https://example.com');
      });

      expect(scrapeResult?.success).toBe(false);
      if (scrapeResult && !scrapeResult.success) {
        expect(scrapeResult.error).toBe('Network error');
      }
    });

    test('clearError resets error state', async () => {
      mockScrapeRecipeError('Some error');

      const { result } = renderHook(() => useRecipeScraper(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.scrapeAndPrepare('https://example.com');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeUndefined();
    });
  });
});
