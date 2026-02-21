import { SchemaRecipeParser } from '@app/modules/recipe-scraper/src/web/SchemaRecipeParser';
import { applyEnhancements } from '@app/modules/recipe-scraper/src/enhancements';
import { convertNutrition } from '@app/src/utils/RecipeScraperConverter';
import {
  hellofreshKeftasRecipe,
  hellofreshRecipePageHtml,
} from '@test-data/scraperMocks/hellofresh';
import { quitoqueCamembertRecipe } from '@test-data/scraperMocks/quitoque';
import { marmitonHamburgerRecipe } from '@test-data/scraperMocks/marmiton';
import { nutritionKcalSuffixHtml } from '@test-data/scraperMocks/htmlFixtures';

const parser = new SchemaRecipeParser();

describe('Recipe Scraper Integration', () => {
  describe('SchemaRecipeParser + enhancements pipeline', () => {
    it('parses basic recipe HTML and returns success', () => {
      const result = parser.parse(
        hellofreshRecipePageHtml,
        'https://www.hellofresh.fr/recipes/keftas'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Keftas de bœuf & semoule aux épices');
      }
    });

    it('extracts all schema.org fields from HTML', () => {
      const result = parser.parse(
        hellofreshRecipePageHtml,
        'https://www.hellofresh.fr/recipes/keftas'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(
          'Délicieuses keftas de bœuf accompagnées de semoule aux épices'
        );
        expect(result.data.image).toBe('https://img.hellofresh.com/keftas.jpg');
        expect(result.data.yields).toBe('2 servings');
        expect(result.data.totalTime).toBe(40);
        expect(result.data.ingredients).toContain('1 pièce(s) Carotte');
      }
    });

    it('extracts instruction steps from HowToStep objects', () => {
      const result = parser.parse(
        hellofreshRecipePageHtml,
        'https://www.hellofresh.fr/recipes/keftas'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructionsList).toHaveLength(2);
        expect(result.data.instructionsList![0]).toBe('Épluchez la carotte');
        expect(result.data.instructionsList![1]).toBe('Préparez la semoule');
      }
    });

    it('extracts keywords from schema', () => {
      const result = parser.parse(
        hellofreshRecipePageHtml,
        'https://www.hellofresh.fr/recipes/keftas'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toContain('Épicé');
        expect(result.data.keywords).toContain('Facile');
      }
    });

    it('applies title case enhancement', () => {
      const lowercaseHtml = `
            <script type="application/ld+json">
            {"@type": "Recipe", "name": "chocolate chip cookies", "recipeIngredient": ["flour"]}
            </script>
            `;

      const baseResult = parser.parse(lowercaseHtml, 'https://example.com');

      expect(baseResult.success).toBe(true);
      if (baseResult.success) {
        const enhanced = applyEnhancements({
          html: lowercaseHtml,
          baseResult: baseResult.data,
        });
        expect(enhanced.title).toBe('Chocolate chip cookies');
      }
    });

    it('returns error for HTML without recipe schema', () => {
      const noRecipeHtml = '<html><body>No recipe here</body></html>';

      const result = parser.parse(noRecipeHtml, 'https://example.com');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NoRecipeFoundError');
      }
    });
  });

  describe('HelloFresh keftas reference data', () => {
    const recipe = hellofreshKeftasRecipe;

    it('has expected title', () => {
      expect(recipe.title).toBe(
        'Keftas de bœuf & semoule aux épices avec de la menthe & une sauce yaourt'
      );
    });

    it('has 14 ingredients', () => {
      expect(recipe.ingredients).toHaveLength(14);
    });

    it('contains key ingredients', () => {
      expect(recipe.ingredients).toContain('1 pièce(s) Carotte');
      expect(recipe.ingredients).toContain('1 pièce(s) Oignon');
      expect(recipe.ingredients).toContain('150 g Semoule');
      expect(recipe.ingredients).toContain('1 pot(s) Yaourt à la grecque');
    });

    it('has 6 instruction steps', () => {
      expect(recipe.instructionsList).toHaveLength(6);
    });

    it('has rich nutrition data', () => {
      expect(recipe.nutrients).not.toBeNull();
      expect(recipe.nutrients!.calories).toBe('572 kcal');
      expect(recipe.nutrients!.proteinContent).toBe('31.7 g');
      expect(recipe.nutrients!.servingSize).toBe('493');
    });

    it('has keywords/tags', () => {
      expect(recipe.keywords).toContain('Épicé');
      expect(recipe.keywords).toContain('Riche en protéines');
      expect(recipe.keywords).toContain('Calorie Smart');
    });

    it('has timing information', () => {
      expect(recipe.totalTime).toBe(40);
      expect(recipe.prepTime).toBeNull();
      expect(recipe.cookTime).toBeNull();
    });

    it('has host and canonical URL', () => {
      expect(recipe.host).toBe('hellofresh.com');
      expect(recipe.canonicalUrl).toContain('hellofresh.fr/recipes/keftas');
    });

    it('has ratings information', () => {
      expect(recipe.ratings).toBe(4.34);
      expect(recipe.ratingsCount).toBe(1657);
    });
  });

  describe('Quitoque camembert reference data', () => {
    const recipe = quitoqueCamembertRecipe;

    it('has expected title', () => {
      expect(recipe.title).toBe('Camembert rôti au miel et mouillettes aux épices');
    });

    it('includes kitchen basics (sel, poivre, huile)', () => {
      expect(recipe.ingredients).toContain('sel');
      expect(recipe.ingredients).toContain('poivre');
      expect(recipe.ingredients).toContain("2 càs huile d'olive");
    });

    it('has 10 ingredients', () => {
      expect(recipe.ingredients).toHaveLength(10);
    });

    it('has 10 instruction steps', () => {
      expect(recipe.instructionsList).toHaveLength(10);
    });

    it('has parsed instructions with titled sections', () => {
      expect(recipe.parsedInstructions).not.toBeNull();
      expect(recipe.parsedInstructions).toHaveLength(2);
      expect(recipe.parsedInstructions![0].title).toBe('Le camembert rôti');
      expect(recipe.parsedInstructions![1].title).toBe('Les mouillettes');
    });

    it('has nutrition data with servingSize', () => {
      expect(recipe.nutrients).not.toBeNull();
      expect(recipe.nutrients!.servingSize).toBe('290g');
      expect(recipe.nutrients!.calories).toBe('882kCal');
    });

    it('has keywords/tags', () => {
      expect(recipe.keywords).toContain('Végétarien');
      expect(recipe.keywords).toContain('Express');
      expect(recipe.keywords).toContain('Noël');
    });

    it('has host quitoque.fr', () => {
      expect(recipe.host).toBe('quitoque.fr');
    });
  });

  describe('Marmiton hamburger reference data', () => {
    const recipe = marmitonHamburgerRecipe;

    it('has expected title', () => {
      expect(recipe.title).toBe('Hamburger maison');
    });

    it('has null description (not all recipes have descriptions)', () => {
      expect(recipe.description).toBeNull();
    });

    it('has 8 ingredients without quantities', () => {
      expect(recipe.ingredients).toHaveLength(8);
      expect(recipe.ingredients[0]).toBe('pain pour hamburger');
      expect(recipe.ingredients[1]).toBe('viande hachée');
    });

    it('has 6 instruction steps', () => {
      expect(recipe.instructionsList).toHaveLength(6);
    });

    it('has empty nutrients object', () => {
      expect(recipe.nutrients).toEqual({});
    });

    it('has quick timing (10 min total)', () => {
      expect(recipe.totalTime).toBe(10);
      expect(recipe.prepTime).toBe(5);
      expect(recipe.cookTime).toBe(5);
    });

    it('has host marmiton.org', () => {
      expect(recipe.host).toBe('marmiton.org');
    });

    it('has French keywords', () => {
      expect(recipe.keywords).toContain('hamburger');
      expect(recipe.keywords).toContain('très facile');
      expect(recipe.keywords).toContain('rapide');
    });

    it('has French language', () => {
      expect(recipe.language).toBe('fr-FR');
    });
  });

  describe('ScrapedRecipe type validation', () => {
    const recipes = [hellofreshKeftasRecipe, quitoqueCamembertRecipe, marmitonHamburgerRecipe];

    it.each(recipes)('has required string fields', recipe => {
      expect(typeof recipe.title).toBe('string');
      expect(Array.isArray(recipe.ingredients)).toBe(true);
    });

    it.each(recipes)('has valid ingredient arrays', recipe => {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      recipe.ingredients.forEach(ingredient => {
        expect(typeof ingredient).toBe('string');
        expect(ingredient.length).toBeGreaterThan(0);
      });
    });

    it.each(recipes)('has instructionsList if instructions exist', recipe => {
      if (recipe.instructions) {
        expect(Array.isArray(recipe.instructionsList)).toBe(true);
        expect(recipe.instructionsList!.length).toBeGreaterThan(0);
      }
    });

    it.each(recipes)('has consistent host format', recipe => {
      expect(recipe.host).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
    });

    it.each(recipes)('has valid canonical URL when present', recipe => {
      if (recipe.canonicalUrl) {
        expect(recipe.canonicalUrl).toMatch(/^https?:\/\//);
      }
    });

    it.each(recipes)('has numeric time fields or null', recipe => {
      [recipe.totalTime, recipe.prepTime, recipe.cookTime].forEach(time => {
        expect(time === null || typeof time === 'number').toBe(true);
        if (typeof time === 'number') {
          expect(time).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Serving size inference pipeline', () => {
    it('infers serving size and converts nutrition correctly from kcal-suffix HTML', () => {
      const baseResult = {
        title: 'Tartare de saumon',
        description: null,
        ingredients: ["100 g salade d'algues", '200 g saumon frais'],
        parsedIngredients: null,
        ingredientGroups: null,
        instructions: null,
        instructionsList: null,
        parsedInstructions: null,
        totalTime: null,
        prepTime: null,
        cookTime: null,
        yields: null,
        image: null,
        host: 'quitoque.fr',
        canonicalUrl: null,
        siteName: null,
        author: null,
        language: null,
        category: null,
        cuisine: null,
        cookingMethod: null,
        keywords: null,
        dietaryRestrictions: null,
        ratings: null,
        ratingsCount: null,
        nutrients: { calories: '374kCal', fatContent: '20g', proteinContent: '15g' },
        equipment: null,
        links: null,
      };

      const enhanced = applyEnhancements({
        html: nutritionKcalSuffixHtml,
        baseResult,
      });

      expect(enhanced.nutrients).not.toBeNull();
      expect(enhanced.nutrients!.servingSize).toBe('249g');

      const nutrition = convertNutrition(enhanced.nutrients!);
      expect(nutrition).toBeDefined();
      expect(nutrition!.energyKcal).toBeCloseTo(150.2, 1);
      expect(nutrition!.portionWeight).toBe(249);
    });
  });

  describe('Edge cases', () => {
    it('decodes HTML entities through full pipeline', () => {
      const htmlWithEntities = `
            <script type="application/ld+json">
            {
                "@type": "Recipe",
                "name": "Poulet d&#039;automne",
                "description": "Un plat d&#039;hiver &amp; d&#039;automne",
                "recipeIngredient": ["200g d&#039;eau", "sel &amp; poivre"],
                "recipeInstructions": [
                    {"@type": "HowToStep", "text": "Ajoutez l&#039;huile"}
                ]
            }
            </script>
            `;

      const parseResult = parser.parse(htmlWithEntities, 'https://example.com');
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const enhanced = applyEnhancements({
          html: htmlWithEntities,
          baseResult: parseResult.data,
        });

        expect(enhanced.title).toBe("Poulet d'automne");
        expect(enhanced.description).toBe("Un plat d'hiver & d'automne");
        expect(enhanced.ingredients).toEqual(["200g d'eau", 'sel & poivre']);
        expect(enhanced.instructionsList).toEqual(["Ajoutez l'huile"]);
      }
    });

    it('handles @graph array structure', () => {
      const graphHtml = `
            <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@graph": [
                    {"@type": "WebPage", "name": "My Page"},
                    {"@type": "Recipe", "name": "Graph Recipe", "recipeIngredient": ["salt"]}
                ]
            }
            </script>
            `;

      const result = parser.parse(graphHtml, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Graph Recipe');
      }
    });

    it('handles multiple JSON-LD scripts', () => {
      const multiScriptHtml = `
            <script type="application/ld+json">{"@type": "Organization", "name": "Test"}</script>
            <script type="application/ld+json">{"@type": "Recipe", "name": "Second Recipe", "recipeIngredient": ["flour"]}</script>
            `;

      const result = parser.parse(multiScriptHtml, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Second Recipe');
      }
    });

    it('handles nested recipe in array', () => {
      const arrayHtml = `
            <script type="application/ld+json">
            [
                {"@type": "Recipe", "name": "Array Recipe", "recipeIngredient": ["sugar"]}
            ]
            </script>
            `;

      const result = parser.parse(arrayHtml, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Array Recipe');
      }
    });

    it('extracts numeric yield when provided as number', () => {
      const numericYieldHtml = `
            <script type="application/ld+json">
            {"@type": "Recipe", "name": "Test", "recipeYield": 4, "recipeIngredient": []}
            </script>
            `;

      const result = parser.parse(numericYieldHtml, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yields).toBe('4 servings');
      }
    });

    it('handles ISO 8601 duration parsing', () => {
      const durationHtml = `
            <script type="application/ld+json">
            {"@type": "Recipe", "name": "Test", "totalTime": "PT1H30M", "prepTime": "PT45M", "recipeIngredient": []}
            </script>
            `;

      const result = parser.parse(durationHtml, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalTime).toBe(90);
        expect(result.data.prepTime).toBe(45);
      }
    });
  });
});
