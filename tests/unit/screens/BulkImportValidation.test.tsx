import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BulkImportValidation } from '@screens/BulkImportValidation';
import React from 'react';
import {
  mockDispatch,
  mockGoBack,
  resetMockRouteParams,
  setMockRouteParams,
} from '@mocks/deps/react-navigation-mock';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { ConvertedImportRecipe } from '@customTypes/BulkImportTypes';

jest.mock('@react-navigation/native', () => {
  const { reactNavigationMock } = require('@mocks/deps/react-navigation-mock');
  return reactNavigationMock();
});

jest.mock('@components/molecules/ValidationProgress', () =>
  require('@mocks/components/molecules/ValidationProgress-mock')
);

const createTestRecipe = (
  overrides: Partial<ConvertedImportRecipe> = {}
): ConvertedImportRecipe => ({
  title: 'Test Recipe',
  description: 'Test',
  imageUrl: 'test.jpg',
  time: 30,
  persons: 4,
  ingredients: [],
  tags: [],
  preparation: [{ title: 'Step 1', description: 'Cook' }],
  sourceUrl: 'https://example.com/recipe',
  sourceProvider: 'hellofresh',
  ...overrides,
});

describe('BulkImportValidation', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    resetMockRouteParams();
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: [] });
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  const renderComponent = (recipes: ConvertedImportRecipe[] = []) => {
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });
    return render(
      <RecipeDatabaseProvider>
        <BulkImportValidation />
      </RecipeDatabaseProvider>
    );
  };

  test('renders app bar with title', () => {
    const { getByTestId } = renderComponent();

    expect(getByTestId('BulkImportValidation::AppBar')).toBeTruthy();
  });

  test('shows error when no valid recipes', async () => {
    const { getByText } = renderComponent();

    await waitFor(() => {
      expect(getByText('bulkImport.validation.importError')).toBeTruthy();
    });
  });

  test('shows tag validation when recipes have unknown tags', async () => {
    const recipes = [createTestRecipe({ tags: [{ id: 0, name: 'UnknownTag' }] })];
    const { getByTestId } = renderComponent(recipes);

    await waitFor(() => {
      expect(getByTestId('BulkImportValidation::TagValidation')).toBeTruthy();
    });
  });

  test('shows ingredient validation when recipes have unknown ingredients', async () => {
    const recipes = [
      createTestRecipe({
        ingredients: [{ name: 'UnknownIngredient', quantity: '100', unit: 'g' }],
      }),
    ];
    const { getByTestId } = renderComponent(recipes);

    await waitFor(() => {
      expect(getByTestId('BulkImportValidation::IngredientValidation')).toBeTruthy();
    });
  });

  test('shows success and finish button when recipes have known items', async () => {
    const knownIngredient = testIngredients[0];
    const knownTag = testTags[0];

    const recipes = [
      createTestRecipe({
        ingredients: [{ name: knownIngredient.name, quantity: '100', unit: 'g' }],
        tags: [{ id: 0, name: knownTag.name }],
      }),
    ];
    const { getByTestId, getByText } = renderComponent(recipes);

    await waitFor(
      () => {
        expect(getByText('bulkImport.validation.importComplete')).toBeTruthy();
      },
      { timeout: 3000 }
    );
    expect(getByTestId('BulkImportValidation::FinishButton')).toBeTruthy();
  });

  test('resets navigation on finish', async () => {
    const knownIngredient = testIngredients[0];
    const knownTag = testTags[0];

    const recipes = [
      createTestRecipe({
        ingredients: [{ name: knownIngredient.name, quantity: '100', unit: 'g' }],
        tags: [{ id: 0, name: knownTag.name }],
      }),
    ];
    const { getByTestId } = renderComponent(recipes);

    await waitFor(
      () => {
        expect(getByTestId('BulkImportValidation::FinishButton')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    fireEvent.press(getByTestId('BulkImportValidation::FinishButton'));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'reset',
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    );
  });

  test('goes back when cancel pressed', () => {
    const { getByTestId } = renderComponent();

    fireEvent.press(getByTestId('BulkImportValidation::AppBar::BackButton'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
