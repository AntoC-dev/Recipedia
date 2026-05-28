import { renderHook, act } from '@testing-library/react-native';
import { useTags } from '@hooks/useTags';
import RecipeDatabase from '@utils/RecipeDatabase';

describe('useTags', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('search index memoization contract', () => {
    test('returns a stable tags array reference across calls when data is unchanged', () => {
      const first = database.get_tags();
      const second = database.get_tags();
      expect(second).toBe(first);
    });

    test('produces a new tags array reference after a mutation', async () => {
      const before = database.get_tags();
      await database.addTag({ name: 'NewTag' });
      const after = database.get_tags();
      expect(after).not.toBe(before);
    });

    test('repeated findSimilarTags calls return consistent results for the same corpus', async () => {
      await database.addMultipleTags([{ name: 'Italian' }, { name: 'Dessert' }]);

      const { result } = renderHook(() => useTags());
      const first = result.current.findSimilarTags('Italian');

      for (let i = 0; i < 10; i++) {
        expect(result.current.findSimilarTags('Italian')).toEqual(first);
        expect(result.current.findSimilarTags('Dessert').map(t => t.name)).toContain('Dessert');
      }
    });

    test('findSimilarTags reflects new data after a tag is added', async () => {
      await database.addTag({ name: 'Italian' });

      const { result, rerender } = renderHook(() => useTags());
      expect(result.current.findSimilarTags('Italian').map(t => t.name)).toContain('Italian');
      expect(result.current.findSimilarTags('Mexican')).toEqual([]);

      await act(async () => {
        await database.addTag({ name: 'Mexican' });
      });
      rerender({});

      expect(result.current.findSimilarTags('Mexican').map(t => t.name)).toContain('Mexican');
    });

    test('findSimilarTags reflects updated data after a tag is renamed', async () => {
      await database.addTag({ name: 'Italian' });
      const original = database.get_tags().find(t => t.name === 'Italian')!;

      const { result, rerender } = renderHook(() => useTags());
      expect(result.current.findSimilarTags('Italian').map(t => t.name)).toContain('Italian');

      await act(async () => {
        await database.editTag({ id: original.id, name: 'Italiano' });
      });
      rerender({});

      expect(result.current.findSimilarTags('Italian').map(t => t.name)).not.toContain('Italian');
      expect(result.current.findSimilarTags('Italiano').map(t => t.name)).toContain('Italiano');
    });

    test('findSimilarTagsDetailed returns exact match for the current data', async () => {
      await database.addTag({ name: 'Dessert' });

      const { result } = renderHook(() => useTags());

      const detailed = result.current.findSimilarTagsDetailed('Dessert');
      expect(detailed.exact?.name).toBe('Dessert');
      expect(detailed.similar).toEqual([]);
    });

    test('findSimilarTags returns an empty array for an empty corpus', () => {
      const { result } = renderHook(() => useTags());
      expect(result.current.findSimilarTags('Anything')).toEqual([]);
    });

    test('findSimilarTagsDetailed returns { similar: [] } for an empty query', async () => {
      await database.addTag({ name: 'Italian' });
      const { result } = renderHook(() => useTags());
      const detailed = result.current.findSimilarTagsDetailed('');
      expect(detailed.exact).toBeUndefined();
      expect(detailed.similar).toEqual([]);
    });
  });

  describe('database delegators', () => {
    test('addTag delegates to RecipeDatabase.addTag', async () => {
      const { result } = renderHook(() => useTags());
      const created = await result.current.addTag({ name: 'Italian' });
      expect(created.name).toBe('Italian');
      expect(database.get_tags().map(t => t.name)).toContain('Italian');
    });

    test('editTag delegates to RecipeDatabase.editTag', async () => {
      await database.addTag({ name: 'Italian' });
      const stored = database.get_tags().find(t => t.name === 'Italian')!;
      const { result } = renderHook(() => useTags());
      const ok = await result.current.editTag({ id: stored.id, name: 'Italiano' });
      expect(ok).toBe(true);
      expect(database.get_tags().map(t => t.name)).toContain('Italiano');
    });

    test('deleteTag delegates to RecipeDatabase.deleteTag', async () => {
      await database.addTag({ name: 'Italian' });
      const stored = database.get_tags().find(t => t.name === 'Italian')!;
      const { result } = renderHook(() => useTags());
      const ok = await result.current.deleteTag(stored);
      expect(ok).toBe(true);
      expect(database.get_tags().map(t => t.name)).not.toContain('Italian');
    });

    test('addMultipleTags delegates to RecipeDatabase.addMultipleTags', async () => {
      const { result } = renderHook(() => useTags());
      await result.current.addMultipleTags([{ name: 'Italian' }, { name: 'Dessert' }]);
      const names = database.get_tags().map(t => t.name);
      expect(names).toContain('Italian');
      expect(names).toContain('Dessert');
    });

    test('getRandomTags returns from database', async () => {
      await database.addMultipleTags([{ name: 'Italian' }, { name: 'Dessert' }]);
      const { result } = renderHook(() => useTags());
      const random = result.current.getRandomTags(2);
      expect(random).toHaveLength(2);
    });

    test('searchRandomlyTags returns from database', async () => {
      await database.addMultipleTags([{ name: 'Italian' }, { name: 'Dessert' }]);
      const { result } = renderHook(() => useTags());
      const random = result.current.searchRandomlyTags(2);
      expect(Array.isArray(random)).toBe(true);
    });
  });
});
