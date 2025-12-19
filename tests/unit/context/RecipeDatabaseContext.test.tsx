import { renderHook, waitFor } from '@testing-library/react-native';
import { RecipeDatabaseProvider, useRecipeDatabase } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';

describe('RecipeDatabaseContext', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('scaleAllRecipesForNewDefaultPersons', () => {
    test('scales all recipes to new default persons count', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const originalRecipes = result.current.recipes;
      expect(originalRecipes.length).toBeGreaterThan(0);

      await result.current.scaleAllRecipesForNewDefaultPersons(6);

      await waitFor(() => {
        const scaledRecipes = result.current.recipes;
        scaledRecipes.forEach(recipe => {
          if (recipe.persons && recipe.persons > 0) {
            expect(recipe.persons).toBe(6);
          }
        });
      });
    });

    test('progress starts undefined and returns to undefined after scaling', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      expect(result.current.scalingProgress).toBeUndefined();

      await result.current.scaleAllRecipesForNewDefaultPersons(8);

      await waitFor(() => {
        expect(result.current.scalingProgress).toBeUndefined();
      });
    });

    test('clears progress after scaling completes', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      await result.current.scaleAllRecipesForNewDefaultPersons(7);

      await waitFor(() => {
        expect(result.current.scalingProgress).toBeUndefined();
      });
    });

    test('does nothing when no recipes need scaling', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      await result.current.scaleAllRecipesForNewDefaultPersons(6);

      await waitFor(() => {
        expect(result.current.scalingProgress).toBeUndefined();
      });

      const recipesAfterFirstScale = [...result.current.recipes];

      await result.current.scaleAllRecipesForNewDefaultPersons(6);

      await waitFor(() => {
        expect(result.current.scalingProgress).toBeUndefined();
      });

      expect(result.current.recipes).toEqual(recipesAfterFirstScale);
    });

    test('skips recipes with invalid persons count', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const invalidRecipe = {
        ...testRecipes[0],
        id: undefined,
        persons: 0,
        title: 'Invalid Recipe Test',
      };

      await result.current.addRecipe(invalidRecipe);

      await waitFor(() => {
        const invalidRecipeInState = result.current.recipes.find(
          r => r.title === 'Invalid Recipe Test'
        );
        expect(invalidRecipeInState).toBeDefined();
        expect(invalidRecipeInState?.persons).toBe(0);
      });

      await result.current.scaleAllRecipesForNewDefaultPersons(6);

      await waitFor(() => {
        const invalidRecipeAfter = result.current.recipes.find(
          r => r.title === 'Invalid Recipe Test'
        );
        expect(invalidRecipeAfter?.persons).toBe(0);
      });
    });

    test('correctly scales recipe ingredient quantities', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const recipeBefore = result.current.recipes[0];
      const ingredientBefore = recipeBefore.ingredients[0];
      const oldPersons = recipeBefore.persons;
      const newPersons = 8;

      await result.current.scaleAllRecipesForNewDefaultPersons(newPersons);

      await waitFor(() => {
        const recipeAfter = result.current.recipes.find(r => r.id === recipeBefore.id);
        const ingredientAfter = recipeAfter?.ingredients.find(
          ing => ing.id === ingredientBefore.id
        );

        if (ingredientBefore.quantity && ingredientAfter?.quantity) {
          const expectedQuantity = (
            (parseFloat(ingredientBefore.quantity.replace(',', '.')) * newPersons) /
            oldPersons
          )
            .toString()
            .replace('.', ',');

          expect(ingredientAfter.quantity).toBe(expectedQuantity);
        }
      });
    });
  });

  describe('import memory methods', () => {
    test('getImportedSourceUrls returns empty set when no recipes imported', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const importedUrls = result.current.getImportedSourceUrls('hellofresh');

      expect(importedUrls).toBeInstanceOf(Set);
      expect(importedUrls.size).toBe(0);
    });

    test('getImportedSourceUrls returns URLs of imported recipes for provider', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const importedRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Imported Recipe',
        sourceUrl: 'https://hellofresh.com/recipe-123',
        sourceProvider: 'hellofresh',
      };
      await result.current.addRecipe(importedRecipe);

      await waitFor(() => {
        const importedUrls = result.current.getImportedSourceUrls('hellofresh');
        expect(importedUrls.has('https://hellofresh.com/recipe-123')).toBe(true);
      });
    });

    test('getImportedSourceUrls filters by provider', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const hellofreshRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'HelloFresh Recipe',
        sourceUrl: 'https://hellofresh.com/recipe-1',
        sourceProvider: 'hellofresh',
      };
      const marmitonRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Marmiton Recipe',
        sourceUrl: 'https://marmiton.org/recipe-1',
        sourceProvider: 'marmiton',
      };
      await result.current.addRecipe(hellofreshRecipe);
      await result.current.addRecipe(marmitonRecipe);

      await waitFor(() => {
        const hellofreshUrls = result.current.getImportedSourceUrls('hellofresh');
        const marmitonUrls = result.current.getImportedSourceUrls('marmiton');

        expect(hellofreshUrls.size).toBe(1);
        expect(hellofreshUrls.has('https://hellofresh.com/recipe-1')).toBe(true);
        expect(marmitonUrls.size).toBe(1);
        expect(marmitonUrls.has('https://marmiton.org/recipe-1')).toBe(true);
      });
    });

    test('getSeenUrls returns empty set when no URLs marked as seen', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const seenUrls = result.current.getSeenUrls('hellofresh');

      expect(seenUrls).toBeInstanceOf(Set);
      expect(seenUrls.size).toBe(0);
    });

    test('markUrlsAsSeen adds URLs to seen history', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const urls = ['https://hellofresh.com/recipe-1', 'https://hellofresh.com/recipe-2'];
      await result.current.markUrlsAsSeen('hellofresh', urls);

      const seenUrls = result.current.getSeenUrls('hellofresh');
      expect(seenUrls.size).toBe(2);
      expect(seenUrls.has('https://hellofresh.com/recipe-1')).toBe(true);
      expect(seenUrls.has('https://hellofresh.com/recipe-2')).toBe(true);
    });

    test('markUrlsAsSeen is provider-specific', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      await result.current.markUrlsAsSeen('hellofresh', ['https://hellofresh.com/recipe-1']);
      await result.current.markUrlsAsSeen('marmiton', ['https://marmiton.org/recipe-1']);

      const hellofreshSeen = result.current.getSeenUrls('hellofresh');
      const marmitonSeen = result.current.getSeenUrls('marmiton');

      expect(hellofreshSeen.size).toBe(1);
      expect(marmitonSeen.size).toBe(1);
      expect(hellofreshSeen.has('https://hellofresh.com/recipe-1')).toBe(true);
      expect(marmitonSeen.has('https://marmiton.org/recipe-1')).toBe(true);
    });

    test('removeFromSeenHistory removes URLs from seen history', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      const urls = ['https://hellofresh.com/recipe-1', 'https://hellofresh.com/recipe-2'];
      await result.current.markUrlsAsSeen('hellofresh', urls);

      let seenUrls = result.current.getSeenUrls('hellofresh');
      expect(seenUrls.size).toBe(2);

      await result.current.removeFromSeenHistory('hellofresh', ['https://hellofresh.com/recipe-1']);

      seenUrls = result.current.getSeenUrls('hellofresh');
      expect(seenUrls.size).toBe(1);
      expect(seenUrls.has('https://hellofresh.com/recipe-1')).toBe(false);
      expect(seenUrls.has('https://hellofresh.com/recipe-2')).toBe(true);
    });

    test('removeFromSeenHistory only affects specified provider', async () => {
      const { result } = renderHook(() => useRecipeDatabase(), {
        wrapper: RecipeDatabaseProvider,
      });

      await waitFor(() => {
        expect(result.current.isDatabaseReady).toBe(true);
      });

      await result.current.markUrlsAsSeen('hellofresh', ['https://example.com/recipe-1']);
      await result.current.markUrlsAsSeen('marmiton', ['https://example.com/recipe-1']);

      await result.current.removeFromSeenHistory('hellofresh', ['https://example.com/recipe-1']);

      const hellofreshSeen = result.current.getSeenUrls('hellofresh');
      const marmitonSeen = result.current.getSeenUrls('marmiton');

      expect(hellofreshSeen.size).toBe(0);
      expect(marmitonSeen.size).toBe(1);
    });
  });
});
