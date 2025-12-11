// Types
export type {
    ScrapedNutrients,
    IngredientGroup,
    RecipeLink,
    ScrapedRecipe,
    ScraperError,
    ScraperSuccessResult,
    ScraperErrorResult,
    ScraperResult,
    SupportedHostsResult,
    HostSupportedResult,
} from './src/types';

// Scraper class and instance
export {RecipeScraper, recipeScraper} from './src/RecipeScraper';
export type {ScrapeOptions} from './src/RecipeScraper';

// Platform-specific modules (for advanced use cases)
export {default as RecipeScraperNativeModule} from './src/RecipeScraperModule';
export {RecipeScraperWeb} from './src/web/RecipeScraperWeb';
