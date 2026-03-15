import {
  addIngredientMapping,
  addTagMapping,
  applyMappingsToRecipes,
  collectUniqueItems,
  getValidationProgress,
  initializeBatchValidation,
} from '@utils/BatchValidation';
import {
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { ConvertedImportRecipe } from '@customTypes/BulkImportTypes';

const createMockRecipe = (
  title: string,
  tags: { id: number; name: string }[],
  ingredients: { name: string; quantity?: string; unit?: string }[]
): ConvertedImportRecipe => ({
  title,
  description: `${title} description`,
  imageUrl: 'https://example.com/image.jpg',
  persons: 4,
  time: 30,
  tags: tags,
  ingredients: ingredients.map((ing, index) => ({
    id: index,
    name: ing.name,
    unit: ing.unit ?? 'g',
    quantity: ing.quantity ?? '100',
    type: ingredientType.vegetable,
    season: [],
  })),
  preparation: [{ title: 'Step 1', description: 'Do something' }],
  sourceUrl: `https://example.com/${title.toLowerCase().replace(' ', '-')}`,
  sourceProvider: 'mock',
});

describe('BatchValidation', () => {
  describe('collectUniqueItems', () => {
    it('collects unique ingredients from single recipe', () => {
      const recipes = [
        createMockRecipe(
          'Test',
          [{ id: 1, name: 'Italian' }],
          [{ name: 'Chicken' }, { name: 'Tomato' }]
        ),
      ];

      const { uniqueIngredients } = collectUniqueItems(recipes);

      expect(uniqueIngredients.size).toBe(2);
      expect(uniqueIngredients.has('chicken')).toBe(true);
      expect(uniqueIngredients.has('tomato')).toBe(true);
    });

    it('collects unique tags from single recipe', () => {
      const recipes = [
        createMockRecipe(
          'Test',
          [
            { id: 1, name: 'Italian' },
            { id: 2, name: 'Quick' },
          ],
          [{ name: 'Chicken' }]
        ),
      ];

      const { uniqueTags } = collectUniqueItems(recipes);

      expect(uniqueTags.size).toBe(2);
      expect(uniqueTags.has('italian')).toBe(true);
      expect(uniqueTags.has('quick')).toBe(true);
    });

    it('deduplicates ingredients across recipes', () => {
      const recipes = [
        createMockRecipe('Recipe 1', [], [{ name: 'Chicken' }]),
        createMockRecipe('Recipe 2', [], [{ name: 'Chicken' }, { name: 'Tomato' }]),
      ];

      const { uniqueIngredients } = collectUniqueItems(recipes);

      expect(uniqueIngredients.size).toBe(2);
    });

    it('deduplicates tags across recipes', () => {
      const recipes = [
        createMockRecipe('Recipe 1', [{ id: 1, name: 'Italian' }], []),
        createMockRecipe(
          'Recipe 2',
          [
            { id: 1, name: 'Italian' },
            { id: 2, name: 'Quick' },
          ],
          []
        ),
      ];

      const { uniqueTags } = collectUniqueItems(recipes);

      expect(uniqueTags.size).toBe(2);
    });

    it('normalizes keys to lowercase', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'ITALIAN' }], [{ name: 'CHICKEN' }]),
      ];

      const { uniqueIngredients, uniqueTags } = collectUniqueItems(recipes);

      expect(uniqueIngredients.has('chicken')).toBe(true);
      expect(uniqueTags.has('italian')).toBe(true);
    });

    it('normalizes keys by trimming whitespace', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: '  Italian  ' }], [{ name: '  Chicken  ' }]),
      ];

      const { uniqueIngredients, uniqueTags } = collectUniqueItems(recipes);

      expect(uniqueIngredients.has('italian')).toBeFalsy();
      expect(uniqueIngredients.has('chicken')).toBe(true);
      expect(uniqueTags.has('italian')).toBe(true);
    });

    it('skips ingredients without names', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: '' }, { name: 'Chicken' }])];

      const { uniqueIngredients } = collectUniqueItems(recipes);

      expect(uniqueIngredients.size).toBe(1);
    });

    it('collapses multiple whitespace in names', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Chicken   Breast' }, { name: 'Chicken Breast' }]),
      ];

      const { uniqueIngredients } = collectUniqueItems(recipes);

      expect(uniqueIngredients.size).toBe(1);
    });
  });

  describe('initializeBatchValidation', () => {
    it('passes all unique items to validation queue (no pre-computation)', () => {
      const recipes = [
        createMockRecipe(
          'Test',
          [
            { id: 1, name: 'Italian' },
            { id: 2, name: 'NewTag' },
          ],
          [{ name: 'Chicken' }, { name: 'NewIngredient' }]
        ),
      ];

      const state = initializeBatchValidation(recipes);

      expect(state.ingredientsToValidate).toHaveLength(2);
      expect(state.tagsToValidate).toHaveLength(2);
      expect(state.ingredientMappings.size).toBe(0);
      expect(state.tagMappings.size).toBe(0);
    });

    it('deduplicates items across recipes', () => {
      const recipes = [
        createMockRecipe('Recipe 1', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
        createMockRecipe(
          'Recipe 2',
          [
            { id: 1, name: 'Italian' },
            { id: 2, name: 'NewTag' },
          ],
          [{ name: 'Chicken' }, { name: 'NewIngredient' }]
        ),
      ];

      const state = initializeBatchValidation(recipes);

      expect(state.ingredientsToValidate).toHaveLength(2);
      expect(state.tagsToValidate).toHaveLength(2);
    });

    it('filters out ingredients without names', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: '' }, { name: 'Chicken' }])];

      const state = initializeBatchValidation(recipes);

      expect(state.ingredientsToValidate).toHaveLength(1);
      expect(state.ingredientsToValidate[0].name).toBe('Chicken');
    });

    it('preserves ingredient original data in validation items', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Chicken', quantity: '500', unit: 'kg' }]),
      ];

      const state = initializeBatchValidation(recipes);

      const chickenItem = state.ingredientsToValidate.find(i => i.name === 'Chicken');
      expect(chickenItem?.quantity).toBe('500');
      expect(chickenItem?.unit).toBe('kg');
    });

    it('preserves tag data in validation items', () => {
      const recipes = [createMockRecipe('Test', [{ id: 99, name: 'MyTag' }], [])];

      const state = initializeBatchValidation(recipes);

      expect(state.tagsToValidate).toHaveLength(1);
      expect(state.tagsToValidate[0].name).toBe('MyTag');
    });

    it('starts with empty mappings (similarity handled by ValidationQueue)', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
      ];

      const state = initializeBatchValidation(recipes);

      expect(state.ingredientMappings.size).toBe(0);
      expect(state.tagMappings.size).toBe(0);
    });

    it('initializes uniqueIngredients and uniqueTags maps', () => {
      const recipes = [
        createMockRecipe(
          'Test',
          [{ id: 1, name: 'Italian' }],
          [{ name: 'Chicken' }, { name: 'Tomato' }]
        ),
      ];

      const state = initializeBatchValidation(recipes);

      expect(state.uniqueIngredients.size).toBe(2);
      expect(state.uniqueTags.size).toBe(1);
    });
  });

  describe('addIngredientMapping', () => {
    it('adds mapping to state', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'NewIngredient' }])];
      const state = initializeBatchValidation(recipes);

      const validatedIngredient: ingredientTableElement = {
        id: 100,
        name: 'Validated Ingredient',
        unit: 'g',
        quantity: '',
        type: ingredientType.vegetable,
        season: [],
      };

      addIngredientMapping(state, 'NewIngredient', validatedIngredient);

      expect(state.ingredientMappings.get('newingredient')?.name).toBe('Validated Ingredient');
    });

    it('normalizes key to lowercase', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'NEW INGREDIENT' }])];
      const state = initializeBatchValidation(recipes);

      const validatedIngredient: ingredientTableElement = {
        id: 100,
        name: 'Validated',
        unit: 'g',
        quantity: '',
        type: ingredientType.vegetable,
        season: [],
      };

      addIngredientMapping(state, 'NEW INGREDIENT', validatedIngredient);

      expect(state.ingredientMappings.has('new ingredient')).toBe(true);
    });
  });

  describe('addTagMapping', () => {
    it('adds mapping to state', () => {
      const recipes = [createMockRecipe('Test', [{ id: 1, name: 'NewTag' }], [])];
      const state = initializeBatchValidation(recipes);

      const validatedTag: tagTableElement = { id: 100, name: 'Validated Tag' };

      addTagMapping(state, 'NewTag', validatedTag);

      expect(state.tagMappings.get('newtag')?.name).toBe('Validated Tag');
    });

    it('normalizes key to lowercase', () => {
      const recipes = [createMockRecipe('Test', [{ id: 1, name: 'NEW TAG' }], [])];
      const state = initializeBatchValidation(recipes);

      const validatedTag: tagTableElement = { id: 100, name: 'Validated' };

      addTagMapping(state, 'NEW TAG', validatedTag);

      expect(state.tagMappings.has('new tag')).toBe(true);
    });
  });

  describe('applyMappingsToRecipes', () => {
    it('applies all mappings correctly', () => {
      const recipes = [
        createMockRecipe('Test Recipe', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
      ];
      const state = initializeBatchValidation(recipes);

      addTagMapping(state, 'Italian', { id: 1, name: 'Italian' });
      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes).toHaveLength(1);
      expect(validatedRecipes[0].ingredients[0].name).toBe('Chicken');
      expect(validatedRecipes[0].tags[0].name).toBe('Italian');
    });

    it('preserves quantity and unit from original import', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Chicken', quantity: '500', unit: 'kg' }]),
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('500');
      expect(validatedRecipes[0].ingredients[0].unit).toBe('kg');
    });

    it('uses mapped ingredient properties for unmapped fields', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'Chicken', quantity: '', unit: '' }])];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].type).toBe(ingredientType.meat);
    });

    it('skips unmapped ingredients', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'UnknownIngredient' }])];
      const state = initializeBatchValidation(recipes);

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients).toHaveLength(0);
    });

    it('skips unmapped tags', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'UnknownTag' }], [{ name: 'Chicken' }]),
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].tags).toHaveLength(0);
    });

    it('preserves recipe metadata', () => {
      const recipes = [
        createMockRecipe('Test Recipe', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
      ];
      const state = initializeBatchValidation(recipes);

      addTagMapping(state, 'Italian', { id: 1, name: 'Italian' });
      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].title).toBe('Test Recipe');
      expect(validatedRecipes[0].description).toBe('Test Recipe description');
      expect(validatedRecipes[0].persons).toBe(4);
      expect(validatedRecipes[0].time).toBe(30);
    });

    it('handles multiple recipes', () => {
      const recipes = [
        createMockRecipe('Recipe 1', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
        createMockRecipe('Recipe 2', [{ id: 2, name: 'Quick' }], [{ name: 'Tomato' }]),
      ];
      const state = initializeBatchValidation(recipes);

      addTagMapping(state, 'Italian', { id: 1, name: 'Italian' });
      addTagMapping(state, 'Quick', { id: 3, name: 'Quick' });
      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });
      addIngredientMapping(state, 'Tomato', {
        id: 2,
        name: 'Tomato',
        unit: 'piece',
        quantity: '',
        type: ingredientType.vegetable,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes).toHaveLength(2);
      expect(validatedRecipes[0].title).toBe('Recipe 1');
      expect(validatedRecipes[1].title).toBe('Recipe 2');
    });

    it('uses defaultPersons instead of recipe persons', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
          persons: 2,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addTagMapping(state, 'Italian', { id: 1, name: 'Italian' });
      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].persons).toBe(4);
    });

    it('scales ingredient quantities when recipe.persons differs from defaultPersons (ratio > 1)', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
          persons: 2,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('200');
    });

    it('scales ingredient quantities when recipe.persons differs from defaultPersons (ratio < 1)', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
          persons: 4,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 2);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('50');
    });

    it('does not scale when recipe.persons equals defaultPersons', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
          persons: 4,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('100');
    });

    it('does not scale when recipe.persons is 0', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
          persons: 0,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('100');
    });

    it('preserves null/empty quantity when scaling', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '', unit: 'g' }]),
          persons: 2,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('');
    });

    it('scales across multiple ingredients in same recipe', () => {
      const recipes = [
        {
          ...createMockRecipe(
            'Test Recipe',
            [],
            [
              { name: 'Chicken', quantity: '100', unit: 'g' },
              { name: 'Tomato', quantity: '200', unit: 'g' },
            ]
          ),
          persons: 2,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });
      addIngredientMapping(state, 'Tomato', {
        id: 2,
        name: 'Tomato',
        unit: 'g',
        quantity: '',
        type: ingredientType.vegetable,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('200');
      expect(validatedRecipes[0].ingredients[1].quantity).toBe('400');
    });

    it('scales quantities independently per recipe when multiple recipes have different person counts', () => {
      const recipe1 = {
        ...createMockRecipe('Recipe 1', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
        persons: 2,
      };
      const recipe2 = {
        ...createMockRecipe('Recipe 2', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
        persons: 4,
      };
      const state = initializeBatchValidation([recipe1, recipe2]);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes([recipe1, recipe2], state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('200');
      expect(validatedRecipes[1].ingredients[0].quantity).toBe('100');
    });

    it('scales with a non-integer ratio (factor 1.5)', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
          persons: 2,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 3);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('150');
    });

    it('falls back to mappedIngredient.quantity when ing.quantity is empty, and scales that fallback', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '', unit: 'g' }]),
          persons: 2,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '80',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('160');
    });

    it('preserves quantity as-is when recipe.persons is 0', () => {
      const recipes = [
        {
          ...createMockRecipe('Test Recipe', [], [{ name: 'Chicken', quantity: '100', unit: 'g' }]),
          persons: 0,
        },
      ];
      const state = initializeBatchValidation(recipes);

      addIngredientMapping(state, 'Chicken', {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        quantity: '100',
        type: ingredientType.meat,
        season: [],
      });

      const validatedRecipes = applyMappingsToRecipes(recipes, state, 4);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('100');
    });
  });

  describe('getValidationProgress', () => {
    it('returns zero validated counts before any mappings added', () => {
      const recipes = [
        createMockRecipe(
          'Test',
          [{ id: 1, name: 'Italian' }],
          [{ name: 'Chicken' }, { name: 'Tomato' }]
        ),
      ];
      const state = initializeBatchValidation(recipes);

      const progress = getValidationProgress(state);

      expect(progress.totalIngredients).toBe(2);
      expect(progress.validatedIngredients).toBe(0);
      expect(progress.remainingIngredients).toBe(2);
      expect(progress.totalTags).toBe(1);
      expect(progress.validatedTags).toBe(0);
      expect(progress.remainingTags).toBe(1);
    });

    it('updates after adding mappings', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'NewTag' }], [{ name: 'NewIngredient' }]),
      ];
      const state = initializeBatchValidation(recipes);

      let progress = getValidationProgress(state);
      expect(progress.remainingIngredients).toBe(1);
      expect(progress.remainingTags).toBe(1);

      addIngredientMapping(state, 'NewIngredient', {
        id: 100,
        name: 'Validated',
        unit: 'g',
        quantity: '',
        type: ingredientType.vegetable,
        season: [],
      });
      addTagMapping(state, 'NewTag', { id: 100, name: 'Validated Tag' });

      progress = getValidationProgress(state);
      expect(progress.validatedIngredients).toBe(1);
      expect(progress.validatedTags).toBe(1);
    });

    it('reflects total unique items across all recipes', () => {
      const recipes = [
        createMockRecipe('Recipe 1', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
        createMockRecipe('Recipe 2', [{ id: 1, name: 'Italian' }], [{ name: 'Tomato' }]),
      ];
      const state = initializeBatchValidation(recipes);

      const progress = getValidationProgress(state);

      expect(progress.totalIngredients).toBe(2);
      expect(progress.totalTags).toBe(1);
    });
  });
});
