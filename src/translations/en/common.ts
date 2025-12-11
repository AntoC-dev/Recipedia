export default {
  // Common actions
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  remove: 'Remove',
  ok: 'OK',
  understood: 'Understood',

  success: 'Success',
  addedToDatabase: 'Recipe "{{recipeName}}" has been successfully added to the database',
  addedToShoppingList: 'Recipe "{{recipeName}}" has been successfully added to the shopping list',
  deletedFromDatabase: 'Recipe "{{recipeName}}" has been successfully deleted',
  addFilter: 'Add a filter',
  seeFilterResult: 'See filtered recipes',

  // Loading states
  loading: 'Loading...',

  // Confirmation messages
  confirmDelete: 'Are you sure you want to delete ',
  interrogationMark: ' ?',

  // Selection prompts
  selectType: 'Select type',

  // Error messages
  error: 'Error',
  errorOccurred: 'An error occurred',
  tryAgain: 'Please try again',
  failedToAddRecipe: 'Failed to add recipe "{{recipeName}}"',

  // Time units
  minutes: 'minutes',
  hours: 'hours',

  // Home screen recommendations
  recommendations: {
    randomSelection: 'Random Selection',
    perfectForCurrentSeason: 'Seasonal Picks',
    greatGrainDishes: 'Great Grain Dishes',
    basedOnIngredient: '{{ingredientName}}-based',
    tagRecipes: 'Tagged {{tagName}}',
  },

  // Empty states
  emptyState: {
    noRecommendations: {
      title: 'No Recommendations Available',
      description: 'Add some recipes to your collection to see personalized recommendations.',
    },
  },

  fab: {
    addManually: 'Add manually',
    addFromUrl: 'Import from website',
    pickFromGallery: 'Pick from gallery',
    takePhoto: 'Take a photo',
  },

  urlDialog: {
    title: 'Import Recipe from URL',
    placeholder: 'Paste recipe URL',
    submit: 'Import',
    loading: 'Fetching recipe...',
    errorInvalidUrl: 'Please enter a valid URL',
    errorScraping: 'Could not extract recipe from this URL',
    errorNoRecipeFound: 'No recipe found on this page',
    errorUnsupportedSite: 'This website is not yet supported',
    errorNetwork: 'Network error. Please check your connection.',
    errorTimeout: 'Request timed out. Please try again.',
  },
};
