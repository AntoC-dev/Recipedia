import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipes } from '@hooks/useRecipes';
import RecipeDatabase from '@utils/RecipeDatabase';
import { deleteFile, isTemporaryImageUri } from '@utils/FileGestion';
import { ingredientType, RecipeDraft } from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/FileGestion', () => require('@mocks/utils/FileGestion-mock').fileGestionMock());

const deleteFileMock = deleteFile as jest.Mock;
const isTemporaryImageUriMock = isTemporaryImageUri as jest.Mock;

const catalogIngredients = [
  { name: 'Pasta', unit: 'g', type: ingredientType.cereal, season: [] },
  { name: 'Tomato', unit: 'g', type: ingredientType.vegetable, season: [] },
];

function makeRecipe(overrides: Partial<RecipeDraft> = {}): RecipeDraft {
  return {
    title: 'Pasta Primavera',
    image_Source: '',
    description: '',
    tags: [],
    persons: 2,
    ingredients: [
      { name: 'Pasta', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
      { name: 'Tomato', unit: 'g', quantity: '150', type: ingredientType.vegetable, season: [] },
    ],
    season: [],
    preparation: [],
    time: 20,
    ...overrides,
  };
}

describe('useRecipes', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(catalogIngredients);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('exposes the reactive recipes array and an undefined scaling progress', () => {
    const { result } = renderHook(() => useRecipes());
    expect(result.current.recipes).toEqual([]);
    expect(result.current.scalingProgress).toBeUndefined();
  });

  test('addRecipe inserts a recipe into the database', async () => {
    const { result } = renderHook(() => useRecipes());

    await act(async () => {
      await result.current.addRecipe(makeRecipe({ title: 'Added' }));
    });

    await waitFor(() => {
      expect(result.current.recipes.map(r => r.title)).toContain('Added');
    });
  });

  test('addMultipleRecipes inserts every recipe', async () => {
    const { result } = renderHook(() => useRecipes());

    await act(async () => {
      await result.current.addMultipleRecipes([
        makeRecipe({ title: 'First' }),
        makeRecipe({ title: 'Second' }),
      ]);
    });

    await waitFor(() => {
      expect(result.current.recipes).toHaveLength(2);
    });
    const titles = result.current.recipes.map(r => r.title);
    expect(titles).toEqual(expect.arrayContaining(['First', 'Second']));
  });

  test('deleteRecipe removes the recipe', async () => {
    await database.addRecipe(makeRecipe());
    const { result } = renderHook(() => useRecipes());

    await act(async () => {
      await result.current.deleteRecipe(database.get_recipes()[0]!);
    });

    await waitFor(() => {
      expect(result.current.recipes).toHaveLength(0);
    });
  });

  test('findSimilarRecipes returns recipes matching the given draft', async () => {
    await database.addRecipe(makeRecipe());
    const { result } = renderHook(() => useRecipes());

    const similar = result.current.findSimilarRecipes(makeRecipe());
    expect(similar.map(r => r.title)).toContain('Pasta Primavera');
  });

  describe('editRecipe', () => {
    test('updates the recipe fields', async () => {
      await database.addRecipe(makeRecipe({ title: 'Before' }));
      const stored = database.get_recipes()[0]!;
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.editRecipe({ ...makeRecipe({ title: 'After' }), id: stored.id });
      });

      await waitFor(() => {
        expect(result.current.recipes[0]!.title).toBe('After');
      });
    });

    test('deletes the previous image when it changed and is not temporary', async () => {
      await database.addRecipe(makeRecipe({ image_Source: 'perm://old.jpg' }));
      const stored = database.get_recipes()[0]!;
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.editRecipe({
          ...makeRecipe({ image_Source: 'perm://new.jpg' }),
          id: stored.id,
        });
      });

      expect(deleteFileMock).toHaveBeenCalledWith('perm://old.jpg');
    });

    test('keeps the old image when the image is unchanged', async () => {
      await database.addRecipe(makeRecipe({ image_Source: 'perm://same.jpg' }));
      const stored = database.get_recipes()[0]!;
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.editRecipe({
          ...makeRecipe({ image_Source: 'perm://same.jpg' }),
          id: stored.id,
        });
      });

      expect(deleteFileMock).not.toHaveBeenCalled();
    });

    test('deletes no image when the edited recipe is absent from the current list', async () => {
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.editRecipe({
          ...makeRecipe({ image_Source: 'perm://new.jpg' }),
          id: 9999,
        });
      });

      expect(deleteFileMock).not.toHaveBeenCalled();
    });

    test('keeps the old image when the previous image is temporary', async () => {
      await database.addRecipe(makeRecipe({ image_Source: 'perm://old.jpg' }));
      const stored = database.get_recipes()[0]!;
      const { result } = renderHook(() => useRecipes());

      isTemporaryImageUriMock.mockReturnValueOnce(true);
      await act(async () => {
        await result.current.editRecipe({
          ...makeRecipe({ image_Source: '' }),
          id: stored.id,
        });
      });

      expect(deleteFileMock).not.toHaveBeenCalled();
    });
  });

  describe('scaleAllRecipesForNewDefaultPersons', () => {
    test('rescales recipes whose serving count differs from the new default', async () => {
      await database.addRecipe(makeRecipe({ persons: 2 }));
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.scaleAllRecipesForNewDefaultPersons(4);
      });

      await waitFor(() => {
        expect(result.current.recipes[0]!.persons).toBe(4);
      });
      expect(result.current.scalingProgress).toBeUndefined();
    });

    test('rescales every recipe whose serving count differs from the new default', async () => {
      await database.addMultipleRecipes([
        makeRecipe({ title: 'A', persons: 2 }),
        makeRecipe({ title: 'B', persons: 3 }),
      ]);
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.scaleAllRecipesForNewDefaultPersons(5);
      });

      await waitFor(() => {
        expect(result.current.recipes.every(r => r.persons === 5)).toBe(true);
      });
      expect(result.current.scalingProgress).toBeUndefined();
    });

    test('does nothing when no recipe needs rescaling', async () => {
      await database.addRecipe(makeRecipe({ persons: 4 }));
      const { result } = renderHook(() => useRecipes());

      const before = result.current.recipes[0];
      await act(async () => {
        await result.current.scaleAllRecipesForNewDefaultPersons(4);
      });

      expect(result.current.recipes[0]).toBe(before);
      expect(result.current.scalingProgress).toBeUndefined();
    });

    test('swallows a scaling failure and resets progress', async () => {
      await database.addRecipe(makeRecipe({ persons: 2 }));
      const spy = jest
        .spyOn(database, 'scaleAndUpdateRecipe')
        .mockRejectedValue(new Error('scale failed'));
      const { result } = renderHook(() => useRecipes());

      await act(async () => {
        await result.current.scaleAllRecipesForNewDefaultPersons(6);
      });

      expect(result.current.scalingProgress).toBeUndefined();
      spy.mockRestore();
    });
  });
});
