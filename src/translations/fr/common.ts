export default {
  // Common actions
  save: 'Enregistrer',
  confirm: 'Confirmer',
  cancel: 'Annuler',
  delete: 'Supprimer',
  edit: 'Modifier',
  add: 'Ajouter',
  remove: 'Retirer',
  ok: 'Ok',
  understood: 'Compris',
  success: 'Succès',
  addedToDatabase: 'La recette "{{recipeName}}" ajoutée avec succès à la base de donnée',
  addedToShoppingList: 'La recette "{{recipeName}}" ajoutée avec succès à la liste de courses',
  deletedFromDatabase: 'La recette "{{recipeName}}" a été supprimée avec succès',
  addFilter: 'Ajouter un filtre',
  seeFilterResult: 'Voir les recettes filtrées',

  // Loading states
  loading: 'Chargement...',

  // Confirmation messages
  confirmDelete: 'Êtes-vous sûr de vouloir supprimer ceci ?',
  interrogationMark: ' ?',

  // Selection prompts
  selectType: 'Sélectionner le type',

  // Error messages
  error: 'Erreur',
  errorOccurred: 'Une erreur est survenue',
  tryAgain: 'Veuillez réessayer',
  failedToAddRecipe: 'Impossible d\'ajouter la recette "{{recipeName}}"',

  // Time units
  minutes: 'minutes',
  hours: 'heures',

  // Home screen recommendations
  recommendations: {
    randomSelection: 'Sélection aléatoire',
    perfectForCurrentSeason: 'De saison',
    greatGrainDishes: 'Excellents Plats aux Céréales',
    basedOnIngredient: 'À base de {{ingredientName}}',
    tagRecipes: 'Étiqueté {{tagName}}',
  },

  // Empty states
  emptyState: {
    noRecommendations: {
      title: 'Aucune Recommandation Disponible',
      description:
        'Ajoutez des recettes à votre collection pour voir des recommandations personnalisées.',
    },
  },

  fab: {
    addManually: 'Ajouter manuellement',
    addFromUrl: 'Importer depuis un site web',
    pickFromGallery: 'Choisir depuis la galerie',
    takePhoto: 'Prendre une photo',
  },

  urlDialog: {
    title: "Importer une recette depuis l'URL",
    placeholder: "Collez l'URL de la recette",
    submit: 'Importer',
    loading: 'Récupération de la recette...',
    errorInvalidUrl: 'Veuillez entrer une URL valide',
    errorScraping: "Impossible d'extraire la recette de cette URL",
    errorNoRecipeFound: 'Aucune recette trouvée sur cette page',
    errorUnsupportedSite: "Ce site n'est pas encore supporté",
    errorNetwork: 'Erreur réseau. Vérifiez votre connexion.',
    errorTimeout: 'La requête a expiré. Veuillez réessayer.',
  },
};
