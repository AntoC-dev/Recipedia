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

const mockIngredients: ingredientTableElement[] = [
  {
    id: 1,
    name: 'Chicken',
    unit: 'g',
    quantity: '',
    type: ingredientType.meat,
    season: [],
  },
  {
    id: 2,
    name: 'Tomato',
    unit: 'piece',
    quantity: '',
    type: ingredientType.vegetable,
    season: ['1', '2', '3'],
  },
  {
    id: 3,
    name: 'Onion',
    unit: 'piece',
    quantity: '',
    type: ingredientType.vegetable,
    season: [],
  },
];

const mockTags: tagTableElement[] = [
  { id: 1, name: 'Italian' },
  { id: 2, name: 'Dinner' },
  { id: 3, name: 'Quick' },
];

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
    it('separates exact matches from unknowns', () => {
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

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      expect(state.exactMatchIngredients).toHaveLength(1);
      expect(state.ingredientsToValidate).toHaveLength(1);
      expect(state.exactMatchTags).toHaveLength(1);
      expect(state.tagsToValidate).toHaveLength(1);
    });

    it('populates ingredient mappings for exact matches', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'Chicken' }])];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      expect(state.ingredientMappings.size).toBe(1);
      expect(state.ingredientMappings.get('chicken')?.name).toBe('Chicken');
    });

    it('populates tag mappings for exact matches', () => {
      const recipes = [createMockRecipe('Test', [{ id: 1, name: 'Italian' }], [])];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      expect(state.tagMappings.size).toBe(1);
      expect(state.tagMappings.get('italian')?.name).toBe('Italian');
    });

    it('preserves quantity and unit from import in exact matches', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Chicken', quantity: '500', unit: 'kg' }]),
      ];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const mappedChicken = state.ingredientMappings.get('chicken');
      expect(mappedChicken?.quantity).toBe('500');
      expect(mappedChicken?.unit).toBe('kg');
    });

    it('is case-insensitive for matching', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'ITALIAN' }], [{ name: 'CHICKEN' }]),
      ];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      expect(state.ingredientMappings.has('chicken')).toBe(true);
      expect(state.tagMappings.has('italian')).toBe(true);
    });

    it('matches ingredients with parenthetical content to existing ingredients', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Tomato (diced)' }, { name: 'Onion (chopped)' }]),
      ];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      expect(state.exactMatchIngredients).toHaveLength(2);
      expect(state.ingredientsToValidate).toHaveLength(0);
      expect(state.ingredientMappings.get('tomato (diced)')?.name).toBe('Tomato');
      expect(state.ingredientMappings.get('onion (chopped)')?.name).toBe('Onion');
    });

    it('auto-maps ingredient with descriptor to existing base ingredient', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'Chicken (boneless, skinless)' }])];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      expect(state.ingredientMappings.has('chicken (boneless, skinless)')).toBe(true);
      expect(state.ingredientMappings.get('chicken (boneless, skinless)')?.name).toBe('Chicken');
      expect(state.ingredientsToValidate).toHaveLength(0);
    });

    it('preserves quantity and unit for ingredient with parenthetical content', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Tomato (roma)', quantity: '2', unit: 'piece' }]),
      ];

      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const mappedTomato = state.ingredientMappings.get('tomato (roma)');
      expect(mappedTomato?.quantity).toBe('2');
      expect(mappedTomato?.unit).toBe('piece');
    });

    it('handles tag matching with accents', () => {
      const tagsWithAccents: tagTableElement[] = [
        { id: 1, name: 'Végétarien' },
        { id: 2, name: 'Été' },
      ];
      const recipes = [
        createMockRecipe(
          'Test',
          [
            { id: 1, name: 'Végétarien' },
            { id: 2, name: 'Été' },
          ],
          []
        ),
      ];

      const state = initializeBatchValidation(recipes, [], tagsWithAccents);

      expect(state.exactMatchTags).toHaveLength(2);
      expect(state.tagsToValidate).toHaveLength(0);
    });

    describe('similarItems attachment', () => {
      it('attaches empty similarItems to tags without matches', () => {
        const recipes = [createMockRecipe('Test', [{ id: 1, name: 'BrandNewTag' }], [])];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(1);
        expect(state.tagsToValidate[0].similarItems).toEqual([]);
      });

      it('attaches empty similarItems to ingredients without matches', () => {
        const recipes = [createMockRecipe('Test', [], [{ name: 'BrandNewIngredient' }])];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.ingredientsToValidate).toHaveLength(1);
        expect(state.ingredientsToValidate[0].similarItems).toEqual([]);
      });

      it('attaches similar tags to tags with fuzzy matches', () => {
        const recipes = [createMockRecipe('Test', [{ id: 1, name: 'Ital' }], [])];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(1);
        expect(state.tagsToValidate[0].name).toBe('Ital');
        expect(state.tagsToValidate[0].similarItems.length).toBeGreaterThan(0);
        expect(state.tagsToValidate[0].similarItems[0].name).toBe('Italian');
      });

      it('attaches similar ingredients to ingredients with fuzzy matches', () => {
        const recipes = [createMockRecipe('Test', [], [{ name: 'Chick' }])];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.ingredientsToValidate).toHaveLength(1);
        expect(state.ingredientsToValidate[0].name).toBe('Chick');
        expect(state.ingredientsToValidate[0].similarItems.length).toBeGreaterThan(0);
        expect(state.ingredientsToValidate[0].similarItems[0].name).toBe('Chicken');
      });

      it('preserves original ingredient properties alongside similarItems', () => {
        const recipes = [
          createMockRecipe('Test', [], [{ name: 'NewIng', quantity: '250', unit: 'ml' }]),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.ingredientsToValidate).toHaveLength(1);
        expect(state.ingredientsToValidate[0].name).toBe('NewIng');
        expect(state.ingredientsToValidate[0].quantity).toBe('250');
        expect(state.ingredientsToValidate[0].unit).toBe('ml');
        expect(state.ingredientsToValidate[0]).toHaveProperty('similarItems');
      });

      it('preserves original tag properties alongside similarItems', () => {
        const recipes = [createMockRecipe('Test', [{ id: 99, name: 'NewTag' }], [])];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(1);
        expect(state.tagsToValidate[0].id).toBe(99);
        expect(state.tagsToValidate[0].name).toBe('NewTag');
        expect(state.tagsToValidate[0]).toHaveProperty('similarItems');
      });
    });

    describe('sorting behavior', () => {
      it('sorts tags without similar matches before tags with similar matches', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [
              { id: 1, name: 'Ital' },
              { id: 2, name: 'CompletelyUnknownTag' },
              { id: 3, name: 'Quic' },
            ],
            []
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(3);
        expect(state.tagsToValidate[0].name).toBe('CompletelyUnknownTag');
        expect(state.tagsToValidate[0].similarItems).toEqual([]);
      });

      it('sorts ingredients without similar matches before ingredients with similar matches', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [],
            [{ name: 'Chick' }, { name: 'CompletelyUnknownIngredient' }, { name: 'Toma' }]
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.ingredientsToValidate).toHaveLength(3);
        expect(state.ingredientsToValidate[0].name).toBe('CompletelyUnknownIngredient');
        expect(state.ingredientsToValidate[0].similarItems).toEqual([]);
      });

      it('maintains relative order within same group (tags without matches)', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [
              { id: 1, name: 'AlphaNewTag' },
              { id: 2, name: 'BetaNewTag' },
              { id: 3, name: 'GammaNewTag' },
            ],
            []
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(3);
        expect(state.tagsToValidate[0].name).toBe('AlphaNewTag');
        expect(state.tagsToValidate[1].name).toBe('BetaNewTag');
        expect(state.tagsToValidate[2].name).toBe('GammaNewTag');
      });

      it('maintains relative order within same group (ingredients without matches)', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [],
            [{ name: 'AlphaNewIng' }, { name: 'BetaNewIng' }, { name: 'GammaNewIng' }]
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.ingredientsToValidate).toHaveLength(3);
        expect(state.ingredientsToValidate[0].name).toBe('AlphaNewIng');
        expect(state.ingredientsToValidate[1].name).toBe('BetaNewIng');
        expect(state.ingredientsToValidate[2].name).toBe('GammaNewIng');
      });

      it('handles mixed exact matches and validation items with correct sorting', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [
              { id: 1, name: 'Italian' },
              { id: 2, name: 'Ital' },
              { id: 3, name: 'BrandNewTag' },
            ],
            [{ name: 'Chicken' }, { name: 'Chick' }, { name: 'BrandNewIng' }]
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.exactMatchTags).toHaveLength(1);
        expect(state.exactMatchTags[0].name).toBe('Italian');

        expect(state.tagsToValidate).toHaveLength(2);
        expect(state.tagsToValidate[0].name).toBe('BrandNewTag');
        expect(state.tagsToValidate[0].similarItems).toEqual([]);
        expect(state.tagsToValidate[1].name).toBe('Ital');
        expect(state.tagsToValidate[1].similarItems.length).toBeGreaterThan(0);

        expect(state.exactMatchIngredients).toHaveLength(1);
        expect(state.exactMatchIngredients[0].name).toBe('Chicken');

        expect(state.ingredientsToValidate).toHaveLength(2);
        expect(state.ingredientsToValidate[0].name).toBe('BrandNewIng');
        expect(state.ingredientsToValidate[0].similarItems).toEqual([]);
        expect(state.ingredientsToValidate[1].name).toBe('Chick');
        expect(state.ingredientsToValidate[1].similarItems.length).toBeGreaterThan(0);
      });

      it('handles all items having similar matches', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [
              { id: 1, name: 'Ital' },
              { id: 2, name: 'Dinn' },
            ],
            []
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(2);
        expect(state.tagsToValidate.every(t => t.similarItems.length > 0)).toBe(true);
      });

      it('handles all items having no similar matches', () => {
        const recipes = [
          createMockRecipe(
            'Test',
            [
              { id: 1, name: 'XyzTag1' },
              { id: 2, name: 'XyzTag2' },
            ],
            []
          ),
        ];

        const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

        expect(state.tagsToValidate).toHaveLength(2);
        expect(state.tagsToValidate.every(t => t.similarItems.length === 0)).toBe(true);
      });
    });
  });

  describe('addIngredientMapping', () => {
    it('adds mapping to state', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'NewIngredient' }])];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

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
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

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
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedTag: tagTableElement = { id: 100, name: 'Validated Tag' };

      addTagMapping(state, 'NewTag', validatedTag);

      expect(state.tagMappings.get('newtag')?.name).toBe('Validated Tag');
    });

    it('normalizes key to lowercase', () => {
      const recipes = [createMockRecipe('Test', [{ id: 1, name: 'NEW TAG' }], [])];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

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
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

      expect(validatedRecipes).toHaveLength(1);
      expect(validatedRecipes[0].ingredients[0].name).toBe('Chicken');
      expect(validatedRecipes[0].tags[0].name).toBe('Italian');
    });

    it('preserves quantity and unit from original import', () => {
      const recipes = [
        createMockRecipe('Test', [], [{ name: 'Chicken', quantity: '500', unit: 'kg' }]),
      ];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

      expect(validatedRecipes[0].ingredients[0].quantity).toBe('500');
      expect(validatedRecipes[0].ingredients[0].unit).toBe('kg');
    });

    it('uses mapped ingredient properties for unmapped fields', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'Chicken', quantity: '', unit: '' }])];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

      expect(validatedRecipes[0].ingredients[0].type).toBe(ingredientType.meat);
    });

    it('skips unmapped ingredients', () => {
      const recipes = [createMockRecipe('Test', [], [{ name: 'UnknownIngredient' }])];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

      expect(validatedRecipes[0].ingredients).toHaveLength(0);
    });

    it('skips unmapped tags', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'UnknownTag' }], [{ name: 'Chicken' }]),
      ];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

      expect(validatedRecipes[0].tags).toHaveLength(0);
    });

    it('preserves recipe metadata', () => {
      const recipes = [
        createMockRecipe('Test Recipe', [{ id: 1, name: 'Italian' }], [{ name: 'Chicken' }]),
      ];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

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
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const validatedRecipes = applyMappingsToRecipes(recipes, state);

      expect(validatedRecipes).toHaveLength(2);
      expect(validatedRecipes[0].title).toBe('Recipe 1');
      expect(validatedRecipes[1].title).toBe('Recipe 2');
    });
  });

  describe('getValidationProgress', () => {
    it('returns accurate counts for fully matched recipes', () => {
      const recipes = [
        createMockRecipe(
          'Test',
          [{ id: 1, name: 'Italian' }],
          [{ name: 'Chicken' }, { name: 'Tomato' }]
        ),
      ];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const progress = getValidationProgress(state);

      expect(progress.totalIngredients).toBe(2);
      expect(progress.validatedIngredients).toBe(2);
      expect(progress.remainingIngredients).toBe(0);
      expect(progress.totalTags).toBe(1);
      expect(progress.validatedTags).toBe(1);
      expect(progress.remainingTags).toBe(0);
    });

    it('returns accurate counts with unmatched items', () => {
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
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

      const progress = getValidationProgress(state);

      expect(progress.totalIngredients).toBe(2);
      expect(progress.validatedIngredients).toBe(1);
      expect(progress.remainingIngredients).toBe(1);
      expect(progress.totalTags).toBe(2);
      expect(progress.validatedTags).toBe(1);
      expect(progress.remainingTags).toBe(1);
    });

    it('updates after adding mappings', () => {
      const recipes = [
        createMockRecipe('Test', [{ id: 1, name: 'NewTag' }], [{ name: 'NewIngredient' }]),
      ];
      const state = initializeBatchValidation(recipes, mockIngredients, mockTags);

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
  });
});
