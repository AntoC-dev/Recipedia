import { act, renderHook } from '@testing-library/react-native';
import { refreshSimilarityFor, useValidationReviewState } from '@hooks/useValidationReviewState';
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
    test('initializes all items as pending', async () => {
      const { result } = await renderHook(() =>
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

    test('computes similarity on init', async () => {
      const findTags = createFindSimilarTags({ quickmeals: [dbTag] });
      const findIngs = createFindSimilarIngredients({ tomatoe: [dbIngredient] });

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, mockIngredients, findTags, findIngs)
      );

      const quickMealsItem = result.current.tags.find(t => t.name === 'QuickMeals');
      expect(quickMealsItem?.similarItems).toEqual([dbTag]);

      const tomatoeItem = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(tomatoeItem?.similarItems).toEqual([dbIngredient]);
    });

    test('filters out exact matches from similarItems', async () => {
      const exactMatch = { id: 1, name: 'Italian' };
      const findTags = createFindSimilarTags({ italian: [exactMatch] });

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      const italianItem = result.current.tags.find(t => t.name === 'Italian');
      expect(italianItem?.similarItems).toEqual([]);
    });

    test('skips ingredients without name', async () => {
      const ingredientsWithEmpty = [
        { unit: 'g', quantity: '100', type: ingredientType.vegetable },
        { name: 'Tomato', unit: 'g', quantity: '100', type: ingredientType.vegetable },
      ];

      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          ingredientsWithEmpty,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      expect(result.current.ingredients).toHaveLength(1);
    });

    test('allResolved is false initially with items', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      expect(result.current.allResolved).toBe(false);
    });

    test('allResolved is false with empty lists', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState([], [], createFindSimilarTags(), createFindSimilarIngredients())
      );

      expect(result.current.allResolved).toBe(false);
    });
  });

  describe('sorting', () => {
    test('sorts tags alphabetically', async () => {
      const { result } = await renderHook(() =>
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

    test('sorts ingredients alphabetically', async () => {
      const { result } = await renderHook(() =>
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
    test('marks tag as resolved with resolution', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
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
    test('marks ingredient as resolved with resolution', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
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
    test('marks tag as skipped', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.skipTag('Italian');
      });

      const item = result.current.tags.find(t => t.name === 'Italian');
      expect(item?.reviewState.status).toBe('skipped');
    });
  });

  describe('skipIngredient', () => {
    test('marks ingredient as skipped', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.skipIngredient('Tomatoe');
      });

      const item = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(item?.reviewState.status).toBe('skipped');
    });
  });

  describe('undoTag', () => {
    test('resets resolved tag to pending and re-checks similarity', async () => {
      const findTags = createFindSimilarTags({ italian: [{ id: 50, name: 'New Italian' }] });

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian' },
        });
      });

      expect(result.current.tags.find(t => t.name === 'Italian')?.reviewState.status).toBe(
        'resolved'
      );

      findTags.mockReturnValue([{ id: 60, name: 'Italian Refreshed' }]);

      await act(() => {
        result.current.undoTag('Italian');
      });

      const item = result.current.tags.find(t => t.name === 'Italian');
      expect(item?.reviewState.status).toBe('pending');
    });
  });

  describe('undoIngredient', () => {
    test('resets resolved ingredient to pending', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'add-new',
          resolvedItem: dbIngredient,
        });
      });

      await act(() => {
        result.current.undoIngredient('Tomatoe');
      });

      const item = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(item?.reviewState.status).toBe('pending');
    });
  });

  describe('undo single-item recheck', () => {
    test('undoTag invokes findSimilarTags only for the undone item', async () => {
      const findTags = createFindSimilarTags();

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'use-suggested',
          resolvedItem: { id: 10, name: 'Italian Cuisine' },
        });
      });

      findTags.mockClear();

      await act(() => {
        result.current.undoTag('Italian');
      });

      expect(findTags).toHaveBeenCalledTimes(1);
      expect(findTags).toHaveBeenCalledWith('Italian');
    });

    test('undoIngredient invokes findSimilarIngredients only for the undone item', async () => {
      const findIngs = createFindSimilarIngredients();

      const { result } = await renderHook(() =>
        useValidationReviewState([], mockIngredients, createFindSimilarTags(), findIngs)
      );

      await act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'use-suggested',
          resolvedItem: dbIngredient,
        });
      });

      findIngs.mockClear();

      await act(() => {
        result.current.undoIngredient('Tomatoe');
      });

      expect(findIngs).toHaveBeenCalledTimes(1);
      expect(findIngs).toHaveBeenCalledWith('Tomatoe');
    });

    test('undoTag refreshes similarity only for the undone tag, leaves others untouched', async () => {
      const initialItalianMatch = { id: 50, name: 'Italian Original' };
      const dessertMatch = { id: 51, name: 'Dessert Original' };
      const findTags = createFindSimilarTags({
        italian: [initialItalianMatch],
        dessert: [dessertMatch],
      });

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      await act(() => {
        result.current.skipTag('Italian');
      });

      const refreshedItalianMatch = { id: 60, name: 'Italian Refreshed' };
      findTags.mockImplementation((name: string) =>
        name === 'Italian' ? [refreshedItalianMatch] : [dessertMatch]
      );

      await act(() => {
        result.current.undoTag('Italian');
      });

      const italian = result.current.tags.find(t => t.name === 'Italian');
      expect(italian?.similarItems).toEqual([refreshedItalianMatch]);

      const dessert = result.current.tags.find(t => t.name === 'Dessert');
      expect(dessert?.similarItems).toEqual([dessertMatch]);
    });

    test('undoTag excludes the undone tag itself from refreshed similarity results', async () => {
      const selfMatch = { id: 1, name: 'Italian' };
      const otherMatch = { id: 70, name: 'Italian Fusion' };
      const findTags = createFindSimilarTags();

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      await act(() => {
        result.current.skipTag('Italian');
      });

      findTags.mockReturnValue([selfMatch, otherMatch]);

      await act(() => {
        result.current.undoTag('Italian');
      });

      const italian = result.current.tags.find(t => t.name === 'Italian');
      expect(italian?.similarItems).toEqual([otherMatch]);
    });

    test('undoTag with a name not in the list leaves all tags untouched', async () => {
      const findTags = createFindSimilarTags();

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      const before = result.current.tags;
      findTags.mockClear();

      await act(() => {
        result.current.undoTag('NotAnyKnownTag');
      });

      expect(findTags).not.toHaveBeenCalled();
      result.current.tags.forEach((tag, i) => {
        expect(tag.similarItems).toBe(before[i]!.similarItems);
      });
    });

    test('undoIngredient with a name not in the list leaves all ingredients untouched', async () => {
      const findIngs = createFindSimilarIngredients();

      const { result } = await renderHook(() =>
        useValidationReviewState([], mockIngredients, createFindSimilarTags(), findIngs)
      );

      const before = result.current.ingredients;
      findIngs.mockClear();

      await act(() => {
        result.current.undoIngredient('NotAnyKnownIngredient');
      });

      expect(findIngs).not.toHaveBeenCalled();
      result.current.ingredients.forEach((ing, i) => {
        expect(ing.similarItems).toBe(before[i]!.similarItems);
      });
    });

    test('undoIngredient excludes the undone ingredient from refreshed similarity results', async () => {
      const selfMatch = {
        id: 99,
        name: 'Tomatoe',
        unit: 'g',
        type: ingredientType.vegetable,
        season: [],
      };
      const otherMatch = {
        id: 100,
        name: 'Tomato Paste',
        unit: 'g',
        type: ingredientType.vegetable,
        season: [],
      };
      const findIngs = createFindSimilarIngredients();

      const { result } = await renderHook(() =>
        useValidationReviewState([], mockIngredients, createFindSimilarTags(), findIngs)
      );

      await act(() => {
        result.current.skipIngredient('Tomatoe');
      });

      findIngs.mockReturnValue([selfMatch, otherMatch]);

      await act(() => {
        result.current.undoIngredient('Tomatoe');
      });

      const tomato = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(tomato?.similarItems).toEqual([otherMatch]);
    });
  });

  describe('allResolved', () => {
    test('returns true when all items are resolved or skipped', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [mockTags[0]!],
          [mockIngredients[0]!],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian' },
        });
      });

      await act(() => {
        result.current.skipIngredient('Tomatoe');
      });

      expect(result.current.allResolved).toBe(true);
    });

    test('returns false when some items are still pending', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian' },
        });
      });

      expect(result.current.allResolved).toBe(false);
    });
  });

  describe('auto-dedup after add-new', () => {
    test('auto-resolves pending tags that share the just-added name', async () => {
      const tagsWithDup = [
        { id: 1, name: 'Italian' },
        { id: 2, name: 'italian' },
        { id: 3, name: 'Dessert' },
      ];

      const { result } = await renderHook(() =>
        useValidationReviewState(
          tagsWithDup,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      const savedTag = { id: 99, name: 'Italian' };
      await act(() => {
        result.current.resolveTag('Italian', { type: 'add-new', resolvedItem: savedTag });
      });

      const duplicate = result.current.tags.find(t => t.name === 'italian');
      expect(duplicate?.reviewState.status).toBe('resolved');
      expect(duplicate?.reviewState.resolution?.type).toBe('add-new');
      expect(duplicate?.reviewState.resolution?.resolvedItem).toEqual(savedTag);

      const unrelated = result.current.tags.find(t => t.name === 'Dessert');
      expect(unrelated?.reviewState.status).toBe('pending');
    });

    test('auto-resolves pending ingredients that share the just-added name', async () => {
      const ingredientsWithDup = [
        { name: 'Tomatoe', unit: 'g', quantity: '200', type: ingredientType.vegetable },
        { name: 'tomatoe', unit: 'g', quantity: '100', type: ingredientType.vegetable },
        { name: 'Chiken', unit: 'g', quantity: '300', type: ingredientType.meat },
      ];

      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          ingredientsWithDup,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      const savedIng = {
        id: 30,
        name: 'Tomatoe',
        unit: 'g',
        type: ingredientType.vegetable,
        season: [],
      };
      await act(() => {
        result.current.resolveIngredient('Tomatoe', { type: 'add-new', resolvedItem: savedIng });
      });

      const duplicate = result.current.ingredients.find(i => i.name === 'tomatoe');
      expect(duplicate?.reviewState.status).toBe('resolved');
      expect(duplicate?.reviewState.resolution?.type).toBe('add-new');

      const unrelated = result.current.ingredients.find(i => i.name === 'Chiken');
      expect(unrelated?.reviewState.status).toBe('pending');
    });

    test('auto-resolve does not call the fuzzy finder', async () => {
      const findTags = createFindSimilarTags();
      const findIngs = createFindSimilarIngredients();
      const tagsWithDup = [
        { id: 1, name: 'Italian' },
        { id: 2, name: 'italian' },
      ];

      const { result } = await renderHook(() =>
        useValidationReviewState(tagsWithDup, [], findTags, findIngs)
      );

      findTags.mockClear();
      findIngs.mockClear();

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 99, name: 'Italian' },
        });
      });

      expect(findTags).not.toHaveBeenCalled();
      expect(findIngs).not.toHaveBeenCalled();
    });

    test('auto-resolve does not touch non-matching non-pending items', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.skipTag('Dessert');
      });

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 99, name: 'Italian' },
        });
      });

      const dessert = result.current.tags.find(t => t.name === 'Dessert');
      expect(dessert?.reviewState.status).toBe('skipped');
    });

    test('auto-resolve is a no-op when no other pending item shares the name', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          mockIngredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.resolveIngredient('Tomatoe', {
          type: 'add-new',
          resolvedItem: dbIngredient,
        });
      });

      const chiken = result.current.ingredients.find(i => i.name === 'Chiken');
      expect(chiken?.reviewState.status).toBe('pending');
    });

    test('appends the added tag to similarItems of other pending tags it fuzzy-matches', async () => {
      const tags = [
        { id: 1, name: 'Italian' },
        { id: 2, name: 'Italan' },
        { id: 3, name: 'Dessert' },
      ];
      const { result } = await renderHook(() =>
        useValidationReviewState(tags, [], createFindSimilarTags(), createFindSimilarIngredients())
      );

      const addedTag = { id: 50, name: 'Italian' };
      await act(() => {
        result.current.resolveTag('Italian', { type: 'add-new', resolvedItem: addedTag });
      });

      const italanItem = result.current.tags.find(t => t.name === 'Italan');
      expect(italanItem?.similarItems.some(s => s.name === 'Italian')).toBe(true);

      const dessertItem = result.current.tags.find(t => t.name === 'Dessert');
      expect(dessertItem?.similarItems.some(s => s.name === 'Italian')).toBe(false);
    });

    test('appends the added ingredient to similarItems of fuzzy-matching pending ingredients', async () => {
      const ingredients = [
        { name: 'Tomato', unit: 'g', quantity: '200', type: ingredientType.vegetable },
        { name: 'Tomatoe', unit: 'g', quantity: '100', type: ingredientType.vegetable },
        { name: 'Chicken', unit: 'g', quantity: '300', type: ingredientType.meat },
      ];
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [],
          ingredients,
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      const savedIng = {
        id: 30,
        name: 'Tomato',
        unit: 'g',
        type: ingredientType.vegetable,
        season: [],
      };
      await act(() => {
        result.current.resolveIngredient('Tomato', { type: 'add-new', resolvedItem: savedIng });
      });

      const tomatoeItem = result.current.ingredients.find(i => i.name === 'Tomatoe');
      expect(tomatoeItem?.similarItems.some(s => s.name === 'Tomato')).toBe(true);

      const chickenItem = result.current.ingredients.find(i => i.name === 'Chicken');
      expect(chickenItem?.similarItems.some(s => s.name === 'Tomato')).toBe(false);
    });

    test('does not duplicate the added item in similarItems on repeated triggers', async () => {
      const tags = [
        { id: 1, name: 'Italian' },
        { id: 2, name: 'Italan' },
      ];
      const { result } = await renderHook(() =>
        useValidationReviewState(tags, [], createFindSimilarTags(), createFindSimilarIngredients())
      );

      const addedTag = { id: 50, name: 'Italian' };
      await act(() => {
        result.current.resolveTag('Italian', { type: 'add-new', resolvedItem: addedTag });
      });
      await act(() => {
        result.current.undoTag('Italan');
        result.current.resolveTag('Italian', { type: 'add-new', resolvedItem: addedTag });
      });

      const italanItem = result.current.tags.find(t => t.name === 'Italan');
      const matches = italanItem?.similarItems.filter(s => s.name === 'Italian') ?? [];
      expect(matches).toHaveLength(1);
    });

    test('does not append the added item to non-pending items similarItems', async () => {
      const tags = [
        { id: 1, name: 'Italian' },
        { id: 2, name: 'Italan' },
      ];
      const { result } = await renderHook(() =>
        useValidationReviewState(tags, [], createFindSimilarTags(), createFindSimilarIngredients())
      );

      await act(() => {
        result.current.skipTag('Italan');
      });

      const initialSimilar = result.current.tags.find(t => t.name === 'Italan')?.similarItems ?? [];

      const addedTag = { id: 50, name: 'Italian' };
      await act(() => {
        result.current.resolveTag('Italian', { type: 'add-new', resolvedItem: addedTag });
      });

      const italanItem = result.current.tags.find(t => t.name === 'Italan');
      expect(italanItem?.similarItems).toBe(initialSimilar);
    });

    test('does not re-check already resolved items', async () => {
      const findTags = createFindSimilarTags();

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      await act(() => {
        result.current.skipTag('QuickMeals');
      });

      findTags.mockClear();

      await act(() => {
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

    test('does not trigger re-check for non add-new resolutions', async () => {
      const findTags = createFindSimilarTags();

      const { result } = await renderHook(() =>
        useValidationReviewState(mockTags, [], findTags, createFindSimilarIngredients())
      );

      findTags.mockClear();

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'use-suggested',
          resolvedItem: { id: 10, name: 'Italian Cuisine' },
        });
      });

      expect(findTags).not.toHaveBeenCalled();
    });
  });

  describe('getResolutionMappings', () => {
    test('returns tag and ingredient mappings for resolved items', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          [mockTags[0]!],
          [mockIngredients[0]!],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.resolveTag('Italian', {
          type: 'add-new',
          resolvedItem: { id: 10, name: 'Italian Cuisine' },
        });
      });

      await act(() => {
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

    test('excludes skipped items from mappings', async () => {
      const { result } = await renderHook(() =>
        useValidationReviewState(
          mockTags,
          [],
          createFindSimilarTags(),
          createFindSimilarIngredients()
        )
      );

      await act(() => {
        result.current.skipTag('Italian');
      });

      await act(() => {
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

  describe('refreshSimilarityFor (pure helper)', () => {
    type Item = { name?: string; similarItems: { id: number; name: string }[] };
    type Match = { id: number; name: string };

    const makeItem = (name: string | undefined, similar: Match[] = []): Item => ({
      name,
      similarItems: similar,
    });

    test('returns the same array reference when no item matches the given name', () => {
      const initial: Item[] = [makeItem('Italian'), makeItem('Dessert')];
      let captured = initial;
      const setItems: React.Dispatch<React.SetStateAction<Item[]>> = updater => {
        captured = typeof updater === 'function' ? updater(captured) : updater;
      };

      refreshSimilarityFor(setItems, () => [{ id: 99, name: 'Should Not Be Used' }], 'Missing');

      expect(captured).toBe(initial);
    });

    test('refreshes only the matched item, leaving others by reference', () => {
      const dessertSimilar = [{ id: 1, name: 'Old Dessert' }];
      const original: Item[] = [makeItem('Italian'), makeItem('Dessert', dessertSimilar)];
      let captured = original;
      const setItems: React.Dispatch<React.SetStateAction<Item[]>> = updater => {
        captured = typeof updater === 'function' ? updater(captured) : updater;
      };

      const newSimilar: Match[] = [{ id: 2, name: 'New Dessert' }];
      refreshSimilarityFor(setItems, () => newSimilar, 'Dessert');

      expect(captured).not.toBe(original);
      expect(captured[0]).toBe(original[0]);
      expect(captured[1]!.similarItems).toEqual(newSimilar);
    });

    test('filters self-match out of the refreshed similar list', () => {
      const original: Item[] = [makeItem('Italian')];
      let captured = original;
      const setItems: React.Dispatch<React.SetStateAction<Item[]>> = updater => {
        captured = typeof updater === 'function' ? updater(captured) : updater;
      };

      const selfMatch: Match = { id: 1, name: 'Italian' };
      const otherMatch: Match = { id: 2, name: 'Italian Fresh' };
      refreshSimilarityFor(setItems, () => [selfMatch, otherMatch], 'Italian');

      expect(captured[0]!.similarItems).toEqual([otherMatch]);
    });

    test('skips items without a name when scanning', () => {
      const original: Item[] = [makeItem(undefined), makeItem('Italian')];
      let captured = original;
      const setItems: React.Dispatch<React.SetStateAction<Item[]>> = updater => {
        captured = typeof updater === 'function' ? updater(captured) : updater;
      };

      const newSimilar: Match[] = [{ id: 5, name: 'Italian Match' }];
      refreshSimilarityFor(setItems, () => newSimilar, 'Italian');

      expect(captured[0]).toBe(original[0]);
      expect(captured[1]!.similarItems).toEqual(newSimilar);
    });
  });
});
