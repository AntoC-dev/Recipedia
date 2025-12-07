import { renderHook, waitFor } from '@testing-library/react-native';
import { RecipeDatabaseProvider, useRecipeDatabase } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () => require('@mocks/utils/FileGestion-mock').fileGestionMock());
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

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
});
