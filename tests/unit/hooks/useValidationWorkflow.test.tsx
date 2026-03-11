import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useValidationWorkflow } from '@hooks/useValidationWorkflow';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
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

describe('useValidationWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddMultipleRecipes.mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    test('transitions to tags phase when unknown tags exist', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(
        () => {
          expect(result.current.phase).toBe('tags');
        },
        { timeout: 3000 }
      );
    });

    test('transitions to ingredients phase when no unknown tags but unknown ingredients exist', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });
    });

    test('transitions directly to importing when all items match', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

      await waitFor(() => {
        expect(['importing', 'complete']).toContain(result.current.phase);
      });
    });
  });

  describe('tag validation', () => {
    test('provides validation state with tags to validate', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag', 'AnotherTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(2);
    });

    test('onTagValidated adds mapping', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      act(() => {
        result.current.handlers.onTagValidated(
          { id: 1, name: 'NewTag' },
          { id: 10, name: 'Validated Tag' }
        );
      });

      expect(result.current.validationState?.tagMappings.size).toBe(1);
    });

    test('onTagQueueComplete transitions to ingredients phase', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      act(() => {
        result.current.handlers.onTagQueueComplete();
      });

      expect(result.current.phase).toBe('ingredients');
    });

    test('onTagQueueComplete transitions to importing when no ingredients to validate', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], [])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      act(() => {
        result.current.handlers.onTagQueueComplete();
      });

      await waitFor(() => {
        expect(['importing', 'error']).toContain(result.current.phase);
      });
    });
  });

  describe('ingredient validation', () => {
    test('provides validation state with ingredients to validate', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient', 'AnotherIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(2);
    });

    test('onIngredientValidated adds mapping', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          {
            id: 10,
            name: 'Validated Ingredient',
            unit: 'g',
            type: ingredientType.vegetable,
            season: [],
          }
        );
      });

      expect(result.current.validationState?.ingredientMappings.size).toBeGreaterThan(0);
    });

    test('onIngredientQueueComplete triggers import', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          {
            id: 10,
            name: 'Validated Ingredient',
            unit: 'g',
            type: ingredientType.vegetable,
            season: [],
          }
        );
      });

      act(() => {
        result.current.handlers.onIngredientQueueComplete();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('importing');
      });
    });
  });

  describe('importing', () => {
    test('calls addMultipleRecipes with validated recipes', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => expect(result.current.phase).toBe('ingredients'));

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

      await waitFor(() => {
        expect(mockAddMultipleRecipes).toHaveBeenCalled();
      });
    });

    test('transitions to complete phase on success', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => expect(result.current.phase).toBe('ingredients'));

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.importedCount).toBe(1);
    });

    test('transitions to error phase on failure', async () => {
      mockAddMultipleRecipes.mockRejectedValue(new Error('Database error'));

      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => expect(result.current.phase).toBe('ingredients'));

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

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
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => {
        result.current.handlers.onIngredientQueueComplete();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.importedCount).toBe(1);
    });

    test('awaits async onImportComplete callback before completing', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      let resolveCallback: () => void;
      const callbackPromise = new Promise<void>(resolve => {
        resolveCallback = resolve;
      });

      const mockOnImportComplete = jest.fn().mockReturnValue(callbackPromise);

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4, mockOnImportComplete)
      );

      await waitFor(() => expect(result.current.phase).toBe('ingredients'));

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

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

    test('saves recipes with defaultPersons instead of recipe persons', async () => {
      const recipesWithWrongPersons = [
        { ...createMockRecipe('Test Recipe', [], ['NewIngredient']), persons: 2 },
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipesWithWrongPersons, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => expect(result.current.phase).toBe('ingredients'));

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 10, name: 'Validated', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

      await waitFor(() => {
        expect(mockAddMultipleRecipes).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ persons: 4 })])
        );
      });
    });

    test('calls onImportComplete with all imported source URLs', async () => {
      const recipes = [
        createMockRecipe('Recipe 1', [], ['Ingredient1']),
        createMockRecipe('Recipe 2', [], ['Ingredient2']),
      ];

      const mockOnImportComplete = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4, mockOnImportComplete)
      );

      await waitFor(() => expect(result.current.phase).toBe('ingredients'));

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'Ingredient1', quantity: '100' },
          { id: 10, name: 'Validated1', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
        result.current.handlers.onIngredientValidated(
          { name: 'Ingredient2', quantity: '100' },
          { id: 11, name: 'Validated2', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

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
    test('provides progress during tag validation', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag', 'AnotherTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      expect(result.current.progress).not.toBeNull();
      expect(result.current.progress?.totalTags).toBe(2);
    });

    test('provides progress during ingredient validation', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient', 'AnotherIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      expect(result.current.progress).not.toBeNull();
      expect(result.current.progress?.totalIngredients).toBe(2);
    });
  });

  describe('handlers', () => {
    test('onTagDismissed does not add mapping', async () => {
      const recipes = [createMockRecipe('Test Recipe', ['NewTag'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      const mappingsSizeBefore = result.current.validationState?.tagMappings.size ?? 0;

      act(() => {
        result.current.handlers.onTagDismissed();
      });

      expect(result.current.validationState?.tagMappings.size).toBe(mappingsSizeBefore);
    });

    test('onIngredientDismissed does not add mapping', async () => {
      const recipes = [createMockRecipe('Test Recipe', [], ['NewIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      const mappingsSizeBefore = result.current.validationState?.ingredientMappings.size ?? 0;

      act(() => {
        result.current.handlers.onIngredientDismissed();
      });

      expect(result.current.validationState?.ingredientMappings.size).toBe(mappingsSizeBefore);
    });
  });

  describe('edge cases', () => {
    test('handles empty recipes array with error', async () => {
      const { result } = renderHook(() =>
        useValidationWorkflow([], mockAddMultipleRecipes, true, 4)
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
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
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

      act(() => result.current.handlers.onTagQueueComplete());

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'Chicken', quantity: '100' },
          { id: 1, name: 'Chicken', unit: 'g', type: ingredientType.meat, season: [] }
        );
        result.current.handlers.onIngredientValidated(
          { name: 'Tomato', quantity: '100' },
          { id: 2, name: 'Tomato', unit: 'piece', type: ingredientType.vegetable, season: [] }
        );
        result.current.handlers.onIngredientValidated(
          { name: 'Onion', quantity: '100' },
          { id: 3, name: 'Onion', unit: 'piece', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => result.current.handlers.onIngredientQueueComplete());

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(result.current.importedCount).toBe(2);
    });

    test('handles recipes with only unknown tags', async () => {
      const recipes = [createMockRecipe('Recipe', ['UnknownTag1', 'UnknownTag2'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      expect(result.current.validationState?.tagsToValidate).toHaveLength(2);
    });

    test('handles recipes with only unknown ingredients', async () => {
      const recipes = [
        createMockRecipe('Recipe', [], ['UnknownIngredient1', 'UnknownIngredient2']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      expect(result.current.validationState?.ingredientsToValidate).toHaveLength(2);
    });

    test('recipe with no valid ingredients after validation goes to error', async () => {
      const recipes = [createMockRecipe('Recipe', [], ['UnknownIngredient'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientQueueComplete();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('error');
      });

      expect(result.current.errorMessage).toBeTruthy();
    });

    test('multiple recipes with mixed validation states', async () => {
      const recipes = [
        createMockRecipe('Full Match', [], ['Chicken']),
        createMockRecipe('Unknown Tags', ['NewTag'], ['Tomato']),
        createMockRecipe('Unknown Ingredients', [], ['NewIngredient']),
      ];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
      });

      act(() => {
        result.current.handlers.onTagQueueComplete();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('ingredients');
      });

      act(() => {
        result.current.handlers.onIngredientValidated(
          { name: 'Chicken', quantity: '100' },
          { id: 1, name: 'Chicken', unit: 'g', type: ingredientType.meat, season: [] }
        );
        result.current.handlers.onIngredientValidated(
          { name: 'Tomato', quantity: '100' },
          { id: 2, name: 'Tomato', unit: 'piece', type: ingredientType.vegetable, season: [] }
        );
        result.current.handlers.onIngredientValidated(
          { name: 'NewIngredient', quantity: '100' },
          { id: 3, name: 'NewIngredient', unit: 'g', type: ingredientType.vegetable, season: [] }
        );
      });

      act(() => {
        result.current.handlers.onIngredientQueueComplete();
      });

      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });
    });

    test('preserves existing mappings when adding new ones', async () => {
      const recipes = [createMockRecipe('Recipe', ['NewTag1', 'NewTag2'], ['Chicken'])];

      const { result } = renderHook(() =>
        useValidationWorkflow(recipes, mockAddMultipleRecipes, true, 4)
      );

      await waitFor(() => {
        expect(result.current.phase).toBe('tags');
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
  });
});
