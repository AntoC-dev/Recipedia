export default {
  title: 'Title',
  description: 'Description',
  tags: 'Tags',
  tagExplanation:
    'Tags are a way to identify a recipe and make easier its search.\nHere are some examples of tags you can have : ',
  noRecipesFound: 'No recipes found matching your filters',

  similarRecipeFound: 'Similar Recipe Found',
  similarRecipeFoundContent:
    'A recipe with similar ingredients already exists.\nAre you sure you want to add this one?\n\nExisting recipes:',
  addAnyway: 'Add',

  ingredients: 'Ingredients',
  ingredientReadOnlyBeforePerson: 'Ingredients (',
  ingredientReadOnlyAfterPerson: ' persons)',
  quantity: 'Quantity',
  unit: 'Unit',
  ingredientName: 'Name',
  ingredientNotePlaceholder: 'Usage note (e.g., for the sauce)',

  ingredientsOcr: {
    boxHeaders: ['box', 'in your box'],
    personsSuffix: ['pers.', 'pers', 'persons'],
  },

  noteDialog: {
    addTitle: 'Add Note',
    editTitle: 'Edit Note',
  },
  addNoteHint: 'Long press to see/add note',

  timeReadOnlyBeforePerson: 'Preparation (',
  timeReadOnlyAfterPerson: ' min)',
  timePrefixOCR: 'Prep time (minutes):',
  timePrefixEdit: 'Time to prepare the recipe :',
  timeSuffixEdit: 'min',

  preparationReadOnly: 'Preparation :',
  preparationOCRStep: 'Step',
  preparationOCRStepTitle: 'Title of step',
  preparationOCRStepContent: 'Content of step',

  personPrefixOCR: 'How many serving (people) ?',
  personPrefixEdit: 'This recipe is for : ',
  personSuffixEdit: ' persons',

  validateReadOnly: 'Add to the menu',
  validateEdit: 'Validate the recipe with these modifications',
  validateAdd: 'Add this new recipe',

  extractingRecipeData: 'Extracting recipe data...',

  editRecipe: 'Edit Recipe',
  deleteRecipe: 'Delete Recipe',
  recommendation: 'Recommendation',
  searchRecipeTitle: 'Title of recipe',

  persons: 'persons',

  recipeCard: {
    prepTime: '{{time}} min',
    persons: '{{count}} persons',
  },

  preparationTimes: {
    noneToTen: '0-10 min',
    tenToFifteen: '10-15 min',
    FifteenToTwenty: '15-20 min',
    twentyToTwentyFive: '20-25 min',
    twentyFiveToThirty: '25-30 min',
    thirtyToFourty: '30-40 min',
    fourtyToFifty: '40-50 min',
    oneHourPlus: '+60 min',
  },

  nutrition: {
    title: 'Nutritional values',
    titleSimple: 'Nutritional values:',
    per100g: 'per 100g',
    perPortion: 'per {{weight}}g',
    perPortionTab: 'per portion',
    addNutrition: 'Add nutritional values',
    removeNutrition: 'Remove nutritional information',
    confirmDelete:
      'Are you sure you want to remove all nutritional information? This action cannot be undone.',
    portionWeight: 'Weight of one portion:',

    energy: 'Energy',
    energyKcal: 'Energy (kcal)',
    energyKj: 'Energy (kJ)',
    fat: 'Fat',
    saturatedFat: 'of which saturated fat',
    carbohydrates: 'Carbohydrates',
    sugars: 'of which sugars',
    fiber: 'Fiber',
    protein: 'Protein',
    salt: 'Salt',

    ocr: {
      energyKj: ['Energy', 'Energy (kJ)'],
      energyKcal: ['Energie', 'Energie (kCal)'],
      fat: ['fat'],
      saturatedFat: ['saturated fat', 'of which saturated'],
      carbohydrates: ['carbohydrates', 'carbs'],
      sugars: ['of which sugars', 'sugars'],
      fiber: ['fiber'],
      protein: ['protein'],
      salt: ['salt'],
      per100g: ['per 100 g'],
      perPortion: ['Per portion'],
    },
  },

  scraper: {
    ignoredIngredientPrefixes: ['to taste', 'as needed', 'optional', 'for garnish', 'for serving'],
    ignoredIngredientExactMatches: [
      'salt',
      'pepper',
      'salt and pepper',
      'pepper and salt',
      'olive oil',
    ],
    stepTitle: 'Step {{number}}',
  },
};
