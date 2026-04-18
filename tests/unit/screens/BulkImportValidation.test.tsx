import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { BulkImportValidation } from '@screens/BulkImportValidation';
import React from 'react';
import {
  mockDispatch,
  mockGoBack,
  resetMockRouteParams,
  setMockRouteParams,
} from '@mocks/deps/react-navigation-mock';
import { DefaultPersonsProvider } from '@context/DefaultPersonsContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { ConvertedImportRecipe } from '@customTypes/BulkImportTypes';

jest.mock('@react-navigation/native', () => {
  const { reactNavigationMock } = require('@mocks/deps/react-navigation-mock');
  return reactNavigationMock();
});

jest.mock('@components/organisms/ValidationReviewList', () => ({
  ValidationReviewList: require('@mocks/components/organisms/ValidationReviewList-mock')
    .validationReviewListMock,
}));

jest.mock('@components/molecules/ImportSkippedWarning', () => ({
  ImportSkippedWarning: require('@mocks/components/molecules/ImportSkippedWarning-mock')
    .ImportSkippedWarningMock,
}));

jest.mock('@components/molecules/SkippedRecipesList', () => ({
  SkippedRecipesList: require('@mocks/components/molecules/SkippedRecipesList-mock')
    .SkippedRecipesListMock,
}));

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
    jest.restoreAllMocks();
    await database.closeAndReset();
  });

  const renderComponent = (recipes: ConvertedImportRecipe[] = []) => {
    setMockRouteParams({ providerId: 'hellofresh', selectedRecipes: recipes });
    return render(
      <DefaultPersonsProvider>
        <BulkImportValidation />
      </DefaultPersonsProvider>
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

  test('shows review list when recipes have unknown tags', async () => {
    const recipes = [
      createTestRecipe({
        tags: [{ id: 0, name: 'UnknownTag' }],
        ingredients: [{ name: 'TestIngredient', quantity: '100', unit: 'g' }],
      }),
    ];
    const { getByTestId } = renderComponent(recipes);

    await waitFor(() => {
      expect(getByTestId('BulkImportValidation::ValidationReviewList')).toBeTruthy();
    });
  });

  test('shows review list when recipes have unknown ingredients', async () => {
    const recipes = [
      createTestRecipe({
        ingredients: [{ name: 'UnknownIngredient', quantity: '100', unit: 'g' }],
      }),
    ];
    const { getByTestId } = renderComponent(recipes);

    await waitFor(() => {
      expect(getByTestId('BulkImportValidation::ValidationReviewList')).toBeTruthy();
    });
  });

  test('goes back when cancel pressed', () => {
    const { getByTestId } = renderComponent();

    fireEvent.press(getByTestId('BulkImportValidation::AppBar::BackButton'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  test('shows success after import completes', async () => {
    jest.spyOn(database, 'addMultipleRecipes').mockResolvedValue(undefined);

    const recipes = [
      createTestRecipe({
        ingredients: [{ name: 'TestIngredient', quantity: '100', unit: 'g' }],
        tags: [{ id: 0, name: 'TestTag' }],
      }),
    ];
    const { getByTestId, getByText } = renderComponent(recipes);

    await waitFor(() => {
      expect(getByTestId('BulkImportValidation::ValidationReviewList')).toBeTruthy();
    });

    fireEvent.press(getByTestId('BulkImportValidation::ValidationReviewList::onImport'));

    await waitFor(
      () => {
        expect(getByText('bulkImport.validation.importComplete')).toBeTruthy();
      },
      { timeout: 3000 }
    );
    expect(getByTestId('BulkImportValidation::FinishButton')).toBeTruthy();
  });

  test('resets navigation on finish', async () => {
    jest.spyOn(database, 'addMultipleRecipes').mockResolvedValue(undefined);

    const recipes = [
      createTestRecipe({
        ingredients: [{ name: 'TestIngredient', quantity: '100', unit: 'g' }],
        tags: [{ id: 0, name: 'TestTag' }],
      }),
    ];
    const { getByTestId } = renderComponent(recipes);

    await waitFor(() => {
      expect(getByTestId('BulkImportValidation::ValidationReviewList')).toBeTruthy();
    });

    fireEvent.press(getByTestId('BulkImportValidation::ValidationReviewList::onImport'));

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
});
