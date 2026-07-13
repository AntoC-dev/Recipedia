import {
  buildDiscoveryListData,
  buildFetchQueue,
  cancelOutOfBoundsFetches,
  computeBufferBounds,
  computeVisibleBounds,
  getBufferRecipesNeedingFetch,
  groupDismissedRecipesByProvider,
} from '@utils/BulkImportUtils';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';
import { dismissedRecipeTableElement } from '@customTypes/DatabaseElementTypes';

const createRecipe = (url: string, title: string): DiscoveredRecipe => ({
  url,
  title,
  imageUrl: `https://example.com/${url}.jpg`,
});

const createRecipeWithoutImage = (url: string): DiscoveredRecipe => ({
  url,
  title: url,
});

const createDismissed = (
  providerId: string,
  recipeUrl: string,
  title: string
): dismissedRecipeTableElement => ({
  providerId,
  recipeUrl,
  title,
  imageUrl: '',
  dismissedAt: 0,
});

const upperCaseName = (providerId: string) => providerId.toUpperCase();

describe('BulkImportUtils', () => {
  describe('buildDiscoveryListData', () => {
    test('returns empty array when both inputs are empty', () => {
      const result = buildDiscoveryListData([], []);

      expect(result).toEqual([]);
    });

    test('returns only fresh section when seenRecipes is empty', () => {
      const freshRecipes = [createRecipe('recipe-1', 'Recipe 1')];

      const result = buildDiscoveryListData(freshRecipes, []);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: 'header',
        key: 'fresh-header',
        titleKey: 'bulkImport.selection.newRecipes',
        count: 1,
      });
      expect(result[1]).toEqual({
        type: 'recipe',
        key: 'fresh-0',
        recipe: freshRecipes[0],
      });
    });

    test('returns only seen section when freshRecipes is empty', () => {
      const seenRecipes = [createRecipe('recipe-1', 'Recipe 1')];

      const result = buildDiscoveryListData([], seenRecipes);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: 'header',
        key: 'seen-header',
        titleKey: 'bulkImport.selection.previouslySeen',
        count: 1,
      });
      expect(result[1]).toEqual({
        type: 'recipe',
        key: 'seen-0',
        recipe: seenRecipes[0],
      });
    });

    test('returns fresh section before seen section', () => {
      const freshRecipes = [createRecipe('fresh-1', 'Fresh Recipe')];
      const seenRecipes = [createRecipe('seen-1', 'Seen Recipe')];

      const result = buildDiscoveryListData(freshRecipes, seenRecipes);

      expect(result).toHaveLength(4);
      expect(result[0]!.type).toBe('header');
      expect(result[0]!.key).toBe('fresh-header');
      expect(result[2]!.type).toBe('header');
      expect(result[2]!.key).toBe('seen-header');
    });

    test('includes correct count in header items', () => {
      const freshRecipes = [
        createRecipe('fresh-1', 'Fresh 1'),
        createRecipe('fresh-2', 'Fresh 2'),
        createRecipe('fresh-3', 'Fresh 3'),
      ];
      const seenRecipes = [createRecipe('seen-1', 'Seen 1'), createRecipe('seen-2', 'Seen 2')];

      const result = buildDiscoveryListData(freshRecipes, seenRecipes);

      const freshHeader = result.find(item => item.key === 'fresh-header');
      const seenHeader = result.find(item => item.key === 'seen-header');

      expect(freshHeader?.type === 'header' && freshHeader.count).toBe(3);
      expect(seenHeader?.type === 'header' && seenHeader.count).toBe(2);
    });

    test('assigns sequential keys to recipe items', () => {
      const freshRecipes = [createRecipe('fresh-1', 'Fresh 1'), createRecipe('fresh-2', 'Fresh 2')];
      const seenRecipes = [createRecipe('seen-1', 'Seen 1'), createRecipe('seen-2', 'Seen 2')];

      const result = buildDiscoveryListData(freshRecipes, seenRecipes);

      const recipeItems = result.filter(item => item.type === 'recipe');
      expect(recipeItems.map(item => item.key)).toEqual(['fresh-0', 'fresh-1', 'seen-0', 'seen-1']);
    });

    test('preserves recipe data in recipe items', () => {
      const freshRecipe = createRecipe('my-recipe', 'My Recipe');
      freshRecipe.description = 'A delicious recipe';

      const result = buildDiscoveryListData([freshRecipe], []);

      const recipeItem = result.find(item => item.type === 'recipe');
      expect(recipeItem?.type === 'recipe' && recipeItem.recipe).toEqual(freshRecipe);
    });

    test('handles large number of recipes', () => {
      const freshRecipes = Array.from({ length: 100 }, (_, i) =>
        createRecipe(`fresh-${i}`, `Fresh ${i}`)
      );
      const seenRecipes = Array.from({ length: 50 }, (_, i) =>
        createRecipe(`seen-${i}`, `Seen ${i}`)
      );

      const result = buildDiscoveryListData(freshRecipes, seenRecipes);

      expect(result).toHaveLength(152);
      expect(result.filter(item => item.type === 'header')).toHaveLength(2);
      expect(result.filter(item => item.type === 'recipe')).toHaveLength(150);
    });
  });

  describe('computeVisibleBounds', () => {
    const recipes = [
      createRecipe('a', 'A'),
      createRecipe('b', 'B'),
      createRecipe('c', 'C'),
      createRecipe('d', 'D'),
    ];

    test('returns -1 bounds when nothing is visible', () => {
      expect(computeVisibleBounds(recipes, new Set())).toEqual({ minIndex: -1, maxIndex: -1 });
    });

    test('returns -1 bounds for an empty recipe list', () => {
      expect(computeVisibleBounds([], new Set(['a']))).toEqual({ minIndex: -1, maxIndex: -1 });
    });

    test('returns the same index for a single visible recipe', () => {
      expect(computeVisibleBounds(recipes, new Set(['c']))).toEqual({ minIndex: 2, maxIndex: 2 });
    });

    test('returns the span of visible recipes', () => {
      expect(computeVisibleBounds(recipes, new Set(['b', 'd']))).toEqual({
        minIndex: 1,
        maxIndex: 3,
      });
    });

    test('ignores visible urls that are not in the recipe list', () => {
      expect(computeVisibleBounds(recipes, new Set(['a', 'missing']))).toEqual({
        minIndex: 0,
        maxIndex: 0,
      });
    });
  });

  describe('computeBufferBounds', () => {
    test('returns an empty range when no items are visible', () => {
      expect(computeBufferBounds({ minIndex: -1, maxIndex: -1 }, 10, 20)).toEqual({
        start: 0,
        end: -1,
      });
    });

    test('extends the range by the buffer size on both sides', () => {
      expect(computeBufferBounds({ minIndex: 5, maxIndex: 7 }, 2, 20)).toEqual({
        start: 3,
        end: 9,
      });
    });

    test('clamps the start index to zero', () => {
      expect(computeBufferBounds({ minIndex: 1, maxIndex: 2 }, 5, 20)).toEqual({
        start: 0,
        end: 7,
      });
    });

    test('clamps the end index to the last recipe', () => {
      expect(computeBufferBounds({ minIndex: 8, maxIndex: 9 }, 5, 10)).toEqual({
        start: 3,
        end: 9,
      });
    });
  });

  describe('getBufferRecipesNeedingFetch', () => {
    const recipes = [
      createRecipeWithoutImage('a'),
      createRecipeWithoutImage('b'),
      createRecipeWithoutImage('c'),
      createRecipeWithoutImage('d'),
    ];

    test('returns recipes in the buffer zone that need an image', () => {
      const result = getBufferRecipesNeedingFetch(
        recipes,
        { start: 0, end: 3 },
        new Set(),
        new Set(),
        new Set()
      );
      expect(result.map(r => r.url)).toEqual(['a', 'b', 'c', 'd']);
    });

    test('excludes recipes that already have an image', () => {
      const mixed = [createRecipe('a', 'A'), createRecipeWithoutImage('b')];
      const result = getBufferRecipesNeedingFetch(
        mixed,
        { start: 0, end: 1 },
        new Set(),
        new Set(),
        new Set()
      );
      expect(result.map(r => r.url)).toEqual(['b']);
    });

    test('excludes visible, fetched and pending recipes', () => {
      const result = getBufferRecipesNeedingFetch(
        recipes,
        { start: 0, end: 3 },
        new Set(['a']),
        new Set(['b']),
        new Set(['c'])
      );
      expect(result.map(r => r.url)).toEqual(['d']);
    });

    test('returns an empty array when the buffer range is empty', () => {
      const result = getBufferRecipesNeedingFetch(
        recipes,
        { start: 0, end: -1 },
        new Set(),
        new Set(),
        new Set()
      );
      expect(result).toEqual([]);
    });
  });

  describe('buildFetchQueue', () => {
    test('queues visible recipes before buffer recipes', () => {
      const visible = [createRecipeWithoutImage('v1'), createRecipeWithoutImage('v2')];
      const buffer = [createRecipeWithoutImage('b1')];
      expect(buildFetchQueue(visible, buffer, new Set(), new Set())).toEqual(['v1', 'v2', 'b1']);
    });

    test('skips visible recipes that are already fetched or pending', () => {
      const visible = [
        createRecipeWithoutImage('v1'),
        createRecipeWithoutImage('v2'),
        createRecipeWithoutImage('v3'),
      ];
      expect(buildFetchQueue(visible, [], new Set(['v1']), new Set(['v2']))).toEqual(['v3']);
    });

    test('appends buffer recipes without filtering', () => {
      const buffer = [createRecipeWithoutImage('b1'), createRecipeWithoutImage('b2')];
      expect(buildFetchQueue([], buffer, new Set(['b1']), new Set())).toEqual(['b1', 'b2']);
    });

    test('returns an empty queue when nothing needs fetching', () => {
      expect(buildFetchQueue([], [], new Set(), new Set())).toEqual([]);
    });
  });

  describe('cancelOutOfBoundsFetches', () => {
    const recipes = [
      createRecipeWithoutImage('a'),
      createRecipeWithoutImage('b'),
      createRecipeWithoutImage('c'),
      createRecipeWithoutImage('d'),
    ];

    const makeControllers = (urls: string[]): Map<string, AbortController> => {
      const map = new Map<string, AbortController>();
      urls.forEach(url => map.set(url, new AbortController()));
      return map;
    };

    test('aborts and forgets fetches outside the buffer zone', () => {
      const controllers = makeControllers(['d']);
      const controller = controllers.get('d')!;
      const pending = new Set(['d']);

      cancelOutOfBoundsFetches(recipes, new Set(['a']), { start: 0, end: 1 }, controllers, pending);

      expect(controller.signal.aborted).toBe(true);
      expect(controllers.has('d')).toBe(false);
      expect(pending.has('d')).toBe(false);
    });

    test('keeps fetches for visible recipes', () => {
      const controllers = makeControllers(['a']);
      const controller = controllers.get('a')!;
      const pending = new Set(['a']);

      cancelOutOfBoundsFetches(recipes, new Set(['a']), { start: 3, end: 3 }, controllers, pending);

      expect(controller.signal.aborted).toBe(false);
      expect(controllers.has('a')).toBe(true);
      expect(pending.has('a')).toBe(true);
    });

    test('keeps fetches inside the buffer zone', () => {
      const controllers = makeControllers(['b']);
      const controller = controllers.get('b')!;
      const pending = new Set(['b']);

      cancelOutOfBoundsFetches(recipes, new Set(['a']), { start: 0, end: 2 }, controllers, pending);

      expect(controller.signal.aborted).toBe(false);
      expect(controllers.has('b')).toBe(true);
    });

    test('aborts fetches whose url is no longer in the recipe list', () => {
      const controllers = makeControllers(['gone']);
      const controller = controllers.get('gone')!;
      const pending = new Set(['gone']);

      cancelOutOfBoundsFetches(recipes, new Set(), { start: 0, end: 3 }, controllers, pending);

      expect(controller.signal.aborted).toBe(true);
      expect(controllers.has('gone')).toBe(false);
    });
  });

  describe('groupDismissedRecipesByProvider', () => {
    test('returns empty array for no recipes', () => {
      expect(groupDismissedRecipesByProvider([], upperCaseName)).toEqual([]);
    });

    test('groups recipes of the same provider together', () => {
      const recipes = [
        createDismissed('hellofresh', 'url-1', 'Recipe 1'),
        createDismissed('hellofresh', 'url-2', 'Recipe 2'),
      ];

      const groups = groupDismissedRecipesByProvider(recipes, upperCaseName);

      expect(groups).toHaveLength(1);
      expect(groups[0]!.providerId).toBe('hellofresh');
      expect(groups[0]!.recipes).toHaveLength(2);
    });

    test('resolves the provider display name', () => {
      const recipes = [createDismissed('hellofresh', 'url-1', 'Recipe 1')];

      const groups = groupDismissedRecipesByProvider(recipes, upperCaseName);

      expect(groups[0]!.providerName).toBe('HELLOFRESH');
    });

    test('creates one group per provider in first-encountered order', () => {
      const recipes = [
        createDismissed('quitoque', 'url-1', 'Recipe 1'),
        createDismissed('hellofresh', 'url-2', 'Recipe 2'),
        createDismissed('quitoque', 'url-3', 'Recipe 3'),
      ];

      const groups = groupDismissedRecipesByProvider(recipes, upperCaseName);

      expect(groups.map(g => g.providerId)).toEqual(['quitoque', 'hellofresh']);
      expect(groups[0]!.recipes).toHaveLength(2);
      expect(groups[1]!.recipes).toHaveLength(1);
    });

    test('preserves input order within a group', () => {
      const recipes = [
        createDismissed('hellofresh', 'url-1', 'First'),
        createDismissed('hellofresh', 'url-2', 'Second'),
      ];

      const groups = groupDismissedRecipesByProvider(recipes, upperCaseName);

      expect(groups[0]!.recipes.map(r => r.title)).toEqual(['First', 'Second']);
    });
  });
});
