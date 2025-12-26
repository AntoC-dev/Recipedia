import {
  convertIngredients,
  convertNutrition,
  convertPreparation,
  convertScrapedRecipe,
  convertTags,
  IgnoredIngredientPatterns,
  isUnparseableIngredient,
  parseIngredientString,
  parseServings,
  removeNumberedPrefix,
} from '@utils/RecipeScraperConverter';
import { hellofreshKeftasRecipe } from '@test-data/scraperMocks/hellofresh';
import { marmitonHamburgerRecipe } from '@test-data/scraperMocks/marmiton';
import { quitoqueCamembertRecipe } from '@test-data/scraperMocks/quitoque';
import { createEmptyScrapedRecipe } from '@mocks/modules/recipe-scraper-mock';

describe('RecipeScraperConverter', () => {
  const ignoredPatterns: IgnoredIngredientPatterns = {
    prefixes: ['selon le goût', 'to taste', 'optional'],
    exactMatches: ['sel', 'poivre', 'sel et poivre', 'poivre et sel', 'salt', 'pepper'],
  };
  const defaultPersons = 4;

  describe('HelloFresh', () => {
    it('converts complete recipe', () => {
      const result = convertScrapedRecipe(hellofreshKeftasRecipe, ignoredPatterns, defaultPersons);

      expect(result.title).toBe(hellofreshKeftasRecipe.title);
      expect(result.description).toBe(hellofreshKeftasRecipe.description);
      expect(result.image_Source).toBe(hellofreshKeftasRecipe.image);
      expect(result.persons).toBe(2);
      expect(result.time).toBe(70);
      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.preparation).toHaveLength(6);
      expect(result.nutrition).toBeDefined();
      expect(result.tags!.length).toBeGreaterThan(0);
      expect(result.season).toEqual([]);
    });

    it('parses French ingredients with units', () => {
      const result = convertIngredients(
        hellofreshKeftasRecipe.ingredients,
        null,
        null,
        ignoredPatterns
      );

      const semoule = result.ingredients.find(i => i.name === 'Semoule');
      expect(semoule?.quantity).toBe('150');
      expect(semoule?.unit).toBe('g');

      const bouillon = result.ingredients.find(i => i.name?.includes('Bouillon'));
      expect(bouillon?.quantity).toBe('200');
      expect(bouillon?.unit).toBe('ml');
    });

    it('skips "selon le goût" prefixed ingredients', () => {
      const result = convertIngredients(
        hellofreshKeftasRecipe.ingredients,
        null,
        null,
        ignoredPatterns
      );
      expect(result.skipped).toContain('selon le goût Poivre et sel');
    });

    it('extracts French tags from keywords', () => {
      const tags = convertTags(
        hellofreshKeftasRecipe.keywords ?? [],
        hellofreshKeftasRecipe.dietaryRestrictions ?? []
      );
      expect(tags.map(t => t.name)).toContain('Épicé');
      expect(tags.map(t => t.name)).toContain('Riche en protéines');
      expect(tags.map(t => t.name)).toContain('Calorie Smart');
    });

    it('converts 6 instruction steps', () => {
      const steps = convertPreparation(
        hellofreshKeftasRecipe.instructions ?? '',
        hellofreshKeftasRecipe.instructionsList,
        hellofreshKeftasRecipe.parsedInstructions
      );

      expect(steps).toHaveLength(6);
      expect(steps[0].title).toBe('');
      expect(steps[0].description).toContain('carotte');
    });

    it('converts nutrition per-serving to per-100g', () => {
      const nutrition = convertNutrition(hellofreshKeftasRecipe.nutrients!);

      expect(nutrition).toBeDefined();
      expect(nutrition!.portionWeight).toBe(493);
      expect(nutrition!.energyKcal).toBeCloseTo(116.0, 0);
    });

    it('includes skipped ingredients in result', () => {
      const result = convertScrapedRecipe(hellofreshKeftasRecipe, ignoredPatterns, defaultPersons);

      expect(result.skippedIngredients).toBeDefined();
      expect(result.skippedIngredients).toContain('selon le goût Poivre et sel');
    });
  });

  describe('Marmiton', () => {
    it('converts complete recipe', () => {
      const result = convertScrapedRecipe(marmitonHamburgerRecipe, ignoredPatterns, defaultPersons);

      expect(result.title).toBe('Hamburger maison');
      expect(result.description).toBe('');
      expect(result.image_Source).toContain('assets.afcdn.com');
      expect(result.persons).toBe(4);
      expect(result.time).toBe(10);
      expect(result.ingredients).toHaveLength(8);
      expect(result.preparation).toHaveLength(6);
      expect(result.nutrition).toBeUndefined();
      expect(result.tags).toHaveLength(4);
    });

    it('parses French ingredients without quantities', () => {
      const result = convertIngredients(
        marmitonHamburgerRecipe.ingredients,
        null,
        null,
        ignoredPatterns
      );

      expect(result.ingredients).toHaveLength(8);
      expect(result.skipped).toHaveLength(0);

      const pain = result.ingredients.find(i => i.name === 'pain pour hamburger');
      expect(pain).toBeDefined();
      expect(pain?.quantity).toBe('');
      expect(pain?.unit).toBe('');

      const viande = result.ingredients.find(i => i.name === 'viande hachée');
      expect(viande).toBeDefined();
    });

    it('extracts tags from keywords', () => {
      const tags = convertTags(
        marmitonHamburgerRecipe.keywords ?? [],
        marmitonHamburgerRecipe.dietaryRestrictions ?? []
      );

      expect(tags).toHaveLength(4);
      expect(tags.map(t => t.name)).toContain('hamburger');
      expect(tags.map(t => t.name)).toContain('très facile');
      expect(tags.map(t => t.name)).toContain('bon marché');
      expect(tags.map(t => t.name)).toContain('rapide');
    });

    it('converts 6 instruction steps', () => {
      const steps = convertPreparation(
        marmitonHamburgerRecipe.instructions ?? '',
        marmitonHamburgerRecipe.instructionsList,
        marmitonHamburgerRecipe.parsedInstructions
      );

      expect(steps).toHaveLength(6);
      expect(steps[0].title).toBe('');
      expect(steps[0].description).toContain('oignons');
      expect(steps[5].description).toContain('ketchup et moutarde');
    });

    it('returns undefined nutrition for empty nutrients object', () => {
      const nutrition = convertNutrition(marmitonHamburgerRecipe.nutrients!);

      expect(nutrition).toBeUndefined();
    });
  });

  describe('Quitoque', () => {
    it('converts complete recipe', () => {
      const result = convertScrapedRecipe(quitoqueCamembertRecipe, ignoredPatterns, defaultPersons);

      expect(result.title).toBe('Camembert rôti au miel et mouillettes aux épices');
      expect(result.description).toContain('camembert');
      expect(result.image_Source).toContain('quitoque.fr');
      expect(result.persons).toBe(2);
      expect(result.time).toBe(20);
      expect(result.ingredients).toHaveLength(8);
      expect(result.preparation).toHaveLength(2);
      expect(result.nutrition).toBeDefined();
      expect(result.tags).toHaveLength(5);
    });

    it('parses French ingredients with metric units', () => {
      const result = convertIngredients(
        quitoqueCamembertRecipe.ingredients,
        null,
        null,
        ignoredPatterns
      );

      const camembert = result.ingredients.find(i => i.name?.includes('camembert'));
      expect(camembert?.quantity).toBe('500');
      expect(camembert?.unit).toBe('g');

      const miel = result.ingredients.find(i => i.name?.includes('miel'));
      expect(miel?.quantity).toBe('20');
      expect(miel?.unit).toBe('ml');
    });

    it('skips exact match ingredients sel and poivre', () => {
      const result = convertIngredients(
        quitoqueCamembertRecipe.ingredients,
        null,
        null,
        ignoredPatterns
      );

      expect(result.skipped).toContain('sel');
      expect(result.skipped).toContain('poivre');
      expect(result.ingredients).toHaveLength(8);
    });

    it('extracts 5 tags from keywords', () => {
      const tags = convertTags(
        quitoqueCamembertRecipe.keywords ?? [],
        quitoqueCamembertRecipe.dietaryRestrictions ?? []
      );

      expect(tags).toHaveLength(5);
      expect(tags.map(t => t.name)).toContain('Gourmand');
      expect(tags.map(t => t.name)).toContain('Express');
      expect(tags.map(t => t.name)).toContain('Végétarien');
      expect(tags.map(t => t.name)).toContain('Noël');
      expect(tags.map(t => t.name)).toContain('Protéiné');
    });

    it('converts 2 instruction groups from parsedInstructions with titles', () => {
      const steps = convertPreparation(
        quitoqueCamembertRecipe.instructions ?? '',
        quitoqueCamembertRecipe.instructionsList,
        quitoqueCamembertRecipe.parsedInstructions
      );

      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe('Le camembert rôti');
      expect(steps[0].description).toContain('200°C');
      expect(steps[1].title).toBe('Les mouillettes');
      expect(steps[1].description).toContain('mouillettes');
      expect(steps[1].description).toContain('salade');
    });

    it('converts nutrition per-serving to per-100g', () => {
      const nutrition = convertNutrition(quitoqueCamembertRecipe.nutrients!);

      expect(nutrition).toBeDefined();
      expect(nutrition!.portionWeight).toBe(290);
      expect(nutrition!.energyKcal).toBeCloseTo(304.1, 0);
      expect(nutrition!.fat).toBeCloseTo(11.2, 0);
      expect(nutrition!.saturatedFat).toBeCloseTo(7.6, 0);
      expect(nutrition!.carbohydrates).toBeCloseTo(18.6, 0);
      expect(nutrition!.sugars).toBeCloseTo(6.8, 0);
      expect(nutrition!.fiber).toBeCloseTo(4.0, 0);
      expect(nutrition!.protein).toBeCloseTo(11.0, 0);
    });
  });

  describe('isUnparseableIngredient', () => {
    it('returns true for ingredients starting with ignored prefix', () => {
      expect(isUnparseableIngredient('selon le goût Poivre', ignoredPatterns)).toBe(true);
      expect(isUnparseableIngredient('To Taste Salt', ignoredPatterns)).toBe(true);
      expect(isUnparseableIngredient('optional: cheese', ignoredPatterns)).toBe(true);
    });

    it('returns false for normal ingredients', () => {
      expect(isUnparseableIngredient('2 cups flour', ignoredPatterns)).toBe(false);
      expect(isUnparseableIngredient('Tomato', ignoredPatterns)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isUnparseableIngredient('SELON LE GOÛT Sel', ignoredPatterns)).toBe(true);
    });

    it('handles empty patterns', () => {
      expect(isUnparseableIngredient('to taste salt', { prefixes: [], exactMatches: [] })).toBe(
        false
      );
    });

    it('returns true for exact match ingredients', () => {
      expect(isUnparseableIngredient('Poivre et sel', ignoredPatterns)).toBe(true);
      expect(isUnparseableIngredient('sel', ignoredPatterns)).toBe(true);
      expect(isUnparseableIngredient('Salt', ignoredPatterns)).toBe(true);
      expect(isUnparseableIngredient('pepper', ignoredPatterns)).toBe(true);
    });

    it('is case-insensitive for exact matches', () => {
      expect(isUnparseableIngredient('SEL ET POIVRE', ignoredPatterns)).toBe(true);
      expect(isUnparseableIngredient('POIVRE', ignoredPatterns)).toBe(true);
    });
  });

  describe('parseIngredientString', () => {
    describe('quantity + unit + name format', () => {
      it('parses "150 g Semoule"', () => {
        const result = parseIngredientString('150 g Semoule', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('150');
          expect(result.ingredient.unit).toBe('g');
          expect(result.ingredient.name).toBe('Semoule');
        }
      });

      it('parses "200 ml Bouillon de légumes"', () => {
        const result = parseIngredientString('200 ml Bouillon de légumes', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('200');
          expect(result.ingredient.unit).toBe('ml');
          expect(result.ingredient.name).toBe('Bouillon de légumes');
        }
      });

      it('parses "1 pièce(s) Carotte"', () => {
        const result = parseIngredientString('1 pièce(s) Carotte', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('1');
          expect(result.ingredient.unit).toBe('pièce(s)');
          expect(result.ingredient.name).toBe('Carotte');
        }
      });
    });

    describe('fraction quantities', () => {
      it('parses "1 1/2 cups Sugar"', () => {
        const result = parseIngredientString('1 1/2 cups Sugar', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('1.5');
          expect(result.ingredient.unit).toBe('cups');
          expect(result.ingredient.name).toBe('Sugar');
        }
      });

      it('parses "1/2 tsp Salt"', () => {
        const result = parseIngredientString('1/2 tsp Salt', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('0.5');
          expect(result.ingredient.unit).toBe('tsp');
          expect(result.ingredient.name).toBe('Salt');
        }
      });

      it('parses "3/4 cup Milk"', () => {
        const result = parseIngredientString('3/4 cup Milk', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('0.75');
          expect(result.ingredient.unit).toBe('cup');
          expect(result.ingredient.name).toBe('Milk');
        }
      });
    });

    describe('name cleaning and note extraction', () => {
      it('removes parenthetical content from ingredient name and extracts as note', () => {
        const result = parseIngredientString('100 g cheddar (achat sous vide)', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('cheddar');
          expect(result.ingredient.quantity).toBe('100');
          expect(result.ingredient.unit).toBe('g');
          expect(result.ingredient.note).toBe('achat sous vide');
        }
      });

      it('extracts first parenthetical as note when multiple exist', () => {
        const result = parseIngredientString(
          '2 cups flour (all-purpose) (sifted)',
          ignoredPatterns
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('flour');
          expect(result.ingredient.note).toBe('all-purpose');
        }
      });

      it('cleans name when only name is provided and extracts note', () => {
        const result = parseIngredientString('Tomato (fresh)', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('Tomato');
          expect(result.ingredient.quantity).toBe('');
          expect(result.ingredient.unit).toBe('');
          expect(result.ingredient.note).toBe('fresh');
        }
      });

      it('cleans name when text starts with non-numeric and extracts note', () => {
        const result = parseIngredientString('Fresh basil (Thai)', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('Fresh basil');
          expect(result.ingredient.quantity).toBe('');
          expect(result.ingredient.note).toBe('Thai');
        }
      });

      it('returns undefined note when no parenthetical content', () => {
        const result = parseIngredientString('100 g flour', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('flour');
          expect(result.ingredient.note).toBeUndefined();
        }
      });
    });

    describe('edge cases', () => {
      it('parses single word as name only', () => {
        const result = parseIngredientString('Tomato', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('Tomato');
          expect(result.ingredient.quantity).toBe('');
          expect(result.ingredient.unit).toBe('');
        }
      });

      it('parses text starting with non-numeric as name only', () => {
        const result = parseIngredientString('Fresh basil leaves', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.name).toBe('Fresh basil leaves');
          expect(result.ingredient.quantity).toBe('');
        }
      });

      it('parses "2 tomatoes" as quantity + name (no unit)', () => {
        const result = parseIngredientString('2 tomatoes', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('2');
          expect(result.ingredient.unit).toBe('');
          expect(result.ingredient.name).toBe('tomatoes');
        }
      });

      it('returns failure for ignored prefix ingredients', () => {
        const result = parseIngredientString('selon le goût Poivre et sel', ignoredPatterns);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.original).toBe('selon le goût Poivre et sel');
        }
      });

      it('handles whitespace correctly', () => {
        const result = parseIngredientString('  2   cups   flour  ', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('2');
          expect(result.ingredient.unit).toBe('cups');
          expect(result.ingredient.name).toBe('flour');
        }
      });

      it('returns just quantity when only number provided', () => {
        const result = parseIngredientString('5', ignoredPatterns);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.ingredient.quantity).toBe('');
          expect(result.ingredient.name).toBe('5');
        }
      });
    });
  });

  describe('convertIngredients', () => {
    it('converts array of ingredient strings', () => {
      const result = convertIngredients(
        ['150 g Semoule', '1 pièce(s) Carotte', 'Tomato'],
        null,
        null,
        ignoredPatterns
      );

      expect(result.ingredients).toHaveLength(3);
      expect(result.skipped).toHaveLength(0);

      expect(result.ingredients[0].name).toBe('Semoule');
      expect(result.ingredients[1].name).toBe('Carotte');
      expect(result.ingredients[2].name).toBe('Tomato');
    });

    it('separates skipped ingredients from parsed ones', () => {
      const result = convertIngredients(
        ['150 g Flour', 'selon le goût Sel', '2 cups Sugar', 'to taste Pepper'],
        null,
        null,
        ignoredPatterns
      );

      expect(result.ingredients).toHaveLength(2);
      expect(result.skipped).toHaveLength(2);

      expect(result.ingredients[0].name).toBe('Flour');
      expect(result.ingredients[1].name).toBe('Sugar');
      expect(result.skipped).toContain('selon le goût Sel');
      expect(result.skipped).toContain('to taste Pepper');
    });

    describe('with pre-parsed ingredients', () => {
      const patternsWithOliveOil: IgnoredIngredientPatterns = {
        ...ignoredPatterns,
        exactMatches: [...ignoredPatterns.exactMatches, "huile d'olive", 'olive oil'],
      };

      it('skips ignored ingredient when it has no quantity', () => {
        const result = convertIngredients(
          ["huile d'olive"],
          [{ name: "huile d'olive", quantity: '', unit: '' }],
          null,
          patternsWithOliveOil
        );

        expect(result.ingredients).toHaveLength(0);
        expect(result.skipped).toContain("huile d'olive");
      });

      it('keeps ignored ingredient when it has a quantity', () => {
        const result = convertIngredients(
          ["4 càs huile d'olive"],
          [{ name: "huile d'olive", quantity: '4', unit: 'càs' }],
          null,
          patternsWithOliveOil
        );

        expect(result.ingredients).toHaveLength(1);
        expect(result.ingredients[0].name).toBe("huile d'olive");
        expect(result.ingredients[0].quantity).toBe('4');
        expect(result.skipped).toHaveLength(0);
      });

      it('handles mix of ignored with and without quantity', () => {
        const result = convertIngredients(
          ["4 càs huile d'olive", "huile d'olive", '100 g flour'],
          [
            { name: "huile d'olive", quantity: '4', unit: 'càs' },
            { name: "huile d'olive", quantity: '', unit: '' },
            { name: 'flour', quantity: '100', unit: 'g' },
          ],
          null,
          patternsWithOliveOil
        );

        expect(result.ingredients).toHaveLength(2);
        expect(result.ingredients[0].name).toBe("huile d'olive");
        expect(result.ingredients[1].name).toBe('flour');
        expect(result.skipped).toContain("huile d'olive");
      });

      it('does not skip non-ignored ingredients without quantity', () => {
        const result = convertIngredients(
          ['tomato'],
          [{ name: 'tomato', quantity: '', unit: '' }],
          null,
          patternsWithOliveOil
        );

        expect(result.ingredients).toHaveLength(1);
        expect(result.ingredients[0].name).toBe('tomato');
        expect(result.skipped).toHaveLength(0);
      });
    });
  });

  describe('parseServings', () => {
    it('extracts number from "2 servings"', () => {
      expect(parseServings('2 servings', defaultPersons)).toBe(2);
    });

    it('extracts number from "Serves 6"', () => {
      expect(parseServings('Serves 6', defaultPersons)).toBe(6);
    });

    it('extracts number from "4 portions"', () => {
      expect(parseServings('4 portions', defaultPersons)).toBe(4);
    });

    it('returns default when yields is undefined', () => {
      expect(parseServings(undefined, defaultPersons)).toBe(4);
    });

    it('returns default when yields has no number', () => {
      expect(parseServings('several portions', defaultPersons)).toBe(4);
    });

    it('extracts first integer from complex string', () => {
      expect(parseServings('Makes 12-14 cookies', defaultPersons)).toBe(12);
    });
  });

  describe('convertTags', () => {
    it('extracts tags from keywords array', () => {
      const tags = convertTags(['Quick', 'Easy', 'Healthy'], []);

      expect(tags).toHaveLength(3);
      expect(tags.map(t => t.name)).toContain('Quick');
      expect(tags.map(t => t.name)).toContain('Easy');
      expect(tags.map(t => t.name)).toContain('Healthy');
    });

    it('extracts tags from dietaryRestrictions array', () => {
      const tags = convertTags([], ['Vegan', 'Gluten-Free']);

      expect(tags).toHaveLength(2);
      expect(tags.map(t => t.name)).toContain('Vegan');
      expect(tags.map(t => t.name)).toContain('Gluten-Free');
    });

    it('combines keywords and dietaryRestrictions', () => {
      const tags = convertTags(['Quick'], ['Vegan']);

      expect(tags).toHaveLength(2);
      expect(tags.map(t => t.name)).toContain('Quick');
      expect(tags.map(t => t.name)).toContain('Vegan');
    });

    it('deduplicates case-insensitively', () => {
      const tags = convertTags(['Vegan', 'Quick'], ['VEGAN', 'quick']);

      const veganCount = tags.filter(t => t.name.toLowerCase() === 'vegan').length;
      const quickCount = tags.filter(t => t.name.toLowerCase() === 'quick').length;
      expect(veganCount).toBe(1);
      expect(quickCount).toBe(1);
    });

    it('filters out empty strings', () => {
      const tags = convertTags(['Valid', '', '  '], []);
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe('Valid');
    });
  });

  describe('removeNumberedPrefix', () => {
    it('removes "1. " prefix', () => {
      expect(removeNumberedPrefix('1. Mix the ingredients')).toBe('Mix the ingredients');
    });

    it('removes "12. " prefix', () => {
      expect(removeNumberedPrefix('12. Final step')).toBe('Final step');
    });

    it('removes "99. " prefix', () => {
      expect(removeNumberedPrefix('99. Last step')).toBe('Last step');
    });

    it('does not remove prefix with more than 3 digits', () => {
      expect(removeNumberedPrefix('1234. Not a step')).toBe('1234. Not a step');
    });

    it('does not remove non-numeric prefix', () => {
      expect(removeNumberedPrefix('a. Introduction')).toBe('a. Introduction');
    });

    it('handles text without prefix', () => {
      expect(removeNumberedPrefix('Just a step')).toBe('Just a step');
    });

    it('trims whitespace', () => {
      expect(removeNumberedPrefix('  3. Trimmed step  ')).toBe('Trimmed step');
    });
  });

  describe('convertPreparation', () => {
    it('uses instructionsList when provided', () => {
      const steps = convertPreparation(
        'This should be ignored',
        ['First step', 'Second step', 'Third step'],
        null
      );

      expect(steps).toHaveLength(3);
      expect(steps[0].title).toBe('');
      expect(steps[0].description).toBe('First step');
      expect(steps[1].description).toBe('Second step');
    });

    it('falls back to instructions string when instructionsList is empty', () => {
      const steps = convertPreparation('1. First step\n2. Second step', [], null);

      expect(steps).toHaveLength(2);
      expect(steps[0].description).toBe('First step');
      expect(steps[1].description).toBe('Second step');
    });

    it('falls back to instructions string when instructionsList is null', () => {
      const steps = convertPreparation('Step one\nStep two', null, null);

      expect(steps).toHaveLength(2);
    });

    it('removes numbered prefixes from instructions string', () => {
      const steps = convertPreparation(
        '1. Mix ingredients\n2. Bake for 30 min\n3. Serve',
        null,
        null
      );

      expect(steps[0].description).toBe('Mix ingredients');
      expect(steps[1].description).toBe('Bake for 30 min');
      expect(steps[2].description).toBe('Serve');
    });

    it('filters out empty lines', () => {
      const steps = convertPreparation('Step one\n\n\nStep two', null, null);

      expect(steps).toHaveLength(2);
    });

    it('trims whitespace from instructionsList items', () => {
      const steps = convertPreparation('', ['  Step with spaces  '], null);

      expect(steps[0].description).toBe('Step with spaces');
    });

    it('groups parsedInstructions by title and joins descriptions', () => {
      const parsedInstructions = [
        { title: 'Le camembert rôti', instructions: ['Préchauffez le four', 'Enfournez'] },
        { title: 'Les mouillettes', instructions: ['Coupez le pain', 'Tartinez'] },
      ];
      const steps = convertPreparation('', null, parsedInstructions);

      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe('Le camembert rôti');
      expect(steps[0].description).toBe('Préchauffez le four\nEnfournez');
      expect(steps[1].title).toBe('Les mouillettes');
      expect(steps[1].description).toBe('Coupez le pain\nTartinez');
    });

    it('uses empty string for parsedInstructions without titles', () => {
      const parsedInstructions = [
        { title: null, instructions: ['Step one', 'Step two'] },
        { title: null, instructions: ['Step three'] },
      ];
      const steps = convertPreparation('', null, parsedInstructions);

      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe('');
      expect(steps[0].description).toBe('Step one\nStep two');
      expect(steps[1].title).toBe('');
      expect(steps[1].description).toBe('Step three');
    });
  });

  describe('convertNutrition', () => {
    it('returns undefined when no calories', () => {
      const nutrition = convertNutrition({
        fatContent: '10 g',
        proteinContent: '5 g',
      });

      expect(nutrition).toBeUndefined();
    });

    it('returns undefined when servingSize is missing', () => {
      const nutrition = convertNutrition({
        calories: '200 kcal',
        fatContent: '10 g',
      });

      expect(nutrition).toBeUndefined();
    });

    it('converts sodium from mg to g when value is high (> 10)', () => {
      const nutrition = convertNutrition({
        calories: '200 kcal',
        sodiumContent: '500 mg',
        servingSize: '100 g',
      });

      expect(nutrition!.salt).toBe(0.5);
    });

    it('keeps sodium as-is when value is low (<= 10)', () => {
      const nutrition = convertNutrition({
        calories: '200 kcal',
        sodiumContent: '2 g',
        servingSize: '100 g',
      });

      expect(nutrition!.salt).toBe(2);
    });

    it('calculates energyKj from energyKcal', () => {
      const nutrition = convertNutrition({
        calories: '100 kcal',
        servingSize: '100 g',
      });

      expect(nutrition!.energyKj).toBeCloseTo(418, 0);
    });

    it('converts all nutrient types', () => {
      const nutrition = convertNutrition({
        calories: '250 kcal',
        fatContent: '15 g',
        saturatedFatContent: '5 g',
        carbohydrateContent: '30 g',
        sugarContent: '10 g',
        fiberContent: '3 g',
        proteinContent: '8 g',
        servingSize: '100 g',
      });

      expect(nutrition!.fat).toBe(15);
      expect(nutrition!.saturatedFat).toBe(5);
      expect(nutrition!.carbohydrates).toBe(30);
      expect(nutrition!.sugars).toBe(10);
      expect(nutrition!.fiber).toBe(3);
      expect(nutrition!.protein).toBe(8);
    });

    it('scales values based on portion size', () => {
      const nutrition = convertNutrition({
        calories: '500 kcal',
        fatContent: '20 g',
        servingSize: '200 g',
      });

      expect(nutrition!.portionWeight).toBe(200);
      expect(nutrition!.energyKcal).toBe(250);
      expect(nutrition!.fat).toBe(10);
    });
  });

  describe('convertScrapedRecipe', () => {
    it('uses totalTime when available', () => {
      const scraped = createEmptyScrapedRecipe({
        prepTime: 30,
        totalTime: 60,
      });

      const result = convertScrapedRecipe(
        scraped,
        {
          prefixes: [],
          exactMatches: [],
        },
        defaultPersons
      );

      expect(result.time).toBe(60);
    });

    it('falls back to prepTime when totalTime is missing', () => {
      const scraped = createEmptyScrapedRecipe({
        prepTime: 30,
        totalTime: null,
      });

      const result = convertScrapedRecipe(
        scraped,
        {
          prefixes: [],
          exactMatches: [],
        },
        defaultPersons
      );

      expect(result.time).toBe(30);
    });

    it('uses default persons when yields is missing', () => {
      const scraped = createEmptyScrapedRecipe({
        yields: null,
      });

      const result = convertScrapedRecipe(
        scraped,
        {
          prefixes: [],
          exactMatches: [],
        },
        defaultPersons
      );

      expect(result.persons).toBe(4);
    });

    it('handles missing optional fields', () => {
      const scraped = createEmptyScrapedRecipe({
        title: 'Simple Recipe',
        description: null,
        image: null,
        nutrients: null,
        keywords: null,
        dietaryRestrictions: null,
      });

      const result = convertScrapedRecipe(
        scraped,
        {
          prefixes: [],
          exactMatches: [],
        },
        defaultPersons
      );

      expect(result.title).toBe('Simple Recipe');
      expect(result.description).toBe('');
      expect(result.image_Source).toBe('');
      expect(result.nutrition).toBeUndefined();
      expect(result.tags).toEqual([]);
    });
  });
});
