import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useValidationWorkflow } from '@hooks/useValidationWorkflow';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';
import { ConvertedImportRecipe } from '@customTypes/BulkImportTypes';

const createMockRecipe = (
  title: string,
  tags: string[],
  ingredients: string[]
): ConvertedImportRecipe => ({
  title,
  description: `${title} description`,
  imageUrl: 'https://example.com/image.jpg',
  persons: 4,
  time: 30,
  tags: tags.map((name, id) => ({ id, name })),
  ingredients: ingredients.map((name, index) => ({
    id: index,
    name,
    unit: 'g',
    quantity: '100',
    type: ingredientType.vegetable,
    season: [],
  })),
  preparation: [{ title: 'Step 1', description: 'Do something' }],
  sourceUrl: `https://example.com/${title.toLowerCase().replace(' ', '-')}`,
  sourceProvider: 'mock',
});

const mockAddMultipleRecipes = jest.fn();
const mockFindSimilarTags = jest.fn().mockReturnValue([]);
const mockFindSimilarIngredients = jest.fn().mockReturnValue([]);

describe('useValidationWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddMultipleRecipes.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    test('transitions to reviewing phase when unknown tags exist', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(
        () => {
          expect(result.current.phase).toBe('reviewing');
        },
        { timeout: 3000 }
      );
    });

    test('transitions to reviewing phase when unknown ingredients exist', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });
    });

    test('transitions to reviewing when both tags and ingredients need validation', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(1);
      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(1);
    });
  });

  describe('tag validation', () => {
    test('provides validation state with tags to validate', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag', 'AnotherTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(2);
    });

    test('onTagValidated adds mapping', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onTagValidated(
          { id: 1, name: 'NewTag' },
          { id: 10, name: 'Validated Tag' }
        );
      });

      expect(result.current.validationState?.tagMappings.size).toBe(1);
    });
  });

  describe('ingredient validation', () => {
    test('provides validation state with ingredients to validate', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient', 'AnotherIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(2);
    });

    test('onIngredientValidated adds mapping', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated Ingredient',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      expect(result.current.validationState?.ingredientMappings.size).toBeGreaterThan(0);
    });
  });

  describe('startImport', () => {
    test('transitions to importing and then complete on success', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => expect(result.current.phase).toBe('reviewing'));

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.importedCount).toBe(1);
    });

    test('calls addMultipleRecipes with validated recipes', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => expect(result.current.phase).toBe('reviewing'));

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(mockAddMultipleRecipes).toHaveBeenCalled();
      });
    });

    test('transitions to error phase on failure', async () => {
      mockAddMultipleRecipes.mockRejectedValue(new Error('Database error'));

      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => expect(result.current.phase).toBe('reviewing'));

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('error');
      });

      expect(result.current.errorMessage).toBe('Database error');
    });

    test('skips recipes without ingredients', async () => {
      const recipes = [
        createMockRecipe('Recipe With Ingredient', [], ['NewIngredient']),
        createMockRecipe('Recipe Without Match', [], ['AnotherIngredient']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.importedCount).toBe(1);
    });

    test('saves recipes with defaultPersons instead of recipe persons', async () => {
      const recipesWithWrongPersons = [
        { ...createMockRecipe('Test Recipe', [], ['NewIngredient']), persons: 2 },
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipesWithWrongPersons,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => expect(result.current.phase).toBe('reviewing'));

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(mockAddMultipleRecipes).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ persons: 4 })])
        );
      });
    });

    test('awaits async onImportComplete callback before completing', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      let resolveCallback: () => void;
      const callbackPromise = new Promise<void>(resolve => {
        resolveCallback = resolve;
      });

      const mockOnImportComplete = jest.fn().mockReturnValue(callbackPromise);

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients,
          mockOnImportComplete
        )
      );

      await waitFor(() => expect(result.current.phase).toBe('reviewing'));

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(mockAddMultipleRecipes).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('importing');
      });

      expect(mockOnImportComplete).toHaveBeenCalledWith([recipes[0].sourceUrl]);

      await act(async () => {
        resolveCallback!();
        await callbackPromise;
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });
    });

    test('calls onImportComplete with all imported source URLs', async () => {
      const recipes = [
        createMockRecipe('Recipe 1', [], ['Ingredient1']),
        createMockRecipe('Recipe 2', [], ['Ingredient2']),
      ];

      const mockOnImportComplete = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients,
          mockOnImportComplete
        )
      );

      await waitFor(() => expect(result.current.phase).toBe('reviewing'));

      act(() => {
        result.current.handlers.onIngredientValidated('Ingredient1', {
          id: 10,
          name: 'Validated1',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
        result.current.handlers.onIngredientValidated('Ingredient2', {
          id: 11,
          name: 'Validated2',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(mockOnImportComplete).toHaveBeenCalledWith([
        recipes[0].sourceUrl,
        recipes[1].sourceUrl,
      ]);
    });
  });

  describe('progress tracking', () => {
    test('provides progress during reviewing phase', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag', 'AnotherTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.progress).not.toBeNull();
      expect(result.current.progress?.totalTags).toBe(2);
    });
  });

  describe('exact match processing during initialization', () => {
    test('tags with exact database matches bypass validation queue', async () => {
      const knownTag = { id: 1, name: 'Italian' };
      const localFindSimilarTags = jest.fn().mockReturnValue([knownTag]);

      const recipes = [createMockRecipe('Test Recipe', ['Italian'], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          localFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(0);
      expect(result.current.validationState?.tagMappings.get('italian')).toEqual(knownTag);
    });

    test('ingredients with exact database matches bypass validation queue', async () => {
      const knownIngredient: ingredientTableElement = {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        type: ingredientType.meat,
        season: [],
      };
      const localFindSimilarIngredients = jest.fn().mockReturnValue([knownIngredient]);

      const recipes = [createMockRecipe('Test Recipe', [], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          localFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(['importing', 'complete']).toContain(result.current.phase);
      });

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(0);
      expect(result.current.validationState?.ingredientMappings.size).toBeGreaterThan(0);
    });
  });

  describe('early return when database not ready', () => {
    test('stays in initializing phase when isDatabaseReady is false', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          false,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(result.current.phase).toBe('initializing');
      expect(mockFindSimilarTags).not.toHaveBeenCalled();
      expect(mockFindSimilarIngredients).not.toHaveBeenCalled();
    });
  });

  describe('startImport null state guard', () => {
    test('startImport does nothing when called before state is initialized', () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          false,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      act(() => {
        result.current.handlers.startImport();
      });

      expect(result.current.phase).toBe('initializing');
      expect(mockAddMultipleRecipes).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('handles empty recipes array with error', async () => {
      const { result } = renderHook(() =>
        useValidationWorkflow(
          [],
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('error');
      });

      expect(result.current.errorMessage).toBeTruthy();
    });

    test('handles recipes with all known items', async () => {
      const recipes = [
        createMockRecipe('Recipe 1', ['Italian', 'Dinner'], ['Chicken', 'Tomato']),
        createMockRecipe('Recipe 2', ['Quick'], ['Onion']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onTagValidated(
          { id: 0, name: 'Italian' },
          { id: 1, name: 'Italian' }
        );
        result.current.handlers.onTagValidated(
          { id: 1, name: 'Dinner' },
          { id: 2, name: 'Dinner' }
        );
        result.current.handlers.onTagValidated({ id: 2, name: 'Quick' }, { id: 3, name: 'Quick' });
      });

      act(() => {
        result.current.handlers.onIngredientValidated('Chicken', {
          id: 1,
          name: 'Chicken',
          unit: 'g',
          type: ingredientType.meat,
          season: [],
        });
        result.current.handlers.onIngredientValidated('Tomato', {
          id: 2,
          name: 'Tomato',
          unit: 'piece',
          type: ingredientType.vegetable,
          season: [],
        });
        result.current.handlers.onIngredientValidated('Onion', {
          id: 3,
          name: 'Onion',
          unit: 'piece',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.importedCount).toBe(2);
    });

    test('handles recipes with only unknown tags', async () => {
      const recipes = [createMockRecipe('Recipe', ['UnknownTag1', 'UnknownTag2'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(2);
    });

    test('handles recipes with only unknown ingredients', async () => {
      const recipes = [
        createMockRecipe('Recipe', [], ['UnknownIngredient1', 'UnknownIngredient2']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(2);
    });

    test('recipe with no valid ingredients after validation goes to error', async () => {
      const recipes = [createMockRecipe('Recipe', [], ['UnknownIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('error');
      });

      expect(result.current.errorMessage).toBeTruthy();
    });

    test('preserves existing mappings when adding new ones', async () => {
      const recipes = [createMockRecipe('Recipe', ['NewTag1', 'NewTag2'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onTagValidated(
          { id: 1, name: 'NewTag1' },
          { id: 10, name: 'Validated Tag 1' }
        );
      });

      act(() => {
        result.current.handlers.onTagValidated(
          { id: 2, name: 'NewTag2' },
          { id: 11, name: 'Validated Tag 2' }
        );
      });

      expect(result.current.validationState?.tagMappings.size).toBe(2);
    });

    test('startImport does nothing when validation state is null', () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          false,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      act(() => result.current.handlers.startImport());

      expect(result.current.phase).toBe('initializing');
      expect(mockAddMultipleRecipes).not.toHaveBeenCalled();
    });
  });

  describe('warning phase (pre-validation skips)', () => {
    const createRecipeWithNoIngredientNames = (title: string): ConvertedImportRecipe => ({
      title,
      description: `${title} description`,
      imageUrl: 'https://example.com/image.jpg',
      persons: 4,
      time: 30,
      tags: [],
      ingredients: [
        { id: 0, name: '', unit: 'g', quantity: '100', type: ingredientType.vegetable, season: [] },
      ],
      preparation: [],
      sourceUrl: `https://example.com/${title.toLowerCase().replace(' ', '-')}`,
      sourceProvider: 'mock',
    });

    test('transitions to warning phase when a recipe has all-empty ingredient names', async () => {
      const recipes = [
        createRecipeWithNoIngredientNames('Skipped Recipe'),
        createMockRecipe('Normal Recipe', [], ['NewIngredient']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(
        () => {
          expect(result.current.phase).toBe('warning');
        },
        { timeout: 3000 }
      );
    });

    test('populates skippedRecipes with pre-validation skips', async () => {
      const skippedRecipe = createRecipeWithNoIngredientNames('Skipped Recipe');
      const recipes = [skippedRecipe, createMockRecipe('Normal Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(
        () => {
          expect(result.current.phase).toBe('warning');
        },
        { timeout: 3000 }
      );

      expect(result.current.skippedRecipes).toHaveLength(1);
      expect(result.current.skippedRecipes[0].title).toBe('Skipped Recipe');
      expect(result.current.skippedRecipes[0].sourceUrl).toBe(skippedRecipe.sourceUrl);
    });

    test('acknowledgeWarning transitions to reviewing when items need validation', async () => {
      const recipes = [
        createRecipeWithNoIngredientNames('Skipped Recipe'),
        createMockRecipe('Normal Recipe', [], ['NewIngredient']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(
        () => {
          expect(result.current.phase).toBe('warning');
        },
        { timeout: 3000 }
      );

      act(() => {
        result.current.handlers.acknowledgeWarning();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });
    });

    test('acknowledgeWarning triggers import when all items were auto-resolved', async () => {
      const knownIngredient: ingredientTableElement = {
        id: 1,
        name: 'Chicken',
        unit: 'g',
        type: ingredientType.meat,
        season: [],
      };
      const localFindSimilarIngredients = jest.fn().mockReturnValue([knownIngredient]);

      const recipes = [
        createRecipeWithNoIngredientNames('Skipped Recipe'),
        createMockRecipe('Normal Recipe', [], ['Chicken']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          localFindSimilarIngredients
        )
      );

      await waitFor(
        () => {
          expect(result.current.phase).toBe('warning');
        },
        { timeout: 3000 }
      );

      act(() => {
        result.current.handlers.acknowledgeWarning();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });
    });

    test('skippedRecipes is empty for a clean import', async () => {
      const recipes = [createMockRecipe('Normal Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      expect(result.current.skippedRecipes).toHaveLength(0);
    });
  });

  describe('skippedRecipes at save time', () => {
    test('skippedRecipes is updated after import with post-save skips', async () => {
      const recipes = [
        createMockRecipe('Recipe With Ingredient', [], ['NewIngredient']),
        createMockRecipe('Recipe Without Match', [], ['AnotherIngredient']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.skippedRecipes).toHaveLength(1);
      expect(result.current.skippedRecipes[0].title).toBe('Recipe Without Match');
    });

    test('skippedRecipes is empty when all recipes have valid ingredients', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(
          recipes,
          mockAddMultipleRecipes,
          true,
          4,
          mockFindSimilarTags,
          mockFindSimilarIngredients
        )
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('reviewing');
      });

      act(() => {
        result.current.handlers.onIngredientValidated('NewIngredient', {
          id: 10,
          name: 'Validated',
          unit: 'g',
          type: ingredientType.vegetable,
          season: [],
        });
      });

      act(() => result.current.handlers.startImport());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.skippedRecipes).toHaveLength(0);
    });
  });
});
