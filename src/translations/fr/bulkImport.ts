/**
 * French translations for bulk import feature
 *
 * Contains all localized strings used in the bulk import workflow including:
 * - Provider selection screen
 * - Recipe discovery and selection
 * - Validation and import progress
 */
export default {
  title: 'Import en masse',
  fromService: 'Importer depuis un service',
  fromServiceDescription: 'Importer toutes les recettes depuis les services supportés',
  selectSource: 'Choisir la source',

  provider: {
    description: 'Importer les recettes depuis {{name}}',
  },

  discovery: {
    title: 'Recherche de recettes',
    searchingCategories: 'Recherche des catégories de recettes...',
    recipesFound: '{{count}} recette trouvée',
    recipesFoundPlural: '{{count}} recettes trouvées',
    scanningCategory: 'Analyse de la catégorie {{current}} sur {{total}}',
    scanningCategories: 'Analyse des catégories ({{current}}/{{total}})',
    complete: 'Recherche terminée',
    stopAndContinue: 'Arrêter et continuer',
    unknownProvider: 'Source inconnue',
  },

  selection: {
    title: 'Sélectionner les recettes',
    selectedCount: '{{count}} sur {{total}} sélectionnées',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    selectAllExplanation: 'Sélectionner toutes les recettes à importer',
    noRecipesFound: 'Aucune recette trouvée',
    continueToValidation: 'Continuer',
    parsingRecipes: 'Analyse des recettes...',
    failedRecipes: '{{count}} échouée(s)',
    noRecipesParsed: "Aucune recette n'a pu être analysée",
    fetchingRecipes: 'Récupération de la recette {{current}} sur {{total}}...',
    newRecipes: 'Nouvelles recettes ({{count}})',
    previouslySeen: 'Déjà vues ({{count}})',
  },

  validation: {
    title: 'Import en masse',
    initializing: 'Initialisation de la validation...',
    analyzing: 'Analyse des recettes...',
    matchingIngredients: 'Correspondance des ingrédients...',
    matchingTags: 'Correspondance des tags...',
    ready: 'Prêt à valider',
    validatingTags: 'Validation des tags',
    validatingIngredients: 'Validation des ingrédients',
    progress: '{{current}} sur {{total}} validés',
    importingRecipes: 'Import des recettes...',
    importComplete: 'Import terminé !',
    recipesImported: '{{count}} recettes importées avec succès',
    importError: "Échec de l'import",
    noValidRecipes:
      "Aucune recette n'a d'ingrédients valides. Veuillez valider au moins un ingrédient par recette.",
    finish: 'Terminer',
    goBack: 'Retour',
    reviewSubtitle:
      'Certains éléments des recettes doivent être validés avant de les ajouter.\nAssociez chaque élément à un existant, ajoutez-le comme nouveau ou ignorez-le.',
    tagsSection: 'Tags ({{resolved}}/{{total}})',
    ingredientsSection: 'Ingrédients ({{resolved}}/{{total}})',
    importRecipes: 'Importer {{count}} recettes',
    pickTagFor: 'Choisir un tag pour :\n"{{name}}"',
    pickIngredientFor: 'Choisir un ingrédient pour :\n"{{name}}"',
    similarTo: 'Similaire : « {{name}} »',
    mappedTo: 'Associé à « {{name}} »',
    skipped: 'Ignoré',
    addNew: 'Ajouter',
    useSuggested: 'Utiliser « {{name}} »',
    pick: 'Choisir',
    skip: 'Ignorer',
  },
};
