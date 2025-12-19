import { renderHook, waitFor } from '@testing-library/react-native';
import { useImportMemory } from '@hooks/useImportMemory';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';
import { RecipeDatabaseProvider, useRecipeDatabase } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import React, { ReactNode } from 'react';

const createRecipe = (url: string, title: string): DiscoveredRecipe => ({
  url,
  title,
});

describe('useImportMemory', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <RecipeDatabaseProvider>{children}</RecipeDatabaseProvider>
  );

  const waitForDatabase = async (result: { current: { isDatabaseReady: boolean } }) => {
    await waitFor(() => {
      expect(result.current.isDatabaseReady).toBe(true);
    });
  };

  describe('getMemoryStatus', () => {
    test('returns fresh for unknown URLs', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      expect(result.current.getMemoryStatus('https://example.com/recipe-1')).toBe('fresh');
    });

    test('returns imported for URLs of imported recipes', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const importedRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Imported Recipe',
        sourceUrl: 'https://hellofresh.com/recipe-imported',
        sourceProvider: 'hellofresh',
      };
      await dbResult.current.addRecipe(importedRecipe);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      await waitFor(() => {
        expect(result.current.getMemoryStatus('https://hellofresh.com/recipe-imported')).toBe(
          'imported'
        );
      });
    });

    test('returns seen for URLs marked as seen', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      await dbResult.current.markUrlsAsSeen('hellofresh', ['https://hellofresh.com/seen-recipe']);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      expect(result.current.getMemoryStatus('https://hellofresh.com/seen-recipe')).toBe('seen');
    });

    test('imported takes precedence over seen', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const url = 'https://hellofresh.com/recipe-both';

      await dbResult.current.markUrlsAsSeen('hellofresh', [url]);

      const importedRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Both Recipe',
        sourceUrl: url,
        sourceProvider: 'hellofresh',
      };
      await dbResult.current.addRecipe(importedRecipe);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      await waitFor(() => {
        expect(result.current.getMemoryStatus(url)).toBe('imported');
      });
    });
  });

  describe('processDiscoveredRecipes', () => {
    test('adds memoryStatus to each recipe', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const recipes = [
        createRecipe('https://example.com/recipe-1', 'Recipe 1'),
        createRecipe('https://example.com/recipe-2', 'Recipe 2'),
      ];

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });
      const processed = result.current.processDiscoveredRecipes(recipes, false);

      expect(processed[0].memoryStatus).toBe('fresh');
      expect(processed[1].memoryStatus).toBe('fresh');
    });

    test('marks imported recipes correctly', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const importedRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Imported Recipe',
        sourceUrl: 'https://hellofresh.com/recipe-1',
        sourceProvider: 'hellofresh',
      };
      await dbResult.current.addRecipe(importedRecipe);

      const recipes = [
        createRecipe('https://hellofresh.com/recipe-1', 'Imported Recipe'),
        createRecipe('https://hellofresh.com/recipe-2', 'Fresh Recipe'),
      ];

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      await waitFor(() => {
        const processed = result.current.processDiscoveredRecipes(recipes, false);
        expect(processed[0].memoryStatus).toBe('imported');
        expect(processed[1].memoryStatus).toBe('fresh');
      });
    });

    test('marks seen recipes correctly', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      await dbResult.current.markUrlsAsSeen('hellofresh', ['https://hellofresh.com/recipe-1']);

      const recipes = [
        createRecipe('https://hellofresh.com/recipe-1', 'Seen Recipe'),
        createRecipe('https://hellofresh.com/recipe-2', 'Fresh Recipe'),
      ];

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });
      const processed = result.current.processDiscoveredRecipes(recipes, false);

      expect(processed[0].memoryStatus).toBe('seen');
      expect(processed[1].memoryStatus).toBe('fresh');
    });

    test('filters out imported recipes when hideImported is true', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const importedRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Imported Recipe',
        sourceUrl: 'https://hellofresh.com/recipe-1',
        sourceProvider: 'hellofresh',
      };
      await dbResult.current.addRecipe(importedRecipe);

      const recipes = [
        createRecipe('https://hellofresh.com/recipe-1', 'Imported Recipe'),
        createRecipe('https://hellofresh.com/recipe-2', 'Fresh Recipe'),
      ];

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      await waitFor(() => {
        const processed = result.current.processDiscoveredRecipes(recipes, true);
        expect(processed).toHaveLength(1);
        expect(processed[0].title).toBe('Fresh Recipe');
      });
    });

    test('keeps imported recipes when hideImported is false', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const importedRecipe = {
        ...testRecipes[0],
        id: undefined,
        title: 'Imported Recipe',
        sourceUrl: 'https://hellofresh.com/recipe-1',
        sourceProvider: 'hellofresh',
      };
      await dbResult.current.addRecipe(importedRecipe);

      const recipes = [
        createRecipe('https://hellofresh.com/recipe-1', 'Imported Recipe'),
        createRecipe('https://hellofresh.com/recipe-2', 'Fresh Recipe'),
      ];

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      await waitFor(() => {
        const processed = result.current.processDiscoveredRecipes(recipes, false);
        expect(processed).toHaveLength(2);
      });
    });

    test('keeps seen recipes regardless of hideImported', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      await dbResult.current.markUrlsAsSeen('hellofresh', ['https://hellofresh.com/recipe-1']);

      const recipes = [
        createRecipe('https://hellofresh.com/recipe-1', 'Seen Recipe'),
        createRecipe('https://hellofresh.com/recipe-2', 'Fresh Recipe'),
      ];

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });
      const processed = result.current.processDiscoveredRecipes(recipes, true);

      expect(processed).toHaveLength(2);
    });

    test('returns empty array for empty input', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });
      const processed = result.current.processDiscoveredRecipes([], false);

      expect(processed).toEqual([]);
    });
  });

  describe('counts', () => {
    test('importedCount reflects number of imported recipes', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      for (let i = 0; i < 3; i++) {
        const importedRecipe = {
          ...testRecipes[0],
          id: undefined,
          title: `Imported Recipe ${i}`,
          sourceUrl: `https://hellofresh.com/recipe-${i}`,
          sourceProvider: 'hellofresh',
        };
        await dbResult.current.addRecipe(importedRecipe);
      }

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      await waitFor(() => {
        expect(result.current.importedCount).toBe(3);
      });
    });

    test('seenCount reflects number of seen URLs', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      await dbResult.current.markUrlsAsSeen('hellofresh', ['url1', 'url2']);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      expect(result.current.seenCount).toBe(2);
    });

    test('counts are zero when nothing imported or seen', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      const { result } = renderHook(() => useImportMemory('hellofresh'), { wrapper });

      expect(result.current.importedCount).toBe(0);
      expect(result.current.seenCount).toBe(0);
    });
  });

  describe('provider filtering', () => {
    test('only returns imported recipes for the specified provider', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

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
      await dbResult.current.addRecipe(hellofreshRecipe);
      await dbResult.current.addRecipe(marmitonRecipe);

      const { result: hellofreshResult } = renderHook(() => useImportMemory('hellofresh'), {
        wrapper,
      });
      const { result: marmitonResult } = renderHook(() => useImportMemory('marmiton'), { wrapper });

      await waitFor(() => {
        expect(hellofreshResult.current.importedCount).toBe(1);
        expect(marmitonResult.current.importedCount).toBe(1);
      });
    });

    test('only returns seen URLs for the specified provider', async () => {
      const { result: dbResult } = renderHook(() => useRecipeDatabase(), { wrapper });
      await waitForDatabase(dbResult);

      await dbResult.current.markUrlsAsSeen('hellofresh', ['https://hellofresh.com/recipe-1']);
      await dbResult.current.markUrlsAsSeen('marmiton', ['https://marmiton.org/recipe-1']);

      const { result: hellofreshResult } = renderHook(() => useImportMemory('hellofresh'), {
        wrapper,
      });
      const { result: marmitonResult } = renderHook(() => useImportMemory('marmiton'), { wrapper });

      expect(hellofreshResult.current.seenCount).toBe(1);
      expect(marmitonResult.current.seenCount).toBe(1);
    });
  });
});
