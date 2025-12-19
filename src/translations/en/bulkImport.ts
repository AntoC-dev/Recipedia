/**
 * English translations for bulk import feature
 *
 * Contains all localized strings used in the bulk import workflow including:
 * - Provider selection screen
 * - Recipe discovery and selection
 * - Validation and import progress
 */
export default {
  title: 'Bulk Import Recipes',
  fromService: 'Import from meal kit service',
  fromServiceDescription: 'Import all recipes from supported services',
  selectSource: 'Select Source',

  provider_hellofresh: {
    Description: 'Import recipes from HelloFresh',
  },

  discovery: {
    title: 'Discovering Recipes',
    searchingCategories: 'Looking for recipe categories...',
    recipesFound: '{{count}} recipes found',
    recipesFoundPlural: '{{count}} recipes found',
    scanningCategory: 'Scanning category {{current}} of {{total}}',
    scanningCategories: 'Scanning categories ({{current}}/{{total}})',
    complete: 'Discovery Complete',
    stopAndContinue: 'Stop & Continue',
    unknownProvider: 'Unknown provider',
  },

  selection: {
    title: 'Select Recipes',
    selectedCount: '{{count}} of {{total}} selected',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selectAllExplanation: 'Select all recipes for import',
    noRecipesFound: 'No recipes found',
    continueToValidation: 'Continue',
    parsingRecipes: 'Parsing recipes...',
    failedRecipes: '{{count}} failed',
    noRecipesParsed: 'No recipes could be parsed',
    fetchingRecipes: 'Fetching recipe {{current}} of {{total}}...',
    newRecipes: 'New recipes ({{count}})',
    previouslySeen: 'Previously seen ({{count}})',
  },

  validation: {
    title: 'Bulk Import',
    initializing: 'Initializing validation...',
    validatingTags: 'Validating Tags',
    validatingIngredients: 'Validating Ingredients',
    progress: '{{current}} of {{total}} validated',
    importingRecipes: 'Importing recipes...',
    importComplete: 'Import Complete!',
    recipesImported: '{{count}} recipes imported successfully',
    importError: 'Import Failed',
    noValidRecipes:
      'No recipes have valid ingredients. Please validate at least one ingredient per recipe.',
    finish: 'Finish',
    goBack: 'Go Back',
  },
};
