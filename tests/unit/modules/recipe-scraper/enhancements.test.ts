import {
  applyEnhancements,
  cleanDescription,
  cleanIngredientName,
  cleanKeywords,
  cleanTitle,
  extractImageFromJsonLd,
  extractKeywordsFromNextData,
  extractKcalFromSection,
  extractNumericValue,
  extractStructuredIngredients,
  extractStructuredInstructions,
  findPer100gCalories,
  findTagsInDict,
  inferServingSizeFromHtml,
  isUserFacingTag,
  parseKitchenItem,
  splitQuantityUnit,
} from '@app/modules/recipe-scraper/src/enhancements';
import type { ScrapedRecipe } from '@app/modules/recipe-scraper/src/types';
import {
  nextDataHtml,
  nutrition100gTabHtml,
  nutritionNo100gHtml,
  simpleRecipeHtml,
  structuredIngredientsHtml,
  structuredInstructionsHtml,
  structuredWithKitchenListHtml,
  unstructuredIngredientsHtml,
} from '@test-data/scraperMocks/htmlFixtures';

describe('enhancements module', () => {
  describe('findTagsInDict', () => {
    it('finds tags array', () => {
      const data = { recipe: { tags: ['Quick', 'Easy', 'Vegetarian'] } };
      const result = findTagsInDict(data);
      expect(result).toEqual(['Quick', 'Easy', 'Vegetarian']);
    });

    it('finds tags with name property', () => {
      const data = {
        recipe: {
          tags: [
            { name: 'Quick', displayLabel: true },
            { name: 'Easy', displayLabel: true },
          ],
        },
      };
      const result = findTagsInDict(data);
      expect(result).toEqual(['Quick', 'Easy']);
    });

    it('filters non-display tags', () => {
      const data = {
        recipe: {
          tags: [
            { name: 'Quick', displayLabel: true },
            { name: 'internal', displayLabel: false },
            { name: 'Vegetarian', displayLabel: true },
          ],
        },
      };
      const result = findTagsInDict(data);
      expect(result).toEqual(['Quick', 'Vegetarian']);
      expect(result).not.toContain('internal');
    });

    it('finds labels array', () => {
      const data = { page: { labels: ['Label1', 'Label2'] } };
      const result = findTagsInDict(data);
      expect(result).toEqual(['Label1', 'Label2']);
    });

    it('returns null when no tags', () => {
      const data = { recipe: { name: 'Test' } };
      const result = findTagsInDict(data);
      expect(result).toBeNull();
    });

    it('protects against deep recursion', () => {
      type JsonObject = { [key: string]: unknown };
      const deeply_nested: JsonObject = { a: {} };
      let current = deeply_nested.a as JsonObject;
      for (let i = 0; i < 15; i++) {
        current.b = {};
        current = current.b as JsonObject;
      }
      current.tags = ['Found'];

      const result = findTagsInDict(deeply_nested as Parameters<typeof findTagsInDict>[0]);
      expect(result).toBeNull();
    });
  });

  describe('isUserFacingTag', () => {
    it('returns true for string tag', () => {
      expect(isUserFacingTag('Quick')).toBe(true);
    });

    it('returns true for dict with displayLabel true', () => {
      expect(isUserFacingTag({ name: 'Quick', displayLabel: true })).toBe(true);
    });

    it('returns false for dict with displayLabel false', () => {
      expect(isUserFacingTag({ name: 'internal', displayLabel: false })).toBe(false);
    });

    it('returns false for dict without displayLabel', () => {
      expect(isUserFacingTag({ name: 'Tag' })).toBe(false);
    });

    it('supports snake_case display_label', () => {
      expect(isUserFacingTag({ name: 'Tag', display_label: true })).toBe(true);
    });
  });

  describe('cleanTitle', () => {
    it('capitalizes lowercase title', () => {
      expect(cleanTitle('hamburger maison')).toBe('Hamburger maison');
    });

    it('preserves mixed case title', () => {
      expect(cleanTitle('Chocolate Cake')).toBe('Chocolate Cake');
    });

    it('preserves uppercase title', () => {
      expect(cleanTitle('CHOCOLATE CAKE')).toBe('CHOCOLATE CAKE');
    });

    it('returns null for null', () => {
      expect(cleanTitle(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(cleanTitle('')).toBeNull();
    });
  });

  describe('cleanDescription', () => {
    it('returns valid description', () => {
      const ingredients = ['flour', 'sugar'];
      const description = 'A delicious cake recipe for beginners with chocolate';
      expect(cleanDescription(description, ingredients)).toBe(description);
    });

    it('returns null when description is ingredients', () => {
      const ingredients = ['pain pour hamburger', 'viande hachée', 'oignon', 'cheddar'];
      const description = 'pain pour hamburger, viande hachée, oignon, cheddar';
      expect(cleanDescription(description, ingredients)).toBeNull();
    });

    it('returns null for null description', () => {
      expect(cleanDescription(null, ['flour'])).toBeNull();
    });

    it('returns description when no ingredients', () => {
      const description = 'A delicious cake recipe for beginners';
      expect(cleanDescription(description, [])).toBe(description);
    });

    it('handles ingredients with parentheses', () => {
      const ingredients = ['cheddar (achat sous vide)', 'tomate'];
      const description = 'cheddar, tomate';
      expect(cleanDescription(description, ingredients)).toBeNull();
    });

    it('keeps description with enough extra content', () => {
      const ingredients = ['flour', 'sugar'];
      const description = 'flour and sugar combined to make a delicious treat';
      expect(cleanDescription(description, ingredients)).toBe(description);
    });
  });

  describe('cleanKeywords', () => {
    it('removes title from keywords', () => {
      const keywords = ['hamburger maison', 'rapide', 'facile'];
      const ingredients: string[] = [];
      const title = 'Hamburger maison';
      const result = cleanKeywords(keywords, ingredients, title);
      expect(result).not.toContain('hamburger maison');
      expect(result).toContain('rapide');
    });

    it('removes ingredients from keywords', () => {
      const keywords = ['pain pour hamburger', 'rapide', 'oignon', 'facile'];
      const ingredients = ['pain pour hamburger', 'oignon', 'tomate'];
      const title = 'Test Recipe';
      const result = cleanKeywords(keywords, ingredients, title);
      expect(result).not.toContain('pain pour hamburger');
      expect(result).not.toContain('oignon');
      expect(result).toContain('rapide');
      expect(result).toContain('facile');
    });

    it('returns null for null keywords', () => {
      expect(cleanKeywords(null, [], 'Title')).toBeNull();
    });

    it('returns null when all keywords filtered', () => {
      const keywords = ['hamburger maison'];
      const ingredients: string[] = [];
      const title = 'Hamburger maison';
      expect(cleanKeywords(keywords, ingredients, title)).toBeNull();
    });

    it('handles null title', () => {
      const keywords = ['rapide', 'facile'];
      const result = cleanKeywords(keywords, [], null);
      expect(result).toEqual(['rapide', 'facile']);
    });

    it('is case insensitive', () => {
      const keywords = ['Hamburger Maison', 'RAPIDE'];
      const ingredients: string[] = [];
      const title = 'hamburger maison';
      const result = cleanKeywords(keywords, ingredients, title);
      expect(result).not.toContain('Hamburger Maison');
      expect(result).toContain('RAPIDE');
    });
  });

  describe('extractNumericValue', () => {
    it('extracts integer', () => {
      expect(extractNumericValue('876kCal')).toBe(876);
    });

    it('extracts float', () => {
      expect(extractNumericValue('32.5g')).toBe(32.5);
    });

    it('handles comma decimal', () => {
      expect(extractNumericValue('32,5g')).toBe(32.5);
    });

    it('handles spaces', () => {
      expect(extractNumericValue('876 kCal')).toBe(876);
    });

    it('returns zero for empty string', () => {
      expect(extractNumericValue('')).toBe(0);
    });

    it('returns zero for no number', () => {
      expect(extractNumericValue('no number')).toBe(0);
    });
  });

  describe('findPer100gCalories', () => {
    it('finds calories in quantity tab', () => {
      const result = findPer100gCalories(nutrition100gTabHtml);
      expect(result).toBe(297);
    });

    it('returns zero when no 100g section', () => {
      const result = findPer100gCalories(nutritionNo100gHtml);
      expect(result).toBe(0);
    });
  });

  describe('extractKcalFromSection', () => {
    it('finds energie kcal', () => {
      const html = `
            <div>
                <span>Énergie (kCal)</span>
                <span>297</span>
            </div>
            `;
      const result = extractKcalFromSection(html);
      expect(result).toBe(297);
    });

    it('finds calories label', () => {
      const html = `
            <div>
                <span>Calories</span>
                <span>250</span>
            </div>
            `;
      const result = extractKcalFromSection(html);
      expect(result).toBe(250);
    });

    it('returns zero for no match', () => {
      const html = `
            <div>
                <span>Protein</span>
                <span>25g</span>
            </div>
            `;
      const result = extractKcalFromSection(html);
      expect(result).toBe(0);
    });
  });

  describe('inferServingSizeFromHtml', () => {
    it('infers serving size from 100g tab', () => {
      const nutrients = { calories: '876 kCal', fatContent: '66g' };
      const result = inferServingSizeFromHtml(nutrition100gTabHtml, nutrients);
      expect(result?.servingSize).toBe('295g');
    });

    it('preserves existing serving size', () => {
      const nutrients = { calories: '876 kCal', servingSize: '300g' };
      const result = inferServingSizeFromHtml(nutrition100gTabHtml, nutrients);
      expect(result?.servingSize).toBe('300g');
    });

    it('returns null for null nutrients', () => {
      const result = inferServingSizeFromHtml(nutrition100gTabHtml, null);
      expect(result).toBeNull();
    });

    it('returns unchanged when no calories', () => {
      const nutrients = { fatContent: '66g' };
      const result = inferServingSizeFromHtml(nutrition100gTabHtml, nutrients);
      expect(result?.servingSize).toBeUndefined();
    });

    it('returns unchanged when no 100g section', () => {
      const nutrients = { calories: '500 kCal' };
      const result = inferServingSizeFromHtml(nutritionNo100gHtml, nutrients);
      expect(result?.servingSize).toBeUndefined();
    });

    it('calculates accurately', () => {
      const nutrients = { calories: '594 kCal' };
      const result = inferServingSizeFromHtml(nutrition100gTabHtml, nutrients);
      const expected = Math.round((594 / 297) * 100);
      expect(result?.servingSize).toBe(`${expected}g`);
    });
  });

  describe('splitQuantityUnit', () => {
    it('splits quantity and unit', () => {
      expect(splitQuantityUnit('375 g')).toEqual(['375', 'g']);
    });

    it('splits without space', () => {
      expect(splitQuantityUnit('3x')).toEqual(['3', 'x']);
    });

    it('handles decimal', () => {
      expect(splitQuantityUnit('0.25')).toEqual(['0.25', '']);
    });

    it('handles comma decimal', () => {
      expect(splitQuantityUnit('0,25')).toEqual(['0.25', '']);
    });

    it('handles empty string', () => {
      expect(splitQuantityUnit('')).toEqual(['', '']);
    });

    it('handles no number', () => {
      expect(splitQuantityUnit('pièce')).toEqual(['', 'pièce']);
    });
  });

  describe('cleanIngredientName', () => {
    it('removes nbsp', () => {
      const result = cleanIngredientName('camembert\u00a0au lait');
      expect(result).toBe('camembert au lait');
    });

    it('normalizes whitespace', () => {
      const result = cleanIngredientName('  camembert   au   lait  ');
      expect(result).toBe('camembert au lait');
    });
  });

  describe('extractStructuredIngredients', () => {
    it('extracts from well-structured HTML', () => {
      const result = extractStructuredIngredients(structuredIngredientsHtml);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);

      expect(result![0].quantity).toBe('375');
      expect(result![0].unit).toBe('g');
      expect(result![0].name).toBe('camembert au lait cru');

      expect(result![1].quantity).toBe('3');
      expect(result![1].unit).toBe('x');
      expect(result![1].name).toBe('petits pains (240g)');

      expect(result![2].quantity).toBe('0.25');
      expect(result![2].unit).toBe('');
      expect(result![2].name).toBe('herbes de Provence');
    });

    it('returns null for unstructured HTML', () => {
      const result = extractStructuredIngredients(unstructuredIngredientsHtml);
      expect(result).toBeNull();
    });

    it('returns null when no ingredient list', () => {
      const result = extractStructuredIngredients('<html><body></body></html>');
      expect(result).toBeNull();
    });

    it('extracts kitchen list items', () => {
      const result = extractStructuredIngredients(structuredWithKitchenListHtml);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(6);

      expect(result![0].quantity).toBe('375');
      expect(result![0].unit).toBe('g');
      expect(result![0].name).toBe('camembert au lait cru');

      expect(result![1].quantity).toBe('3');
      expect(result![1].unit).toBe('x');
      expect(result![1].name).toBe('petits pains (240g)');

      expect(result![2].quantity).toBe('');
      expect(result![2].unit).toBe('');
      expect(result![2].name).toBe('sel');

      expect(result![3].quantity).toBe('');
      expect(result![3].unit).toBe('');
      expect(result![3].name).toBe('poivre');

      expect(result![4].quantity).toBe('2');
      expect(result![4].unit).toBe('càs');
      expect(result![4].name).toBe("huile d'olive");

      expect(result![5].quantity).toBe('1');
      expect(result![5].unit).toBe('càs');
      expect(result![5].name).toBe('vinaigre de votre choix');
    });
  });

  describe('parseKitchenItem', () => {
    it('parses item with quantity and unit', () => {
      expect(parseKitchenItem("2 càs huile d'olive")).toEqual(['2', 'càs', "huile d'olive"]);
    });

    it('parses item with decimal quantity', () => {
      expect(parseKitchenItem('0,5 càc sel')).toEqual(['0.5', 'càc', 'sel']);
    });

    it('parses simple name only', () => {
      expect(parseKitchenItem('sel')).toEqual(['', '', 'sel']);
    });

    it('parses name with spaces', () => {
      expect(parseKitchenItem('poivre noir')).toEqual(['', '', 'poivre noir']);
    });

    it('handles empty string', () => {
      expect(parseKitchenItem('')).toEqual(['', '', '']);
    });

    it('handles whitespace', () => {
      expect(parseKitchenItem('  sel  ')).toEqual(['', '', 'sel']);
    });
  });

  describe('extractStructuredInstructions', () => {
    it('extracts steps with titles', () => {
      const result = extractStructuredInstructions(structuredInstructionsHtml);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      expect(result![0].title).toBe('Le camembert rôti');
      expect(result![0].instructions).toHaveLength(2);
      expect(result![1].title).toBe('Les mouillettes');
      expect(result![1].instructions).toHaveLength(3);
    });

    it('returns null when no container found', () => {
      const result = extractStructuredInstructions('<html><body></body></html>');
      expect(result).toBeNull();
    });

    it('returns null when no step containers found', () => {
      const html = '<div id="preparation-steps"><p>Just text, no steps</p></div>';
      const result = extractStructuredInstructions(html);
      expect(result).toBeNull();
    });
  });

  describe('extractImageFromJsonLd', () => {
    it('extracts image string', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "Recipe", "image": "https://example.com/image.jpg"}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('extracts image from array', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "Recipe", "image": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/image1.jpg');
    });

    it('extracts image from object with url', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "Recipe", "image": {"url": "https://example.com/image.jpg", "width": 800}}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('extracts image from array of objects', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "Recipe", "image": [{"url": "https://example.com/image.jpg"}]}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('extracts image from graph format', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@graph": [{"@type": "WebPage"}, {"@type": "Recipe", "image": "https://example.com/image.jpg"}]}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('returns null for placeholder image', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "Recipe", "image": "https://example.com/placeholder.jpg"}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBeNull();
    });

    it('returns null for no json-ld', () => {
      const html = '<html><body></body></html>';
      const result = extractImageFromJsonLd(html);
      expect(result).toBeNull();
    });

    it('returns null for no image field', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "Recipe", "name": "Test Recipe"}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBeNull();
    });

    it('returns null for non-recipe type', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    {"@type": "WebPage", "image": "https://example.com/image.jpg"}
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBeNull();
    });

    it('handles invalid json', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    not valid json
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBeNull();
    });

    it('extracts image from root level array', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    [{"@context": "https://schema.org", "@type": "Recipe", "name": "Test", "image": ["https://example.com/real-image.jpg"]}]
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/real-image.jpg');
    });

    it('extracts image from root array with multiple items', () => {
      const html = `
            <html>
                <script type="application/ld+json">
                    [{"@type": "WebPage", "name": "Page"}, {"@type": "Recipe", "image": "https://example.com/recipe.jpg"}]
                </script>
            </html>
            `;
      const result = extractImageFromJsonLd(html);
      expect(result).toBe('https://example.com/recipe.jpg');
    });
  });

  describe('extractKeywordsFromNextData', () => {
    it('extracts keywords from __NEXT_DATA__', () => {
      const result = extractKeywordsFromNextData(nextDataHtml);
      expect(result).toEqual(['Quick', 'Vegetarian']);
    });

    it('returns null for HTML without __NEXT_DATA__', () => {
      const result = extractKeywordsFromNextData(simpleRecipeHtml);
      expect(result).toBeNull();
    });

    it('returns null for empty HTML', () => {
      const result = extractKeywordsFromNextData('<html></html>');
      expect(result).toBeNull();
    });
  });

  describe('applyEnhancements', () => {
    it('applies all enhancements to base result', () => {
      const baseResult: ScrapedRecipe = {
        title: 'test recipe',
        description: 'A delicious recipe for testing',
        ingredients: ['flour', 'sugar'],
        parsedIngredients: null,
        ingredientGroups: null,
        instructions: 'Mix and bake',
        instructionsList: null,
        parsedInstructions: null,
        totalTime: null,
        prepTime: null,
        cookTime: null,
        yields: null,
        image: null,
        host: null,
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
        nutrients: null,
        equipment: null,
        links: null,
      };

      const result = applyEnhancements({
        html: simpleRecipeHtml,
        baseResult,
      });

      expect(result.title).toBe('Test recipe');
    });

    it('decodes HTML entities in ingredients', () => {
      const baseResult: ScrapedRecipe = {
        title: 'Test',
        description: null,
        ingredients: ['200g d&#039;eau', 'sel &amp; poivre'],
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
        host: null,
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
        nutrients: null,
        equipment: null,
        links: null,
      };

      const result = applyEnhancements({ html: '<html></html>', baseResult });

      expect(result.ingredients).toEqual(["200g d'eau", 'sel & poivre']);
    });

    it('decodes HTML entities in title and description', () => {
      const baseResult: ScrapedRecipe = {
        title: 'Poulet d&#039;automne &amp; légumes',
        description: 'Un plat d&#039;hiver',
        ingredients: [],
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
        host: null,
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
        nutrients: null,
        equipment: null,
        links: null,
      };

      const result = applyEnhancements({ html: '<html></html>', baseResult });

      expect(result.title).toBe("Poulet d'automne & légumes");
      expect(result.description).toBe("Un plat d'hiver");
    });

    it('decodes &nbsp; in instructions to regular space', () => {
      const baseResult: ScrapedRecipe = {
        title: 'Test',
        description: null,
        ingredients: [],
        parsedIngredients: null,
        ingredientGroups: null,
        instructions: 'Ajoutez\u00a0le sel',
        instructionsList: ['Ajoutez&nbsp;le sel', 'Mélangez&nbsp;bien'],
        parsedInstructions: null,
        totalTime: null,
        prepTime: null,
        cookTime: null,
        yields: null,
        image: null,
        host: null,
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
        nutrients: null,
        equipment: null,
        links: null,
      };

      const result = applyEnhancements({ html: '<html></html>', baseResult });

      expect(result.instructionsList).toEqual(['Ajoutez\u00a0le sel', 'Mélangez\u00a0bien']);
    });

    it('passes through clean strings unchanged', () => {
      const baseResult: ScrapedRecipe = {
        title: 'test recipe',
        description: 'A delicious recipe for testing',
        ingredients: ['200g flour', '100g sugar'],
        parsedIngredients: null,
        ingredientGroups: null,
        instructions: 'Mix and bake',
        instructionsList: ['Mix ingredients', 'Bake at 180C'],
        parsedInstructions: null,
        totalTime: null,
        prepTime: null,
        cookTime: null,
        yields: null,
        image: null,
        host: null,
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
        nutrients: null,
        equipment: null,
        links: null,
      };

      const result = applyEnhancements({ html: simpleRecipeHtml, baseResult });

      expect(result.ingredients).toEqual(['200g flour', '100g sugar']);
      expect(result.instructionsList).toEqual(['Mix ingredients', 'Bake at 180C']);
    });

    it('extracts keywords from __NEXT_DATA__ when base has none', () => {
      const baseResult: ScrapedRecipe = {
        title: 'Test Recipe',
        description: 'A test',
        ingredients: [],
        parsedIngredients: null,
        ingredientGroups: null,
        instructions: 'Test',
        instructionsList: null,
        parsedInstructions: null,
        totalTime: null,
        prepTime: null,
        cookTime: null,
        yields: null,
        image: null,
        host: null,
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
        nutrients: null,
        equipment: null,
        links: null,
      };

      const result = applyEnhancements({
        html: nextDataHtml,
        baseResult,
      });

      expect(result.keywords).toEqual(['Quick', 'Vegetarian']);
    });
  });
});
