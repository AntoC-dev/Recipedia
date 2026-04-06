/**
 * English translations for bulk import feature
 *
 * Contains all localized strings used in the bulk import workflow including:
 * - Provider selection screen
 * - Recipe discovery and selection
 * - Validation and import progress
 * - Skipped-recipes warning shown before validation when recipes have no ingredients
 */
export default {
  title: 'Bulk Import Recipes',
  fromService: 'Import from meal kit service',
  fromServiceDescription: 'Import all recipes from supported services',
  selectSource: 'Select Source',

  provider: {
    description: 'Import recipes from {{name}}',
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
    analyzing: 'Analyzing recipes...',
    matchingIngredients: 'Matching ingredients...',
    matchingTags: 'Matching tags...',
    ready: 'Ready to validate',
    validatingTags: 'Validating Tags',
    validatingIngredients: 'Validating Ingredients',
    progress: '{{current}} of {{total}} validated',
    importingRecipes: 'Importing recipes...',
    importComplete: 'Import Complete!',
    recipesImported: '{{count}} recipe imported successfully',
    recipesImportedPlural: '{{count}} recipes imported successfully',
    importError: 'Import Failed',
    noValidRecipes:
      'No recipes have valid ingredients. Please validate at least one ingredient per recipe.',
    finish: 'Finish',
    goBack: 'Go Back',
    reviewSubtitle:
      'Some items shall be validated before adding those recipes. Map each item to an existing one in your database, add it as new, or skip it.',
    tagsSection: 'Tags ({{resolved}}/{{total}})',
    ingredientsSection: 'Ingredients ({{resolved}}/{{total}})',
    importRecipes: 'Import {{count}} recipes',
    pickTagFor: 'Pick a tag for:\n"{{name}}"',
    pickIngredientFor: 'Pick an ingredient for:\n"{{name}}"',
    similarTo: 'Similar: "{{name}}"',
    mappedTo: 'Mapped to "{{name}}"',
    skipped: 'Skipped',
    addNew: 'Add new',
    useSuggested: 'Use "{{name}}"',
    pick: 'Pick',
    skip: 'Skip',
    skippedWarningTitle: 'Some recipes will be skipped',
    skippedWarningBody:
      'The following recipes have no ingredients and will be skipped. You can add them manually from their source URL.',
    continueToImport: 'Continue',
    skippedSectionTitle: '{{count}} recipe skipped',
    skippedSectionTitlePlural: '{{count}} recipes skipped',
  },
};
