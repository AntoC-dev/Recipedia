import { renderHook, act } from '@testing-library/react-native';
import { useIngredients } from '@hooks/useIngredients';
import RecipeDatabase from '@utils/RecipeDatabase';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';

const makeIngredient = (name: string): ingredientTableElement => ({
  name,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [],
});

describe('useIngredients', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('search index memoization contract', () => {
    test('returns a stable ingredients array reference across calls when data is unchanged', () => {
      const first = database.get_ingredients();
      const second = database.get_ingredients();
      expect(second).toBe(first);
    });

    test('produces a new ingredients array reference after a mutation', async () => {
      const before = database.get_ingredients();
      await database.addIngredient(makeIngredient('Tomato'));
      const after = database.get_ingredients();
      expect(after).not.toBe(before);
    });

    test('repeated findSimilarIngredients calls return consistent results for the same corpus', async () => {
      await database.addMultipleIngredients([makeIngredient('Tomato'), makeIngredient('Onion')]);

      const { result } = renderHook(() => useIngredients());
      const first = result.current.findSimilarIngredients('Tomato');

      for (let i = 0; i < 10; i++) {
        expect(result.current.findSimilarIngredients('Tomato')).toEqual(first);
        expect(result.current.findSimilarIngredients('Onion').map(i => i.name)).toContain('Onion');
      }
    });

    test('findSimilarIngredients reflects new data after an ingredient is added', async () => {
      await database.addIngredient(makeIngredient('Tomato'));

      const { result, rerender } = renderHook(() => useIngredients());
      expect(result.current.findSimilarIngredients('Tomato').map(i => i.name)).toContain('Tomato');
      expect(result.current.findSimilarIngredients('Chicken')).toEqual([]);

      await act(async () => {
        await database.addIngredient(makeIngredient('Chicken'));
      });
      rerender({});

      expect(result.current.findSimilarIngredients('Chicken').map(i => i.name)).toContain(
        'Chicken'
      );
    });

    test('findSimilarIngredientsDetailed returns exact match for cleaned name', async () => {
      await database.addIngredient(makeIngredient('Tomato'));

      const { result } = renderHook(() => useIngredients());

      const detailed = result.current.findSimilarIngredientsDetailed('Tomato (canned)');
      expect(detailed.exact?.name).toBe('Tomato');
      expect(detailed.similar).toEqual([]);
    });

    test('findSimilarIngredients returns an empty array for an empty corpus', () => {
      const { result } = renderHook(() => useIngredients());
      expect(result.current.findSimilarIngredients('Anything')).toEqual([]);
    });

    test('findSimilarIngredientsDetailed returns { similar: [] } for an empty query', async () => {
      await database.addIngredient(makeIngredient('Tomato'));
      const { result } = renderHook(() => useIngredients());
      const detailed = result.current.findSimilarIngredientsDetailed('');
      expect(detailed.exact).toBeUndefined();
      expect(detailed.similar).toEqual([]);
    });
  });

  describe('database delegators', () => {
    test('addIngredient delegates to RecipeDatabase.addIngredient', async () => {
      const { result } = renderHook(() => useIngredients());
      const created = await result.current.addIngredient(makeIngredient('Tomato'));
      expect(created.name).toBe('Tomato');
      expect(database.get_ingredients().map(i => i.name)).toContain('Tomato');
    });

    test('editIngredient delegates to RecipeDatabase.editIngredient', async () => {
      await database.addIngredient(makeIngredient('Tomato'));
      const stored = database.get_ingredients().find(i => i.name === 'Tomato')!;
      const { result } = renderHook(() => useIngredients());
      const ok = await result.current.editIngredient({ ...stored, name: 'Tomate' });
      expect(ok).toBe(true);
      expect(database.get_ingredients().map(i => i.name)).toContain('Tomate');
    });

    test('deleteIngredient delegates to RecipeDatabase.deleteIngredient', async () => {
      await database.addIngredient(makeIngredient('Tomato'));
      const stored = database.get_ingredients().find(i => i.name === 'Tomato')!;
      const { result } = renderHook(() => useIngredients());
      const ok = await result.current.deleteIngredient(stored);
      expect(ok).toBe(true);
      expect(database.get_ingredients().map(i => i.name)).not.toContain('Tomato');
    });

    test('addMultipleIngredients delegates to RecipeDatabase.addMultipleIngredients', async () => {
      const { result } = renderHook(() => useIngredients());
      await result.current.addMultipleIngredients([
        makeIngredient('Tomato'),
        makeIngredient('Onion'),
      ]);
      const names = database.get_ingredients().map(i => i.name);
      expect(names).toContain('Tomato');
      expect(names).toContain('Onion');
    });

    test('getRandomIngredients returns from database for the requested type', async () => {
      await database.addMultipleIngredients([makeIngredient('Tomato'), makeIngredient('Onion')]);
      const { result } = renderHook(() => useIngredients());
      const random = result.current.getRandomIngredients(ingredientType.vegetable, 2);
      expect(random).toHaveLength(2);
      random.forEach(i => expect(i.type).toBe(ingredientType.vegetable));
    });
  });
});
