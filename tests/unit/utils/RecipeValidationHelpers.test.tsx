import {
  addNonDuplicateTags,
  addOrMergeIngredientMatches,
  filterOutExistingTags,
  processIngredientsForValidation,
  processTagsForValidation,
  removeIngredientByName,
  removeTagByName,
  replaceMatchingIngredients,
  replaceMatchingTags,
} from '@utils/RecipeValidationHelpers';
import {
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

describe('RecipeValidationHelpers', () => {
  describe('processTagsForValidation', () => {
    const mockFindSimilarTags = jest.fn();

    const dbTags: tagTableElement[] = [
      { id: 1, name: 'Vegetarian' },
      { id: 2, name: 'Italian' },
      { id: 3, name: 'Quick Meal' },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns exact match in exactMatches and empty needsValidation for exact match tag', () => {
      mockFindSimilarTags.mockReturnValue([dbTags[0]]);

      const inputTags: tagTableElement[] = [{ name: 'Vegetarian' }];
      const result = processTagsForValidation(inputTags, mockFindSimilarTags);

      expect(result.exactMatches).toEqual([dbTags[0]]);
      expect(result.needsValidation).toEqual([]);
      expect(mockFindSimilarTags).toHaveBeenCalledWith('Vegetarian');
    });

    test('returns tag in needsValidation and empty exactMatches for non-exact match', () => {
      mockFindSimilarTags.mockReturnValue([dbTags[0]]);

      const inputTags: tagTableElement[] = [{ name: 'Vegan' }];
      const result = processTagsForValidation(inputTags, mockFindSimilarTags);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual(inputTags);
      expect(mockFindSimilarTags).toHaveBeenCalledWith('Vegan');
    });

    test('handles exact match case-insensitively', () => {
      mockFindSimilarTags.mockReturnValue([dbTags[0]]);

      const inputTags: tagTableElement[] = [{ name: 'VEGETARIAN' }];
      const result = processTagsForValidation(inputTags, mockFindSimilarTags);

      expect(result.exactMatches).toEqual([dbTags[0]]);
      expect(result.needsValidation).toEqual([]);
    });

    test('correctly filters mixed tags (exact and non-exact)', () => {
      mockFindSimilarTags
        .mockReturnValueOnce([dbTags[0]])
        .mockReturnValueOnce([dbTags[1]])
        .mockReturnValueOnce([]);

      const inputTags: tagTableElement[] = [
        { name: 'Vegetarian' },
        { name: 'Vegan' },
        { name: 'Gluten-Free' },
      ];

      const result = processTagsForValidation(inputTags, mockFindSimilarTags);

      expect(result.exactMatches).toEqual([dbTags[0]]);
      expect(result.needsValidation).toEqual([{ name: 'Vegan' }, { name: 'Gluten-Free' }]);
    });

    test('returns empty arrays for empty input', () => {
      const result = processTagsForValidation([], mockFindSimilarTags);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual([]);
      expect(mockFindSimilarTags).not.toHaveBeenCalled();
    });

    test('handles no similar tags found', () => {
      mockFindSimilarTags.mockReturnValue([]);

      const inputTags: tagTableElement[] = [{ name: 'NewTag' }];
      const result = processTagsForValidation(inputTags, mockFindSimilarTags);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual(inputTags);
    });
  });

  describe('processIngredientsForValidation', () => {
    const mockFindSimilarIngredients = jest.fn();

    const dbIngredients: ingredientTableElement[] = [
      {
        id: 1,
        name: 'Tomato Sauce',
        type: ingredientType.sauce,
        unit: 'ml',
        quantity: '200',
        season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      },
      {
        id: 2,
        name: 'Parmesan',
        type: ingredientType.cheese,
        unit: 'g',
        quantity: '50',
        season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns exact match in exactMatches with merged quantity/unit', () => {
      mockFindSimilarIngredients.mockReturnValue([dbIngredients[0]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'Tomato Sauce',
          quantity: '300',
          unit: 'ml',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([
        {
          ...dbIngredients[0],
          quantity: '300',
          unit: 'ml',
        },
      ]);
      expect(result.needsValidation).toEqual([]);
    });

    test('preserves OCR quantity and unit for exact match', () => {
      mockFindSimilarIngredients.mockReturnValue([dbIngredients[1]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'Parmesan',
          quantity: '100',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([
        {
          id: 2,
          name: 'Parmesan',
          type: ingredientType.cheese,
          unit: 'g',
          quantity: '100',
          season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        },
      ]);
      expect(result.needsValidation).toEqual([]);
    });

    test('uses database defaults when OCR quantity/unit are missing', () => {
      mockFindSimilarIngredients.mockReturnValue([dbIngredients[1]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'Parmesan',
          quantity: '',
          unit: '',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([
        {
          ...dbIngredients[1],
          quantity: '50',
          unit: 'g',
        },
      ]);
      expect(result.needsValidation).toEqual([]);
    });

    test('returns ingredient in needsValidation for non-exact match', () => {
      mockFindSimilarIngredients.mockReturnValue([dbIngredients[0]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'Tomato',
          quantity: '100',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual(inputIngredients);
    });

    test('handles exact match case-insensitively', () => {
      mockFindSimilarIngredients.mockReturnValue([dbIngredients[0]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'TOMATO SAUCE',
          quantity: '250',
          unit: 'ml',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([
        {
          ...dbIngredients[0],
          quantity: '250',
          unit: 'ml',
        },
      ]);
      expect(result.needsValidation).toEqual([]);
    });

    test('correctly filters mixed ingredients (exact and non-exact)', () => {
      mockFindSimilarIngredients
        .mockReturnValueOnce([dbIngredients[0]])
        .mockReturnValueOnce([dbIngredients[1]])
        .mockReturnValueOnce([]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'Tomato Sauce',
          quantity: '150',
          unit: 'ml',
          type: ingredientType.vegetable,
          season: [],
        },
        {
          name: 'Tomato',
          quantity: '100',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
        {
          name: 'DragonFruit',
          quantity: '200',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([
        {
          ...dbIngredients[0],
          quantity: '150',
          unit: 'ml',
        },
      ]);
      expect(result.needsValidation).toEqual([inputIngredients[1], inputIngredients[2]]);
    });

    test('returns empty arrays for empty input', () => {
      const result = processIngredientsForValidation([], mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual([]);
      expect(mockFindSimilarIngredients).not.toHaveBeenCalled();
    });

    test('handles no similar ingredients found', () => {
      mockFindSimilarIngredients.mockReturnValue([]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'NewIngredient',
          quantity: '100',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual(inputIngredients);
    });

    test('handles multiple exact matches in sequence', () => {
      mockFindSimilarIngredients
        .mockReturnValueOnce([dbIngredients[0]])
        .mockReturnValueOnce([dbIngredients[1]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: 'Tomato Sauce',
          quantity: '150',
          unit: 'ml',
          type: ingredientType.vegetable,
          season: [],
        },
        {
          name: 'Parmesan',
          quantity: '75',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([
        {
          ...dbIngredients[0],
          quantity: '150',
          unit: 'ml',
        },
        {
          ...dbIngredients[1],
          quantity: '75',
          unit: 'g',
        },
      ]);
      expect(result.needsValidation).toEqual([]);
    });

    test('skips ingredients with empty names', () => {
      mockFindSimilarIngredients.mockReturnValue([dbIngredients[0]]);

      const inputIngredients: ingredientTableElement[] = [
        {
          name: '',
          quantity: '100',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        },
      ];

      const result = processIngredientsForValidation(inputIngredients, mockFindSimilarIngredients);

      expect(result.exactMatches).toEqual([]);
      expect(result.needsValidation).toEqual([]);
      expect(mockFindSimilarIngredients).not.toHaveBeenCalled();
    });
  });

  describe('filterOutExistingTags', () => {
    test('filters out tags that exist in current list', () => {
      const newTags: tagTableElement[] = [{ name: 'Vegan' }, { name: 'Quick' }];
      const existingTags: tagTableElement[] = [{ id: 1, name: 'Quick' }];

      const result = filterOutExistingTags(newTags, existingTags);

      expect(result).toEqual([{ name: 'Vegan' }]);
    });

    test('returns all tags when none exist', () => {
      const newTags: tagTableElement[] = [{ name: 'Vegan' }, { name: 'Quick' }];
      const existingTags: tagTableElement[] = [];

      const result = filterOutExistingTags(newTags, existingTags);

      expect(result).toEqual(newTags);
    });

    test('returns empty array when all tags exist', () => {
      const newTags: tagTableElement[] = [{ name: 'Vegan' }];
      const existingTags: tagTableElement[] = [{ id: 1, name: 'Vegan' }];

      const result = filterOutExistingTags(newTags, existingTags);

      expect(result).toEqual([]);
    });

    test('handles case-insensitive comparison', () => {
      const newTags: tagTableElement[] = [{ name: 'VEGAN' }];
      const existingTags: tagTableElement[] = [{ id: 1, name: 'vegan' }];

      const result = filterOutExistingTags(newTags, existingTags);

      expect(result).toEqual([]);
    });
  });

  describe('removeIngredientByName', () => {
    const ingredients: ingredientTableElement[] = [
      { id: 1, name: 'Flour', quantity: '200', unit: 'g', type: ingredientType.cereal, season: [] },
      { id: 2, name: 'Sugar', quantity: '100', unit: 'g', type: ingredientType.sugar, season: [] },
    ];

    test('removes ingredient by exact name', () => {
      const result = removeIngredientByName(ingredients, 'Flour');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sugar');
    });

    test('removes ingredient case-insensitively', () => {
      const result = removeIngredientByName(ingredients, 'FLOUR');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sugar');
    });

    test('returns original array when name not found', () => {
      const result = removeIngredientByName(ingredients, 'Butter');

      expect(result).toEqual(ingredients);
    });

    test('returns original array when name is undefined', () => {
      const result = removeIngredientByName(ingredients, undefined);

      expect(result).toEqual(ingredients);
    });

    test('handles empty array', () => {
      const result = removeIngredientByName([], 'Flour');

      expect(result).toEqual([]);
    });
  });

  describe('removeTagByName', () => {
    const tags: tagTableElement[] = [
      { id: 1, name: 'Italian' },
      { id: 2, name: 'Quick' },
    ];

    test('removes tag by exact name', () => {
      const result = removeTagByName(tags, 'Italian');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Quick');
    });

    test('removes tag case-insensitively', () => {
      const result = removeTagByName(tags, 'ITALIAN');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Quick');
    });

    test('returns original array when name not found', () => {
      const result = removeTagByName(tags, 'Vegan');

      expect(result).toEqual(tags);
    });

    test('handles empty array', () => {
      const result = removeTagByName([], 'Italian');

      expect(result).toEqual([]);
    });
  });

  describe('replaceMatchingIngredients', () => {
    const currentIngredients: ingredientTableElement[] = [
      { id: 1, name: 'Flour', quantity: '200', unit: 'g', type: ingredientType.cereal, season: [] },
      { name: 'Sugar', quantity: '100', unit: 'g' } as ingredientTableElement,
    ];

    const dbIngredients: ingredientTableElement[] = [
      {
        id: 10,
        name: 'Sugar',
        quantity: '50',
        unit: 'g',
        type: ingredientType.sugar,
        season: ['1'],
      },
    ];

    test('replaces matching ingredient with database version', () => {
      const result = replaceMatchingIngredients(currentIngredients, dbIngredients);

      expect(result).toHaveLength(2);
      const sugar = result.find(i => i.name === 'Sugar');
      expect(sugar?.id).toBe(10);
      expect(sugar?.type).toBe(ingredientType.sugar);
    });

    test('preserves non-matching ingredients', () => {
      const result = replaceMatchingIngredients(currentIngredients, dbIngredients);

      const flour = result.find(i => i.name === 'Flour');
      expect(flour?.id).toBe(1);
    });

    test('handles case-insensitive matching', () => {
      const current = [{ name: 'SUGAR', quantity: '100', unit: 'g' } as ingredientTableElement];

      const result = replaceMatchingIngredients(current, dbIngredients);

      expect(result[0].id).toBe(10);
    });

    test('handles empty exactMatches array', () => {
      const result = replaceMatchingIngredients(currentIngredients, []);

      expect(result).toEqual(currentIngredients);
    });
  });

  describe('replaceMatchingTags', () => {
    const currentTags: tagTableElement[] = [
      { id: 1, name: 'Italian' },
      { name: 'Quick' } as tagTableElement,
    ];

    const dbTags: tagTableElement[] = [{ id: 10, name: 'Quick' }];

    test('replaces matching tag with database version', () => {
      const result = replaceMatchingTags(currentTags, dbTags);

      expect(result).toHaveLength(2);
      const quick = result.find(t => t.name === 'Quick');
      expect(quick?.id).toBe(10);
    });

    test('preserves non-matching tags', () => {
      const result = replaceMatchingTags(currentTags, dbTags);

      const italian = result.find(t => t.name === 'Italian');
      expect(italian?.id).toBe(1);
    });

    test('handles empty exactMatches array', () => {
      const result = replaceMatchingTags(currentTags, []);

      expect(result).toEqual(currentTags);
    });
  });

  describe('addOrMergeIngredientMatches', () => {
    const currentIngredients: ingredientTableElement[] = [
      { id: 1, name: 'Flour', quantity: '200', unit: 'g', type: ingredientType.cereal, season: [] },
    ];

    test('adds new ingredient when not existing', () => {
      const newIngredient: ingredientTableElement = {
        id: 2,
        name: 'Sugar',
        quantity: '100',
        unit: 'g',
        type: ingredientType.sugar,
        season: [],
      };

      const result = addOrMergeIngredientMatches(currentIngredients, [newIngredient]);

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Sugar');
    });

    test('merges quantity for same name and unit', () => {
      const existingFlour: ingredientTableElement = {
        id: 1,
        name: 'Flour',
        quantity: '100',
        unit: 'g',
        type: ingredientType.cereal,
        season: [],
      };

      const result = addOrMergeIngredientMatches(currentIngredients, [existingFlour]);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe('300');
    });

    test('replaces ingredient when same name but different unit', () => {
      const flourInKg: ingredientTableElement = {
        id: 1,
        name: 'Flour',
        quantity: '0.5',
        unit: 'kg',
        type: ingredientType.cereal,
        season: [],
      };

      const result = addOrMergeIngredientMatches(currentIngredients, [flourInKg]);

      expect(result).toHaveLength(1);
      expect(result[0].unit).toBe('kg');
      expect(result[0].quantity).toBe('0.5');
    });

    test('handles case-insensitive name matching', () => {
      const flourUppercase: ingredientTableElement = {
        id: 1,
        name: 'FLOUR',
        quantity: '100',
        unit: 'g',
        type: ingredientType.cereal,
        season: [],
      };

      const result = addOrMergeIngredientMatches(currentIngredients, [flourUppercase]);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe('300');
    });

    test('handles empty current array', () => {
      const newIngredient: ingredientTableElement = {
        id: 1,
        name: 'Sugar',
        quantity: '100',
        unit: 'g',
        type: ingredientType.sugar,
        season: [],
      };

      const result = addOrMergeIngredientMatches([], [newIngredient]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sugar');
    });

    test('does not merge ingredients with empty names', () => {
      const current = [{ name: '', quantity: '100', unit: 'g' } as ingredientTableElement];
      const newIng = [{ name: '', quantity: '50', unit: 'g' } as ingredientTableElement];

      const result = addOrMergeIngredientMatches(current, newIng);

      expect(result).toHaveLength(2);
    });
  });

  describe('addNonDuplicateTags', () => {
    const currentTags: tagTableElement[] = [{ id: 1, name: 'Italian' }];

    test('adds tag when not duplicate', () => {
      const newTags: tagTableElement[] = [{ name: 'Vegan' }];

      const result = addNonDuplicateTags(currentTags, newTags);

      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Vegan');
    });

    test('does not add duplicate tag', () => {
      const newTags: tagTableElement[] = [{ name: 'Italian' }];

      const result = addNonDuplicateTags(currentTags, newTags);

      expect(result).toHaveLength(1);
    });

    test('handles case-insensitive duplicate detection', () => {
      const newTags: tagTableElement[] = [{ name: 'ITALIAN' }];

      const result = addNonDuplicateTags(currentTags, newTags);

      expect(result).toHaveLength(1);
    });

    test('adds multiple non-duplicate tags', () => {
      const newTags: tagTableElement[] = [{ name: 'Vegan' }, { name: 'Quick' }];

      const result = addNonDuplicateTags(currentTags, newTags);

      expect(result).toHaveLength(3);
    });

    test('filters out duplicates from batch', () => {
      const newTags: tagTableElement[] = [
        { name: 'Vegan' },
        { name: 'Italian' },
        { name: 'Quick' },
      ];

      const result = addNonDuplicateTags(currentTags, newTags);

      expect(result).toHaveLength(3);
      expect(result.map(t => t.name)).toContain('Vegan');
      expect(result.map(t => t.name)).toContain('Quick');
    });

    test('handles empty current array', () => {
      const newTags: tagTableElement[] = [{ name: 'Vegan' }];

      const result = addNonDuplicateTags([], newTags);

      expect(result).toHaveLength(1);
    });
  });
});
