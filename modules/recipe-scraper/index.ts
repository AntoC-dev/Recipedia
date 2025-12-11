// Types
export type {
    HostSupportedResult,
    IngredientGroup,
    ParsedIngredient,
    RecipeLink,
    ScrapedNutrients,
    ScrapedRecipe,
    ScraperError,
    ScraperErrorResult,
    ScraperResult,
    ScraperSuccessResult,
    SupportedHostsResult,
} from './src/types';

export { ScraperErrorTypes } from './src/types';

// Scraper class and instance
export { RecipeScraper, recipeScraper } from './src/RecipeScraper';
export type { ScrapeOptions } from './src/RecipeScraper';
