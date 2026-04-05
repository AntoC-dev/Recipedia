import { act, renderHook } from '@testing-library/react-native';
import { useValidationReviewState } from '@hooks/useValidationReviewState';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

const mockTags = [
  { id: 1, name: 'Italian' },
  { id: 2, name: 'QuickMeals' },
  { id: 3, name: 'Dessert' },
];

const mockIngredients = [
  { name: 'Tomatoe', unit: 'g', quantity: '200', type: ingredientType.vegetable },
  { name: 'Chiken', unit: 'g', quantity: '300', type: ingredientType.meat },
];

const dbTag = { id: 10, name: 'Quick Meals' };
const dbIngredient = {
  id: 20,
  name: 'Tomato',
  unit: 'piece',
  type: ingredientType.vegetable,
  season: [],
};
const dbChicken = {
  id: 21,
  name: 'Chicken',
  unit: 'g',
  type: ingredientType.meat,
  season: [],
};

const createFindSimilarTags = (results: Record<string, (typeof dbTag)[]> = {}) =>
  jest.fn((name: string) => results[name.toLowerCase()] ?? []);

const createFindSimilarIngredients = (results: Record<string, (typeof dbIngredient)[]> = {}) =>
  jest.fn((name: string) => results[name.toLowerCase()] ?? []);

describe('useValidationReviewState', () => {
  describe('initialization', () => {
    test('initializes all items as pending', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      expect(result.current.tags).toHaveLength(3);
      expect(result.current.ingredients).toHaveLength(2);
      result.current.tags.forEach(t => expect(t.reviewState.status).toBe('pending'));
      result.current.ingredients.forEach(i => expect(i.reviewState.status).toBe('pending'));
    });

    test('computes similarity on init', () => {
      const findTags = createFindSimilarTags({ quickmeals: [dbTag] });
      const findIngs = createFindSimilarIngredients({ tomatoe: [dbIngredient] });

      const { result } = renderHook(() =>
        useValidationReviewState(mockTags, mockIngredients, findTags, findIngs)
      );

      const quickMealsItem = result.current.tags.find(t => t.name === 'QuickMeals');
      expect(quickMealsItem?.similarItems).toEqual([dbTag]);

      const tomatoeItem = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(tomatoeItem?.similarItems).toEqual([dbIngredient]);
    });

    test('filters out exact matches from similarItems', () => {
      const exactMatch = { id: 1, name: 'Italian' };
      const findTags = createFindSimilarTags({ italian: [exactMatch] });

      const { result } = renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      const italianItem = result.current.tags.find(t => t.name === 'Italian');
      expect(italianItem?.similarItems).toEqual([]);
    });

    test('skips ingredients without name', () => {
      const ingredientsWithEmpty = [
        { unit: 'g', quantity: '100', type: ingredientType.vegetable },
        { name: 'Tomato', unit: 'g', quantity: '100', type: ingredientType.vegetable },
      ];

      const { result } = renderHook(() =>
        useValidationReviewState(
          [],
          ingredientsWithEmpty,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      expect(result.current.ingredients).toHaveLength(1);
    });

    test('allResolved is false initially with items', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      expect(result.current.allResolved).toBe(false);
    });

    test('allResolved is false with empty lists', () => {
      const { result } = renderHook(() =>
        useValidationReviewState([], [], createFindSimilarTags(), createFindSimilarIngredients())
      );

      expect(result.current.allResolved).toBe(false);
    });
  });

  describe('sorting', () => {
    test('sorts tags alphabetically', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      const names = result.current.tags.map(t => t.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    test('sorts ingredients alphabetically', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      const names = result.current.ingredients.map(i => i.name!);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe('resolveTag', () => {
    test('marks tag as resolved with resolution', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'use-suggested',
          resolvedItem: { id: 10, name: 'Italian Cuisine' },
        });
      });

      const item = result.current.tags.find(t => t.name === 'Italian');
      expect(item?.reviewState.status).toBe('resolved');
      expect(item?.reviewState.resolution?.resolvedItem.name).toBe('Italian Cuisine');
    });
  });

  describe('resolveIngredient', () => {
    test('marks ingredient as resolved with resolution', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'pick-existing',
          resolvedItem: dbIngredient,
        });
      });

      const item = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(item?.reviewState.status).toBe('resolved');
      expect(item?.reviewState.resolution?.resolvedItem.name).toBe('Tomato');
    });
  });

  describe('skipTag', () => {
    test('marks tag as skipped', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.skipTag('Italian');
      });

      const item = result.current.tags.find(t => t.name === 'Italian');
      expect(item?.reviewState.status).toBe('skipped');
    });
  });

  describe('skipIngredient', () => {
    test('marks ingredient as skipped', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.skipIngredient('Tomatoe');
      });

      const item = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(item?.reviewState.status).toBe('skipped');
    });
  });

  describe('undoTag', () => {
    test('resets resolved tag to pending and re-checks similarity', () => {
      const findTags = createFindSimilarTags({ italian: [{ id: 50, name: 'New Italian' }] });

      const { result } = renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian' },
        });
      });

      expect(result.current.tags.find(t => t.name === 'Italian')?.reviewState.status).toBe(
        'resolved'
      );

      findTags.mockReturnValue([{ id: 60, name: 'Italian Refreshed' }]);

      act(() => {
        result.current.undoTag('Italian');
      });

      const item = result.current.tags.find(t => t.name === 'Italian');
      expect(item?.reviewState.status).toBe('pending');
    });
  });

  describe('undoIngredient', () => {
    test('resets resolved ingredient to pending', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'add-new',
          resolvedItem: dbIngredient,
        });
      });

      act(() => {
        result.current.undoIngredient('Tomatoe');
      });

      const item = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(item?.reviewState.status).toBe('pending');
    });
  });

  describe('allResolved', () => {
    test('returns true when all items are resolved or skipped', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          [mockTags[0]],
          [mockIngredients[0]],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian' },
        });
      });

      act(() => {
        result.current.skipIngredient('Tomatoe');
      });

      expect(result.current.allResolved).toBe(true);
    });

    test('returns false when some items are still pending', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian' },
        });
      });

      expect(result.current.allResolved).toBe(false);
    });
  });

  describe('auto-dedup after add-new', () => {
    test('re-checks similarity for pending tags after add-new and auto-resolves exact matches', () => {
      const findTags = createFindSimilarTags();

      const { result } = renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      findTags.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'quickmeals') {
          return [{ id: 50, name: 'QuickMeals' }];
        }
        return [];
      });

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 99, name: 'Italian' },
        });
      });

      const quickMeals = result.current.tags.find(t => t.name === 'QuickMeals');
      expect(quickMeals?.reviewState.status).toBe('resolved');
    });

    test('re-checks similarity for pending ingredients after add-new', () => {
      const findIngs = createFindSimilarIngredients();

      const { result } = renderHook(() =>
        useValidationReviewState([], mockIngredients, createFindSimilarTags(), findIngs)
      );

      findIngs.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'chiken') {
          return [dbChicken];
        }
        return [];
      });

      act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'add-new',
          resolvedItem: dbIngredient,
        });
      });

      const chiken = result.current.ingredients.find(i => i.name === 'Chiken');
      expect(chiken?.similarItems).toEqual([dbChicken]);
    });

    test('does not re-check already resolved items', () => {
      const findTags = createFindSimilarTags();

      const { result } = renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      act(() => {
        result.current.skipTag('QuickMeals');
      });

      findTags.mockClear();

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 99, name: 'Italian' },
        });
      });

      const callsForQuickMeals = findTags.mock.calls.filter(
        ([name]: [string]) => name.toLowerCase() === 'quickmeals'
      );
      expect(callsForQuickMeals).toHaveLength(0);
    });

    test('does not trigger re-check for non add-new resolutions', () => {
      const findTags = createFindSimilarTags();

      const { result } = renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      findTags.mockClear();

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'use-suggested',
          resolvedItem: { id: 10, name: 'Italian Cuisine' },
        });
      });

      expect(findTags).not.toHaveBeenCalled();
    });
  });

  describe('getResolutionMappings', () => {
    test('returns tag and ingredient mappings for resolved items', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          [mockTags[0]],
          [mockIngredients[0]],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian Cuisine' },
        });
      });

      act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'pick-existing',
          resolvedItem: dbIngredient,
        });
      });

      const { tagMappings, ingredientMappings } = result.current.getResolutionMappings();

      expect(tagMappings.size).toBe(1);
      expect(tagMappings.get('italian')?.name).toBe('Italian Cuisine');

      expect(ingredientMappings.size).toBe(1);
      expect(ingredientMappings.get('tomatoe')?.name).toBe('Tomato');
    });

    test('excludes skipped items from mappings', () => {
      const { result } = renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      act(() => {
        result.current.skipTag('Italian');
      });

      act(() => {
        result.current.resolveTag('QuickMeals', {
          type: 'add-new',
          resolvedItem: dbTag,
        });
      });

      const { tagMappings } = result.current.getResolutionMappings();

      expect(tagMappings.size).toBe(1);
      expect(tagMappings.has('italian')).toBe(false);
    });
  });
});
