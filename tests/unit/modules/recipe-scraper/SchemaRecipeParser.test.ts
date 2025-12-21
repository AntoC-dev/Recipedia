import { SchemaRecipeParser } from '@app/modules/recipe-scraper/src/web/SchemaRecipeParser';

describe('SchemaRecipeParser', () => {
  let parser: SchemaRecipeParser;

  beforeEach(() => {
    parser = new SchemaRecipeParser();
  });

  describe('parse', () => {
    test('returns error when no JSON-LD scripts found', () => {
      const html = '<html><body><h1>Not a recipe</h1></body></html>';

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NoRecipeFoundError');
      }
    });

    test('parses simple Recipe schema', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Chocolate Cake",
            "description": "A delicious chocolate cake",
            "recipeIngredient": ["200g flour", "100g sugar", "50g cocoa"],
            "recipeInstructions": "Mix and bake at 180°C"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com/cake');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Chocolate Cake');
        expect(result.data.description).toBe('A delicious chocolate cake');
        expect(result.data.ingredients).toEqual(['200g flour', '100g sugar', '50g cocoa']);
        expect(result.data.instructions).toBe('Mix and bake at 180°C');
        expect(result.data.host).toBe('example.com');
      }
    });

    test('parses Recipe within @graph array', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "WebSite", "name": "Recipes Site" },
              { "@type": "Recipe", "name": "Pasta Carbonara" }
            ]
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Pasta Carbonara');
      }
    });

    test('handles schema.org/Recipe type format', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "https://schema.org/Recipe",
            "name": "Salad"
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Salad');
      }
    });

    test('handles array @type with Recipe', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": ["Recipe", "HowTo"],
            "name": "Multi-type Recipe"
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Multi-type Recipe');
      }
    });

    test('handles multiple JSON-LD scripts and finds Recipe', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Organization", "name": "Company" }
          </script>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Found Recipe" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Found Recipe');
      }
    });

    test('skips invalid JSON and continues parsing', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { invalid json here }
          </script>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Valid Recipe" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Valid Recipe');
      }
    });
  });

  describe('duration parsing', () => {
    test('parses ISO 8601 durations', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "prepTime": "PT30M",
            "cookTime": "PT1H",
            "totalTime": "PT1H30M"
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prepTime).toBe(30);
        expect(result.data.cookTime).toBe(60);
        expect(result.data.totalTime).toBe(90);
      }
    });

    test('handles days in duration', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Slow Ferment",
            "totalTime": "P1DT2H"
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalTime).toBe(1560);
      }
    });
  });

  describe('instructions extraction', () => {
    test('extracts string instructions', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "recipeInstructions": "Step 1. Do this.\\nStep 2. Do that."
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructionsList).toEqual(['Step 1. Do this.', 'Step 2. Do that.']);
      }
    });

    test('extracts HowToStep instructions', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "recipeInstructions": [
              { "@type": "HowToStep", "text": "Mix ingredients" },
              { "@type": "HowToStep", "text": "Bake for 30 min" }
            ]
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructionsList).toEqual(['Mix ingredients', 'Bake for 30 min']);
        expect(result.data.instructions).toBe('Mix ingredients\nBake for 30 min');
      }
    });

    test('extracts HowToSection with itemListElement', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "recipeInstructions": [
              {
                "@type": "HowToSection",
                "name": "Prep",
                "itemListElement": [
                  { "@type": "HowToStep", "text": "Wash vegetables" }
                ]
              }
            ]
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructionsList).toContain('Prep');
        expect(result.data.instructionsList).toContain('Wash vegetables');
      }
    });
  });

  describe('yields extraction', () => {
    test('extracts string yield', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "recipeYield": "4 servings" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yields).toBe('4 servings');
      }
    });

    test('extracts numeric yield', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "recipeYield": 6 }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yields).toBe('6 servings');
      }
    });

    test('extracts first yield from array', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "recipeYield": ["8 cookies", "4 servings"] }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yields).toBe('8 cookies');
      }
    });
  });

  describe('image extraction', () => {
    test('extracts string image URL', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "image": "https://example.com/cake.jpg" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.image).toBe('https://example.com/cake.jpg');
      }
    });

    test('extracts image URL from ImageObject', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "image": { "@type": "ImageObject", "url": "https://example.com/photo.jpg" }
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.image).toBe('https://example.com/photo.jpg');
      }
    });

    test('extracts first image from array', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "image": ["https://example.com/a.jpg", "https://example.com/b.jpg"]
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.image).toBe('https://example.com/a.jpg');
      }
    });
  });

  describe('author extraction', () => {
    test('extracts string author', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "author": "Chef John" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('Chef John');
      }
    });

    test('extracts author name from Person object', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "author": { "@type": "Person", "name": "Jane Doe" }
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('Jane Doe');
      }
    });
  });

  describe('rating extraction', () => {
    test('extracts numeric rating', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "aggregateRating": { "ratingValue": 4.5, "ratingCount": 120 }
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ratings).toBe(4.5);
        expect(result.data.ratingsCount).toBe(120);
      }
    });

    test('parses string rating values', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "aggregateRating": { "ratingValue": "4.2", "reviewCount": "55" }
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ratings).toBe(4.2);
        expect(result.data.ratingsCount).toBe(55);
      }
    });
  });

  describe('nutrients extraction', () => {
    test('extracts nutrition information', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "nutrition": {
              "calories": "250 kcal",
              "proteinContent": "10g",
              "fatContent": "12g",
              "carbohydrateContent": "30g"
            }
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nutrients).toEqual({
          calories: '250 kcal',
          proteinContent: '10g',
          fatContent: '12g',
          carbohydrateContent: '30g',
        });
      }
    });
  });

  describe('keywords and dietary restrictions', () => {
    test('extracts comma-separated keywords', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "keywords": "easy, quick, vegetarian" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual(['easy', 'quick', 'vegetarian']);
      }
    });

    test('extracts array keywords', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "keywords": ["healthy", "lowfat"] }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.keywords).toEqual(['healthy', 'lowfat']);
      }
    });

    test('extracts and cleans dietary restrictions', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "suitableForDiet": ["https://schema.org/VeganDiet", "GlutenFreeDiet"]
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dietaryRestrictions).toEqual(['VeganDiet', 'GlutenFreeDiet']);
      }
    });
  });

  describe('URL and host extraction', () => {
    test('uses canonical URL from recipe when available', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test", "url": "https://canonical.com/recipe" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://original.com/page');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canonicalUrl).toBe('https://canonical.com/recipe');
        expect(result.data.host).toBe('original.com');
      }
    });

    test('falls back to provided URL when no canonical', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://fallback.com/recipe');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canonicalUrl).toBe('https://fallback.com/recipe');
      }
    });

    test('handles invalid URL gracefully for host extraction', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Recipe", "name": "Test" }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'not-a-valid-url');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.host).toBeNull();
      }
    });
  });

  describe('category and cuisine', () => {
    test('extracts string category and cuisine', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "recipeCategory": "Dessert",
            "recipeCuisine": "French",
            "cookingMethod": "Baking"
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('Dessert');
        expect(result.data.cuisine).toBe('French');
        expect(result.data.cookingMethod).toBe('Baking');
      }
    });

    test('extracts first value from arrays', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Test",
            "recipeCategory": ["Main Course", "Dinner"],
            "recipeCuisine": ["Italian", "Mediterranean"]
          }
          </script>
        </head>
        </html>
      `;

      const result = parser.parse(html, 'https://example.com');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('Main Course');
        expect(result.data.cuisine).toBe('Italian');
      }
    });
  });
});
