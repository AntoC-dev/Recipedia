import { buildDiscoveryListData } from '@utils/BulkImportUtils';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';

const createRecipe = (url: string, title: string): DiscoveredRecipe => ({
  url,
  title,
  imageUrl: `https://example.com/${url}.jpg`,
});

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
      expect(result[0].type).toBe('header');
      expect(result[0].key).toBe('fresh-header');
      expect(result[2].type).toBe('header');
      expect(result[2].key).toBe('seen-header');
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
});
