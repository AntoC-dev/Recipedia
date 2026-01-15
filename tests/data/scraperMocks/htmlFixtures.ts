export const simpleRecipeHtml = `
<!DOCTYPE html>
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Chocolate Cake",
        "description": "A delicious chocolate cake recipe",
        "recipeIngredient": ["200g flour", "100g sugar", "50g cocoa powder"],
        "recipeInstructions": "Mix all ingredients and bake at 180°C for 30 minutes.",
        "prepTime": "PT15M",
        "cookTime": "PT30M",
        "totalTime": "PT45M",
        "recipeYield": "8 servings",
        "author": {"@type": "Person", "name": "Chef Test"},
        "image": "https://example.com/cake.jpg"
    }
    </script>
</head>
<body></body>
</html>
`;

export const nextDataHtml = `
<!DOCTYPE html>
<html>
<head>
    <script id="__NEXT_DATA__" type="application/json">
    {
        "props": {
            "pageProps": {
                "recipe": {
                    "name": "Test Recipe",
                    "tags": [
                        {"name": "Quick", "displayLabel": true},
                        {"name": "internal-tag", "displayLabel": false},
                        {"name": "Vegetarian", "displayLabel": true}
                    ]
                }
            }
        }
    }
    </script>
</head>
<body></body>
</html>
`;

export const nutrition100gTabHtml = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="quantity">
    <div>
        <span>Énergie (kCal)</span>
        <span>297</span>
    </div>
</div>
<div id="portion">
    <div>
        <span>Énergie (kCal)</span>
        <span>876</span>
    </div>
</div>
</body>
</html>
`;

export const nutritionNo100gHtml = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<div class="nutrition">
    <span>Énergie</span>
    <span>500 kCal</span>
</div>
</body>
</html>
`;

export const structuredIngredientsHtml = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="ingredient-list">
    <li>
        <span class="bold">375 g</span>
        <span>camembert au lait cru</span>
    </li>
    <li>
        <span class="bold">3x</span>
        <span>petits pains (240g)</span>
    </li>
    <li>
        <span class="bold">0.25</span>
        <span>herbes de Provence</span>
    </li>
</ul>
</body>
</html>
`;

export const unstructuredIngredientsHtml = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="ingredients">
    <li>375 g camembert</li>
    <li>3 petits pains</li>
</ul>
</body>
</html>
`;

export const structuredWithKitchenListHtml = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="ingredient-list">
    <li>
        <span class="bold">375 g</span>
        <span>camembert au lait cru</span>
    </li>
    <li>
        <span class="bold">3x</span>
        <span>petits pains (240g)</span>
    </li>
</ul>
<p class="bold m-0 mb-1">Dans votre cuisine</p>
<ul class="kitchen-list">
    <li class="regular body-2 mb-2">sel</li>
    <li class="regular body-2 mb-2">poivre</li>
    <li class="regular body-2 mb-2">2 càs huile d'olive</li>
    <li class="regular body-2 mb-2">1 càs vinaigre de votre choix</li>
</ul>
</body>
</html>
`;

export const structuredInstructionsHtml = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="preparation-steps">
    <div class="toggle w-100 mb-2">
        <p class="regular body-3 m-0 c-gray-400">Étape 1</p>
        <p class="bold mb-2">1. Le camembert rôti</p>
        <ul class="ps-4">
            <li class="body-2 regular m-0">Préchauffez votre four à 200°C.</li>
            <li class="body-2 regular m-0">Déposez le camembert sur une plaque.</li>
        </ul>
    </div>
    <div class="step w-100 mb-2">
        <p class="regular body-3 m-0">Étape 2</p>
        <p class="bold mb-2">2. Les mouillettes</p>
        <ul>
            <li class="body-2 regular m-0">Coupez les petits pains pour réaliser des mouillettes.</li>
            <li class="body-2 regular m-0">Placez-les à côté du camembert.</li>
            <li class="body-2 regular m-0">Enfournez le tout 12 à 15 min.</li>
        </ul>
    </div>
</div>
</body>
</html>
`;
