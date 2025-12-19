import { renderHook, waitFor } from '@testing-library/react-native';
import { useRecipeScraperValidation } from '@hooks/useRecipeScraperValidation';
import React, { ReactNode } from 'react';
import {
  FormIngredientElement,
  ingredientType,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { RecipeFormProvider } from '@context/RecipeFormContext';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';
import { createMockRecipeProp } from '@test-helpers/recipeHookTestWrapper';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';

const createMockIngredient = (name: string): FormIngredientElement => ({
  name,
  quantity: '100',
  unit: 'g',
});

const createMockTag = (name: string): tagTableElement => ({
  id: 0,
  name,
});

const createScrapedRecipe = (
  ingredients: FormIngredientElement[],
  tags: tagTableElement[]
): recipeTableElement => ({
  id: 1,
  image_Source: 'test.jpg',
  title: 'Scraped Recipe',
  description: 'Test',
  tags,
  persons: 4,
  ingredients: ingredients.map((ing, idx) => ({
    id: idx,
    name: ing.name ?? '',
    unit: ing.unit ?? 'g',
    quantity: ing.quantity ?? '100',
    type: ingredientType.vegetable,
    season: [],
  })),
  season: [],
  preparation: [{ title: 'Step 1', description: 'Cook' }],
  time: 30,
});

function createWrapper(ingredients: FormIngredientElement[], tags: tagTableElement[]) {
  const recipe = createScrapedRecipe(ingredients, tags);
  const props = createMockRecipeProp('addFromScrape', recipe);
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>
          <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
        </RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

function createReadOnlyWrapper() {
  const props = createMockRecipeProp('readOnly');
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RecipeDatabaseProvider>
        <RecipeFormProvider props={props}>
          <RecipeDialogsProvider>{children}</RecipeDialogsProvider>
        </RecipeFormProvider>
      </RecipeDatabaseProvider>
    );
  };
}

describe('useRecipeScraperValidation', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('does not trigger validation when not in addScrape mode', () => {
    const wrapper = createReadOnlyWrapper();

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    expect(result.current.validationQueue).toBeNull();
  });

  test('does not trigger validation when no ingredients or tags', () => {
    const wrapper = createWrapper([], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    expect(result.current.validationQueue).toBeNull();
  });

  test('starts ingredient validation when ingredients need validation', async () => {
    const wrapper = createWrapper([createMockIngredient('UnknownIngredient')], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).not.toBeNull();
    });
    expect(result.current.validationQueue?.type).toBe('Ingredient');
  });

  test('starts tag validation when tags need validation', async () => {
    const wrapper = createWrapper([], [createMockTag('UnknownTag')]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).not.toBeNull();
    });
    expect(result.current.validationQueue?.type).toBe('Tag');
  });

  test('validates tags before ingredients when both need validation', async () => {
    const wrapper = createWrapper(
      [createMockIngredient('UnknownIngredient')],
      [createMockTag('UnknownTag')]
    );

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.validationQueue).not.toBeNull();
    });
    expect(result.current.validationQueue?.type).toBe('Tag');
  });

  test('does not trigger validation for known ingredients', async () => {
    const knownIngredientName = testIngredients[0].name;
    const wrapper = createWrapper([createMockIngredient(knownIngredientName)], []);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(
      () => {
        expect(result.current.validationQueue).toBeNull();
      },
      { timeout: 1000 }
    );
  });

  test('does not trigger validation for known tags', async () => {
    const knownTagName = testTags[0].name;
    const wrapper = createWrapper([], [createMockTag(knownTagName)]);

    const { result } = renderHook(
      () => {
        useRecipeScraperValidation();
        return useRecipeDialogs();
      },
      { wrapper }
    );

    await waitFor(
      () => {
        expect(result.current.validationQueue).toBeNull();
      },
      { timeout: 1000 }
    );
  });
});
