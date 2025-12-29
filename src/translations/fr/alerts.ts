export default {
  missingElements: {
    titleAll: 'Tous les éléments sont manquants',
    titleSingular: 'Élement manquant',
    titlePlural: 'Élements manquants',
    messageAll:
      "Vous n'avez renseignés aucun des éléments de la recette. Avant de valider, veuillez renseigner : \n\t- une image\n\t- un titre\n\t- des ingrédients\n\t- des instructions pour la préparation\n\t- le nombre de personnes",
    messageSingularBeginning: 'Votre recette manque de ',
    messageSingularEnding: ". Veuillez l'ajouter avant de valider.",
    messageSingularNutrition:
      "Votre recette manque d'informations nutritionnelles complètes. Veuillez les ajouter avant de valider.",
    messagePlural:
      "Vous n'avez pas renseigné tous les éléments essentiels à une recette. Avant de valider, veuillez renseigner : ",
    image: 'une image',
    titleRecipe: 'un titre',
    titleIngredients: 'des ingrédients',
    titlePreparation: 'des instructions pour la préparation',
    titlePersons: 'le nombre de personnes',
    titleTime: 'un temps de préparation',
    ingredientQuantities: 'des quantités pour tous les ingrédients',
    ingredientInDatabase: 'tous les ingredients doivent être connus par Recipedia',
    ingredientNames: 'des noms pour tous les ingrédients',
    nutrition: 'informations nutritionnelles complètes',
  },
  ocrRecipe: {
    explanationText: 'Choisissez une image:',
    photo: 'Prendre une nouvelle photo',
    gallery: 'Choisir depuis la galerie',
  },
  tagSimilarity: {
    similarTagFound: 'Tag similaire trouvé',
    similarTagFoundContent:
      'Vous ajoutez "{{newTag}}". Un tag similaire existe déjà : "{{existingTag}}". Vous pouvez l\'utiliser ou modifier le nom ci-dessous pour en créer un nouveau.',
    newTagTitle: 'Tag introuvable',
    newTagContent:
      'Le tag "{{tagName}}" n\'existe pas. Vous pouvez le modifier ci-dessous avant de l\'ajouter.',
    add: 'Ajouter',
    use: 'Utiliser',
    cancel: 'Annuler',
  },
  ingredientSimilarity: {
    similarIngredientFound: 'Ingrédient similaire trouvé',
    similarIngredientFoundContent:
      'Vous ajoutez "{{newIngredient}}". Un ingrédient similaire existe déjà : "{{existingIngredient}}". Vous pouvez l\'utiliser ou modifier le nom ci-dessous pour en créer un nouveau.',
    newIngredientTitle: 'Ingrédient introuvable',
    newIngredientContent:
      "L'ingrédient \"{{ingredientName}}\" n'existe pas. Vous pouvez le modifier avant de l'ajouter.",
    add: 'Ajouter',
    use: 'Utiliser',
    cancel: 'Annuler',
  },
};
