export default {
  missingElements: {
    titleAll: 'All elements missing',
    titleSingular: 'Missing element',
    titlePlural: 'Missing elements',
    messageAll:
      "You haven't add any of the elements to your recipe. Please enter before validate at least: \
                                                                  \n\t- an image\n\t- a title\n\t- some ingredients\n\t- for how many persons this recipe is\n\t- some instructions for the preparation",
    messageSingularBeginning: "You're missing ",
    messageSingularEnding: ' to your recipe. Please add this before validate.',
    messageSingularNutrition:
      'Your recipe is missing complete nutrition information. Please add this before validate.',
    messagePlural:
      "You haven't add all of the elements to your recipe. Please enter before validate at least: ",

    image: 'an image',
    titleRecipe: 'a title',
    titleIngredients: 'some ingredients',
    titlePreparation: 'some instructions for the preparation',
    titlePersons: 'for how many persons this recipe is',
    titleTime: 'a preparation time',
    ingredientQuantities: 'quantities for all ingredients',
    ingredientInDatabase: 'all ingredients to be known by Recipedia',
    ingredientNames: 'names for all ingredients',
    nutrition: 'complete nutrition information',
  },
  ocrRecipe: {
    explanationText: 'Choose a picture:',
    photo: 'Take a new photo',
    gallery: 'Choose from gallery',
  },
  tagSimilarity: {
    similarTagFound: 'Similar tag found',
    similarTagFoundContent:
      'You\'re adding "{{newTag}}". A similar tag already exists: "{{existingTag}}". You can use it or modify the name below to create a new one.',
    newTagTitle: 'Tag not found',
    newTagContent: 'The tag "{{tagName}}" doesn\'t exist. You can modify it below before adding.',
    add: 'Add',
    use: 'Use',
    cancel: 'Cancel',
    chooseAnother: 'Choose another',
    pickerTitle: 'Pick a tag',
  },
  ingredientSimilarity: {
    similarIngredientFound: 'Similar ingredient found',
    similarIngredientFoundContent:
      'You\'re adding "{{newIngredient}}". A similar ingredient already exists: "{{existingIngredient}}". You can use it or modify the name below to create a new one.',
    newIngredientTitle: 'Ingredient not found',
    newIngredientContent:
      'The ingredient "{{ingredientName}}" doesn\'t exist. You can modify it before adding.',
    add: 'Add',
    use: 'Use',
    cancel: 'Cancel',
    chooseAnother: 'Choose another',
    pickerTitle: 'Pick an ingredient',
  },
  databasePicker: {
    searchPlaceholder: 'Search...',
    noResults: 'No items found',
    confirmTitle: 'Confirm selection',
    confirmContent: 'Use "{{selectedItem}}" instead of "{{newItem}}"?',
    confirm: 'Confirm',
    back: 'Back',
  },
};
