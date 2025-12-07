import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecipeTags } from '@hooks/useRecipeTags';
import { RecipeFormProvider, useRecipeForm } from '@context/RecipeFormContext';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { testTags } from '@data/tagsDataset';
import { testIngredients } from '@data/ingredientsDataset';

const mockFindSimilarTags = jest.fn();
const mockAddTag = jest.fn();

jest.mock('@context/RecipeDatabaseContext', () => {
  const { testTags: mockTags } = require('@data/tagsDataset');
  const { testIngredients: mockIngredients } = require('@data/ingredientsDataset');
  return {
    useRecipeDatabase: () => ({
      ingredients: mockIngredients,
      tags: mockTags,
      recipes: [],
      findSimilarIngredients: jest.fn(() => []),
      findSimilarTags: mockFindSimilarTags,
      addIngredient: jest.fn(async (ing: unknown) => ing),
      addTag: mockAddTag,
      isDatabaseReady: true,
      searchRandomlyTags: jest.fn(() => []),
      getRandomTags: jest.fn(() => []),
    }),
    RecipeDatabaseProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

function createTagsWrapper(props: RecipePropType) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecipeFormProvider props={props}>
        <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
      </RecipeFormProvider>
    );
  };
}

const recipeWithTags: recipeTableElement = {
  id: 1,
  image_Source: 'test.jpg',
  title: 'Test Recipe',
  description: 'Test',
  tags: [
    { id: 1, name: 'Italian' },
    { id: 2, name: 'Dinner' },
  ],
  persons: 4,
  ingredients: [
    { id: 1, name: 'Flour', unit: 'g', quantity: '200', type: ingredientType.cereal, season: [] },
  ],
  season: [],
  preparation: [{ title: 'Step 1', description: 'Mix' }],
  time: 30,
};

describe('useRecipeTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindSimilarTags.mockImplementation((name: string) => {
      const exactMatch = testTags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (exactMatch) return [exactMatch];

      const fuzzyMatches = testTags.filter(t => {
        const lowerTag = t.name.toLowerCase();
        const lowerName = name.toLowerCase();
        return (
          lowerTag.includes(lowerName.substring(0, 3)) ||
          lowerName.includes(lowerTag.substring(0, 3))
        );
      });
      return fuzzyMatches;
    });
    mockAddTag.mockImplementation(async tag => ({ ...tag, id: 100 }));
  });

  describe('addTag', () => {
    test('rejects empty tag', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTag('');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(2);
    });

    test('rejects whitespace-only tag', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTag('   ');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(2);
    });

    test('skips duplicate tag (case-insensitive)', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTag('ITALIAN');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(2);
    });

    test('adds exact match tag from database', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTag('Mexican');
      });

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(3);
      });

      expect(result.current.form.state.recipeTags.some(t => t.name === 'Mexican')).toBe(true);
    });

    test('triggers validation queue for fuzzy matches', async () => {
      mockFindSimilarTags.mockImplementation((name: string) => {
        if (name.toLowerCase() === 'itallian') {
          return [{ id: 1, name: 'Italian' }];
        }
        return [];
      });

      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTag('Itallian');
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
        expect(result.current.dialogs.validationQueue?.type).toBe('Tag');
      });
    });

    test('adds new tag that has no database match', async () => {
      mockFindSimilarTags.mockImplementation(() => []);

      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
          dialogs: useRecipeDialogs(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTag('CompletelyNewTag');
      });

      await waitFor(() => {
        expect(result.current.dialogs.validationQueue).not.toBeNull();
      });
    });
  });

  describe('removeTag', () => {
    test('removes tag by exact name', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.removeTag('Italian');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(1);
      expect(result.current.form.state.recipeTags[0].name).toBe('Dinner');
    });

    test('does nothing for non-existing tag', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.removeTag('NonExistentTag');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(2);
    });

    test('case-sensitive removal (does not remove different case)', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.removeTag('ITALIAN');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(2);
    });

    test('removes all tags when called for each', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.removeTag('Italian');
      });

      act(() => {
        result.current.tags.removeTag('Dinner');
      });

      expect(result.current.form.state.recipeTags).toHaveLength(0);
    });
  });

  describe('addTagIfNotDuplicate', () => {
    test('adds tag if not duplicate', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 3, name: 'Mexican' });
      });

      expect(result.current.form.state.recipeTags).toHaveLength(3);
      expect(result.current.form.state.recipeTags.some(t => t.name === 'Mexican')).toBe(true);
    });

    test('does not add duplicate (case-insensitive)', async () => {
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(2);
      });

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 1, name: 'ITALIAN' });
      });

      expect(result.current.form.state.recipeTags).toHaveLength(2);
    });

    test('adds tag with different case as new entry', async () => {
      const recipeWithEmptyTags: recipeTableElement = { ...recipeWithTags, tags: [] };
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithEmptyTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(0);
      });

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 1, name: 'Italian' });
      });

      expect(result.current.form.state.recipeTags).toHaveLength(1);

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 2, name: 'ITALIAN' });
      });

      expect(result.current.form.state.recipeTags).toHaveLength(1);
    });

    test('can add multiple unique tags', async () => {
      const recipeWithEmptyTags: recipeTableElement = { ...recipeWithTags, tags: [] };
      const wrapper = createTagsWrapper(createMockRecipeProp('edit', recipeWithEmptyTags));

      const { result } = renderHook(
        () => ({
          tags: useRecipeTags(),
          form: useRecipeForm(),
        }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.form.state.recipeTags).toHaveLength(0);
      });

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 1, name: 'Italian' });
      });

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 2, name: 'Dinner' });
      });

      act(() => {
        result.current.tags.addTagIfNotDuplicate({ id: 3, name: 'Quick Meal' });
      });

      expect(result.current.form.state.recipeTags).toHaveLength(3);
    });
  });
});
