export default {
  title: 'Titre',
  description: 'Description',
  tags: 'Étiquettes',
  tagExplanation:
    "Les étiquettes représentent une façon d'identifier une recette afin d'en faciliter la recherche.\nVoici certains exemples d'étiquettes que vous pouvez utiliser : ",
  noRecipesFound: 'Aucune recette trouvée correspondant à vos filtres',

  similarRecipeFound: 'Recette similaire trouvée',
  similarRecipeFoundContent:
    'Une recette avec des ingrédients similaires existe déjà.\nÊtes-vous sûr de vouloir l\u0027ajouter ?\n\nRecettes existantes :',
  addAnyway: 'Ajouter',

  ingredients: 'Ingrédients ',
  ingredientReadOnlyBeforePerson: 'Ingrédients (',
  ingredientReadOnlyAfterPerson: ' personnes)',
  quantity: 'Quantité',
  unit: 'Unité',
  ingredientName: 'Nom',
  ingredientNotePlaceholder: "Note d'utilisation (ex: pour la sauce)",

  noteDialog: {
    addTitle: 'Ajouter une note',
    editTitle: 'Modifier la note',
  },
  addNoteHint: 'Appui long pour voir/ajouter une note',

  preparationReadOnly: 'Préparation : ',
  preparationOCRStep: 'Étape',
  preparationOCRStepTitle: "Titre de l'étape",
  preparationOCRStepContent: "Contenu de l'étape",

  timeReadOnlyBeforePerson: 'Préparation (',
  timeReadOnlyAfterPerson: ' min)',
  timePrefixOCR: 'Temps de préparation (minutes) :',
  timePrefixEdit: 'Temps de préparation :',
  timeSuffixEdit: 'min',

  personPrefixOCR: 'Pour combien de personnes ?',
  personPrefixEdit: 'Cette recette est pour : ',
  personSuffixEdit: ' personnes',

  validateReadOnly: 'Ajouter au menu',
  validateEdit: 'Valider les modifications',
  validateAdd: 'Ajouter cette nouvelle recette',

  extractingRecipeData: 'Extraction des données de la recette...',

  editRecipe: 'Modifier la recette',
  deleteRecipe: 'Supprimer la recette',
  recommendation: 'Recommandation',
  searchRecipeTitle: 'Titre de la recette',

  persons: 'personnes',

  recipeCard: {
    prepTime: '{{time}} min',
    persons: '{{count}} personnes',
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
    title: 'Valeurs nutritionnelles',
    titleSimple: 'Valeurs nutritionnelles:',
    per100g: 'pour 100g',
    perPortion: 'pour {{weight}}g',
    perPortionTab: 'par portion',
    addNutrition: 'Ajouter les valeurs nutritionnelles',
    removeNutrition: 'Supprimer les informations nutritionnelles',
    confirmDelete:
      'Êtes-vous sûr de vouloir supprimer toutes les informations nutritionnelles ? Cette action ne peut pas être annulée.',
    portionWeight: "Poids d'une portion :",

    // French nutrition facts labels
    energy: 'Énergie',
    energyKcal: 'Énergie (kcal)',
    energyKj: 'Énergie (kJ)',
    fat: 'Matières grasses',
    saturatedFat: 'dont acides gras saturés',
    carbohydrates: 'Glucides',
    sugars: 'dont sucres',
    fiber: 'Fibres',
    protein: 'Protéines',
    salt: 'Sel',

    ocr: {
      energyKj: ['Energie', 'Énergie', 'Énergie (kJ)', 'Energie (kJ)'],
      energyKcal: ['Energie', 'Énergie', 'Énergie (kCal)', 'Energie (kCal)'],
      fat: ['matières grasses', 'matieres grasses', 'lipides'],
      saturatedFat: ['dont acides gras saturés', 'dont saturés', 'dont satures'],
      carbohydrates: ['glucides'],
      sugars: ['dont sucres', 'dont sucre'],
      fiber: ['fibres'],
      protein: ['protéines', 'proteines'],
      salt: ['sel'],
      per100g: ['pour 100g'],
      perPortion: ['Par portion', 'Pour ce plat'],
    },
  },

  scraper: {
    ignoredIngredientPrefixes: [
      'selon le goût',
      'au goût',
      'à volonté',
      'optionnel',
      'pour garnir',
      'pour servir',
    ],
    ignoredIngredientExactMatches: ['sel', 'poivre', 'sel et poivre', 'poivre et sel'],
    stepTitle: 'Étape {{number}}',
  },
};
