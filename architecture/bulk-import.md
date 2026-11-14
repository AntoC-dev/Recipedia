# Bulk import pipeline

```
User selects provider (HelloFresh, Quitoque)
        |
        v
BulkImportSettings screen -- provider configuration
        |
        v
BulkImportDiscovery screen
  useDiscoveryWorkflow hook
    BaseRecipeProvider.discoverRecipes()  -- fetches category pages, extracts URLs
        |
        v
  useRecipeScraper hook
    recipe-scraper native module          -- Python scraper extracts structured data
        |
        v
BulkImportValidation screen
  useValidationWorkflow hook
    Phases: initializing → warning → reviewing → importing → complete
    User maps unknown ingredients/tags to existing DB entries
        |
        v
  useRecipes.addMultipleRecipes()         -- writes to DB
```

## Providers

- `BaseRecipeProvider` (`src/providers/BaseRecipeProvider.ts`): abstract class
  implementing `RecipeProvider`.
- Concrete (`HelloFreshProvider`, `QuitoqueProvider`) override URL discovery.
  All registered in `ProviderRegistry.ts`.
- Providers only discover URLs. Content extraction = `recipe-scraper` native
  module only.

## Validation phases

| Phase          | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| `initializing` | Analyse discovered recipes; fuzzy-match ingredients/tags against DB |
| `warning`      | Pre-validation summary of skipped/unrecognized items                |
| `reviewing`    | User maps unknown ingredients/tags one at a time                    |
| `importing`    | Batch-write validated recipes to DB                                 |
| `complete`     | Summary of imported recipes                                         |
| `error`        | Failure; user can retry                                             |
