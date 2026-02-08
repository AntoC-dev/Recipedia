import { ScrapedRecipe, ScraperResult } from '@app/modules/recipe-scraper';
import { hellofreshKeftasRecipe } from '@test-data/scraperMocks/hellofresh';

export const mockScrapeRecipe = jest.fn<Promise<ScraperResult<ScrapedRecipe>>, [string]>();
export const mockScrapeRecipeFromHtml = jest.fn<
  Promise<ScraperResult<ScrapedRecipe>>,
  [string, string]
>();
export const mockScrapeRecipeAuthenticated = jest.fn<
  Promise<ScraperResult<ScrapedRecipe>>,
  [string, string, string]
>();
export const mockGetSupportedHosts = jest.fn<Promise<ScraperResult<string[]>>, []>();
export const mockIsHostSupported = jest.fn<Promise<ScraperResult<boolean>>, [string]>();
export const mockWaitForReady = jest.fn<Promise<boolean>, [number?, number?]>();
export const mockIsPythonReady = jest.fn<Promise<boolean>, []>();

export const recipeScraperMock = {
  RecipeScraper: jest.fn(),
  recipeScraper: {
    scrapeRecipe: mockScrapeRecipe,
    scrapeRecipeFromHtml: mockScrapeRecipeFromHtml,
    scrapeRecipeAuthenticated: mockScrapeRecipeAuthenticated,
    getSupportedHosts: mockGetSupportedHosts,
    isHostSupported: mockIsHostSupported,
    waitForReady: mockWaitForReady,
    isPythonReady: mockIsPythonReady,
  },
  usePythonReady: jest.fn(() => true),
  ScraperErrorTypes: {
    AuthenticationRequired: 'AuthenticationRequired',
    AuthenticationFailed: 'AuthenticationFailed',
    UnsupportedAuthSite: 'UnsupportedAuthSite',
    NoRecipeFoundError: 'NoRecipeFoundError',
    FetchError: 'FetchError',
    NoSchemaFoundInWildMode: 'NoSchemaFoundInWildMode',
    WebsiteNotImplementedError: 'WebsiteNotImplementedError',
    ConnectionError: 'ConnectionError',
    HTTPError: 'HTTPError',
    URLError: 'URLError',
    Timeout: 'timeout',
    UnsupportedPlatform: 'UnsupportedPlatform',
  },
};

export function mockScrapeRecipeSuccess(data: ScrapedRecipe = hellofreshKeftasRecipe) {
  mockScrapeRecipe.mockResolvedValue({
    success: true,
    data,
  });
}

export function mockScrapeRecipeError(message: string, type = 'Error', host?: string) {
  mockScrapeRecipe.mockResolvedValue({
    success: false,
    error: { type, message, host },
  });
}

export function mockScrapeRecipeFromHtmlSuccess(data: ScrapedRecipe = hellofreshKeftasRecipe) {
  mockScrapeRecipeFromHtml.mockResolvedValue({
    success: true,
    data,
  });
}

export function mockScrapeRecipeFromHtmlError(message: string, type = 'Error', host?: string) {
  mockScrapeRecipeFromHtml.mockResolvedValue({
    success: false,
    error: { type, message, host },
  });
}

export function mockScrapeRecipeAuthenticatedSuccess(data: ScrapedRecipe = hellofreshKeftasRecipe) {
  mockScrapeRecipeAuthenticated.mockResolvedValue({
    success: true,
    data,
  });
}

export function mockScrapeRecipeAuthenticatedError(message: string, type = 'Error') {
  mockScrapeRecipeAuthenticated.mockResolvedValue({
    success: false,
    error: { type, message },
  });
}

export function mockWaitForReadySuccess(ready = true) {
  mockWaitForReady.mockResolvedValue(ready);
}

export function mockWaitForReadyTimeout() {
  mockWaitForReady.mockResolvedValue(false);
}

export function mockWaitForReadyDelay(delayMs: number, ready = true) {
  mockWaitForReady.mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve(ready), delayMs))
  );
}

export function mockIsPythonReadyValue(ready: boolean) {
  mockIsPythonReady.mockResolvedValue(ready);
}

export function resetRecipeScraperMocks() {
  mockScrapeRecipe.mockReset();
  mockScrapeRecipeFromHtml.mockReset();
  mockScrapeRecipeAuthenticated.mockReset();
  mockGetSupportedHosts.mockReset();
  mockIsHostSupported.mockReset();
  mockWaitForReady.mockReset();
  mockIsPythonReady.mockReset();
  mockWaitForReady.mockResolvedValue(true);
  mockIsPythonReady.mockResolvedValue(true);
}

export function createEmptyScrapedRecipe(overrides: Partial<ScrapedRecipe> = {}): ScrapedRecipe {
  return {
    title: null,
    description: null,
    ingredients: [],
    parsedIngredients: null,
    ingredientGroups: null,
    instructions: null,
    instructionsList: null,
    parsedInstructions: null,
    totalTime: null,
    prepTime: null,
    cookTime: null,
    yields: null,
    image: null,
    host: null,
    canonicalUrl: null,
    siteName: null,
    author: null,
    language: null,
    category: null,
    cuisine: null,
    cookingMethod: null,
    keywords: null,
    dietaryRestrictions: null,
    ratings: null,
    ratingsCount: null,
    nutrients: null,
    equipment: null,
    links: null,
    ...overrides,
  };
}
