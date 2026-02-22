import { ScrapedRecipe } from '@app/modules/recipe-scraper';

export const hellofreshRecipesPageHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><title>Recettes HelloFresh</title></head>
<body>
  <nav>
    <a href="/recipes/recettes-faciles">Recettes Faciles</a>
    <a href="/recipes/recettes-vegetariennes">Recettes Végétariennes</a>
    <a href="/recipes/recettes-rapides">Recettes Rapides</a>
    <a href="https://www.hellofresh.fr/recipes/plats-principaux">Plats Principaux</a>
    <a href="/recipes/poulet-tikka-masala-abc123def456789012345678">A recipe not a category</a>
  </nav>
</body>
</html>
`;

export const hellofreshCategoryPageHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><title>Recettes Faciles - HelloFresh</title></head>
<body>
  <div class="recipes-list">
    <a href="/recipes/keftas-de-boeuf-66e83b9e7dfc60d59bf5f913">
      <img src="https://img.hellofresh.com/image1.jpg" alt="Keftas de boeuf" />
      <span>Keftas de boeuf</span>
    </a>
    <a href="https://www.hellofresh.fr/recipes/poulet-tikka-masala-66e83b9e7dfc60d59bf5f914">
      <img src="https://img.hellofresh.com/image2.jpg" alt="Poulet tikka masala" />
      <span>Poulet tikka masala</span>
    </a>
    <a href="/recipes/spaghetti-bolognese-66e83b9e7dfc60d59bf5f915">
      <span>Spaghetti bolognese</span>
    </a>
    <a href="/recipes/keftas-de-boeuf-66e83b9e7dfc60d59bf5f913">
      <!-- Duplicate -->
    </a>
    <a href="/recipes/recettes-italiennes">
      <!-- This is a category, not a recipe -->
    </a>
  </div>
</body>
</html>
`;

export const hellofreshRecipePageHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <title>Keftas de bœuf - HelloFresh</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Keftas de bœuf & semoule aux épices",
    "description": "Délicieuses keftas de bœuf accompagnées de semoule aux épices",
    "image": "https://img.hellofresh.com/keftas.jpg",
    "recipeYield": "2 servings",
    "totalTime": "PT40M",
    "recipeIngredient": ["1 pièce(s) Carotte", "150 g Semoule"],
    "recipeInstructions": [
      {"@type": "HowToStep", "text": "Épluchez la carotte"},
      {"@type": "HowToStep", "text": "Préparez la semoule"}
    ],
    "keywords": ["Épicé", "Facile"]
  }
  </script>
</head>
<body></body>
</html>
`;

export const hellofreshKeftasRecipe: ScrapedRecipe = {
  title: 'Keftas de bœuf & semoule aux épices avec de la menthe & une sauce yaourt',
  description:
    'Le yaourt à la grecque que vous trouvez dans votre box est un produit 100% origine France, bien que son nom laisse penser le contraire. Produit par la Laiterie du Forez, cette entreprise familiale allie tradition et innovation pour vous offrir un yaourt onctueux et de qualité. Parfait pour sublimer cette recette de kefta de bœuf.',
  ingredients: [
    '1 pièce(s) Carotte',
    '1 pièce(s) Oignon',
    "1 pièce(s) Tête d'ail",
    '½ sachet(s) Menthe',
    '½ pièce(s) Citron',
    '1 paquet(s) Viande hachée au bœuf',
    "1 sachet(s) Mélange d'épices du Moyen-Orient",
    '1 sachet(s) Épinards',
    '150 g Semoule',
    '1 pot(s) Yaourt à la grecque',
    "2 cc Huile d'olive",
    '1 filet(s) Lait',
    '200 ml Bouillon de bœuf',
    'selon le goût Poivre et sel',
  ],
  parsedIngredients: null,
  ingredientGroups: [
    {
      purpose: null,
      ingredients: [
        '1 pièce(s) Carotte',
        '1 pièce(s) Oignon',
        "1 pièce(s) Tête d'ail",
        '½ sachet(s) Menthe',
        '½ pièce(s) Citron',
        '1 paquet(s) Viande hachée au bœuf',
        "1 sachet(s) Mélange d'épices du Moyen-Orient",
        '1 sachet(s) Épinards',
        '150 g Semoule',
        '1 pot(s) Yaourt à la grecque',
        "2 cc Huile d'olive",
        '1 filet(s) Lait',
        '200 ml Bouillon de bœuf',
        'selon le goût Poivre et sel',
      ],
    },
  ],
  instructions:
    "Veillez à bien respecter les quantités indiquées à gauche pour préparer votre recette ! Épluchez et coupez la carotte en fines demi-lunes de 5 mm (plus la découpe sera fine, plus elle cuira vite). Ciselez l'oignon finement. Faites chauffer un petit filet d'huile d'olive dans une grande sauteuse à feu moyen. Faites-y revenir la carotte et les ⅔ de l'oignon (gardez le reste pour les keftas) 10-15 min avec un filet d'eau à couvert, ou jusqu'à ce que les carottes commencent à devenir fondantes.\nPendant ce temps, ciselez l'ail. Effeuillez et ciselez la menthe. Lavez bien le citron et prélevez-en le zeste avec une râpe fine, puis coupez-le en quartiers. Dans un saladier, mélangez le bœuf avec le reste d'oignon, la moitié de l'ail, ⅓ de la menthe, ½ cc d'épices du Moyen-Orient par personne (ça pique ! Dosez-les selon votre goût), une pincée de zestes de citron (selon votre goût), du sel et du poivre. Versez un petit filet de lait. Avec vos mains, formez 3 petites boulettes allongées et légèrement aplaties par personne.\nFaites chauffer un petit filet d'huile d'olive dans une poêle à feu moyen-vif. Faites-y revenir les keftas 4-5 min de chaque côté, ou jusqu'à ce qu'elles soient cuites (conservez les sucs de cuisson).\nPréparez le bouillon dans une casserole à couvert (portez-le à ébullition). Au bout de 10-15 min de cuisson de la carotte et de l'oignon, ajoutez aux légumes le reste de l'ail, 1 cc d'épices du Moyen-Orient par personne et ⅓ de la menthe. Après avoir lavé les épinards, déchirez-les grossièrement avec vos mains par-dessus. Versez 1-2 cs d'eau par personne. Baissez le feu sur doux, couvrez et faites cuire 8-10 min, ou jusqu'à ce que les légumes soient fondants. Salez et poivrez.\nRetirez le bouillon du feu et ajoutez-y la semoule. Mélangez. Couvrez et laissez reposer jusqu'à ce qu'elle gonfle et que toute l'eau ait été absorbée. Égrainez la semoule avec une fourchette, et assaisonnez-la avec le jus de cuisson des keftas, quelques gouttes de jus de citron (selon votre goût), le reste de la menthe, du sel et du poivre. Dans un petit bol, mélangez le yaourt avec quelques gouttes de jus de citron et une pincée de zestes (selon votre goût), du sel, du poivre, un filet d'huile d'olive (si vous ne comptez pas les calories) et un petit filet d'eau.\nServez la semoule dans des assiettes creuses. Ajoutez les légumes par-dessus, puis les keftas. Arrosez le tout de sauce. LE SAVIEZ-VOUS ? Votre plat contient de la vitamine A, une vitamine qui contribue au métabolisme normal du fer.",
  instructionsList: [
    "Veillez à bien respecter les quantités indiquées à gauche pour préparer votre recette ! Épluchez et coupez la carotte en fines demi-lunes de 5 mm (plus la découpe sera fine, plus elle cuira vite). Ciselez l'oignon finement. Faites chauffer un petit filet d'huile d'olive dans une grande sauteuse à feu moyen. Faites-y revenir la carotte et les ⅔ de l'oignon (gardez le reste pour les keftas) 10-15 min avec un filet d'eau à couvert, ou jusqu'à ce que les carottes commencent à devenir fondantes.",
    "Pendant ce temps, ciselez l'ail. Effeuillez et ciselez la menthe. Lavez bien le citron et prélevez-en le zeste avec une râpe fine, puis coupez-le en quartiers. Dans un saladier, mélangez le bœuf avec le reste d'oignon, la moitié de l'ail, ⅓ de la menthe, ½ cc d'épices du Moyen-Orient par personne (ça pique ! Dosez-les selon votre goût), une pincée de zestes de citron (selon votre goût), du sel et du poivre. Versez un petit filet de lait. Avec vos mains, formez 3 petites boulettes allongées et légèrement aplaties par personne.",
    "Faites chauffer un petit filet d'huile d'olive dans une poêle à feu moyen-vif. Faites-y revenir les keftas 4-5 min de chaque côté, ou jusqu'à ce qu'elles soient cuites (conservez les sucs de cuisson).",
    "Préparez le bouillon dans une casserole à couvert (portez-le à ébullition). Au bout de 10-15 min de cuisson de la carotte et de l'oignon, ajoutez aux légumes le reste de l'ail, 1 cc d'épices du Moyen-Orient par personne et ⅓ de la menthe. Après avoir lavé les épinards, déchirez-les grossièrement avec vos mains par-dessus. Versez 1-2 cs d'eau par personne. Baissez le feu sur doux, couvrez et faites cuire 8-10 min, ou jusqu'à ce que les légumes soient fondants. Salez et poivrez.",
    "Retirez le bouillon du feu et ajoutez-y la semoule. Mélangez. Couvrez et laissez reposer jusqu'à ce qu'elle gonfle et que toute l'eau ait été absorbée. Égrainez la semoule avec une fourchette, et assaisonnez-la avec le jus de cuisson des keftas, quelques gouttes de jus de citron (selon votre goût), le reste de la menthe, du sel et du poivre. Dans un petit bol, mélangez le yaourt avec quelques gouttes de jus de citron et une pincée de zestes (selon votre goût), du sel, du poivre, un filet d'huile d'olive (si vous ne comptez pas les calories) et un petit filet d'eau.",
    'Servez la semoule dans des assiettes creuses. Ajoutez les légumes par-dessus, puis les keftas. Arrosez le tout de sauce. LE SAVIEZ-VOUS ? Votre plat contient de la vitamine A, une vitamine qui contribue au métabolisme normal du fer.',
  ],
  parsedInstructions: null,
  totalTime: 40,
  prepTime: null,
  cookTime: null,
  yields: '2 servings',
  image:
    'https://img.hellofresh.com/f_auto,fl_lossy,h_640,q_auto,w_1200/hellofresh_s3/image/HF_Y24_R232_W49_FR_RFR32965-1_Main_high-3d919a2c.jpg',
  host: 'hellofresh.com',
  canonicalUrl:
    'https://www.hellofresh.fr/recipes/keftas-de-boeuf-and-semoule-aux-epices-66e83b9e7dfc60d59bf5f913',
  siteName: 'HelloFresh',
  author: 'HelloFresh',
  language: 'fr-FR',
  category: 'Plat principal',
  cuisine: null,
  cookingMethod: null,
  keywords: ['Épicé', 'Riche en protéines', 'Calorie Smart'],
  dietaryRestrictions: null,
  ratings: 4.34,
  ratingsCount: 1657,
  nutrients: {
    calories: '572 kcal',
    fatContent: '24 g',
    saturatedFatContent: '9 g',
    carbohydrateContent: '54.3 g',
    sugarContent: '11.8 g',
    proteinContent: '31.7 g',
    fiberContent: '9.1 g',
    sodiumContent: '3.3 g',
    servingSize: '493',
  },
  equipment: null,
  links: null,
};
