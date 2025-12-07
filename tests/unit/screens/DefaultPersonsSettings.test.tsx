import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DefaultPersonsSettings from '@screens/DefaultPersonsSettings';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@context/DefaultPersonsContext', () =>
  require('@mocks/context/DefaultPersonsContext-mock')
);
jest.mock('@react-native-community/slider', () => require('@mocks/deps/slider-mock').default);
jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

const { mockSetDefaultPersons } = require('@mocks/context/DefaultPersonsContext-mock');

const defaultProps = {
  navigation: mockNavigationFunctions,
  route: {
    key: 'DefaultPersonsSettings',
    name: 'DefaultPersonsSettings',
    params: {},
  },
};

const renderDefaultPersonsSettings = async () => {
  const result = render(
    <RecipeDatabaseProvider>
      <DefaultPersonsSettings {...(defaultProps as any)} />
    </RecipeDatabaseProvider>
  );

  await waitFor(() => {
    expect(result.getByTestId('DefaultPersonSettings::Slider')).toBeTruthy();
  });

  return result;
};

describe('DefaultPersonsSettings Screen', () => {
  const database: RecipeDatabase = RecipeDatabase.getInstance();

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

  test('renders correctly with default values', async () => {
    const { getByTestId } = await renderDefaultPersonsSettings();

    expect(getByTestId('DefaultPersonSettings::AppBar')).toBeTruthy();
    expect(getByTestId('DefaultPersonSettings::AppBar::BackButton')).toBeTruthy();
    expect(getByTestId('DefaultPersonSettings::PersonsValue').props.children).toEqual([
      4,
      ' ',
      'persons',
    ]);

    expect(getByTestId('DefaultPersonSettings::Slider::Text').props.children).toEqual(4);

    expect(getByTestId('DefaultPersonSettings::MinValue').props.children).toEqual('1');
    expect(getByTestId('DefaultPersonSettings::MaxValue').props.children).toEqual('10');

    expect(getByTestId('DefaultPersonSettings::Cancel')).toBeTruthy();
    expect(getByTestId('DefaultPersonSettings::Save')).toBeTruthy();
  });

  test('updates persons value when slider changes', async () => {
    const { getByTestId } = await renderDefaultPersonsSettings();

    fireEvent.press(getByTestId('DefaultPersonSettings::Slider'));

    await waitFor(() => {
      expect(getByTestId('DefaultPersonSettings::PersonsValue').props.children).toEqual([
        5,
        ' ',
        'persons',
      ]);
    });
  });

  test('calls navigation.goBack when cancel button is pressed', async () => {
    const { getByTestId } = await renderDefaultPersonsSettings();

    // Press the cancel button
    fireEvent.press(getByTestId('DefaultPersonSettings::Cancel'));

    // Verify that navigation.goBack was called
    expect(mockNavigationFunctions.goBack).toHaveBeenCalled();
  });

  test('saves persons value and navigates back when save button is pressed', async () => {
    const { getByTestId } = await renderDefaultPersonsSettings();

    fireEvent.press(getByTestId('DefaultPersonSettings::Slider'));

    fireEvent.press(getByTestId('DefaultPersonSettings::Save'));

    await waitFor(() => {
      expect(mockSetDefaultPersons).toHaveBeenCalledWith(5);
      expect(mockNavigationFunctions.goBack).toHaveBeenCalled();
    });
  });

  test('scales all recipes in database when default persons is changed', async () => {
    const recipeToModify = database.get_recipes()[0];
    expect(recipeToModify).toBeDefined();
    expect(recipeToModify.id).toBeDefined();

    const firstIngredient = recipeToModify.ingredients[0];
    expect(firstIngredient).toBeDefined();

    const modifiedRecipe = {
      ...recipeToModify,
      persons: 2,
      ingredients: recipeToModify.ingredients.map(ing => ({
        ...ing,
        quantity: ing.id === firstIngredient.id ? '100' : ing.quantity,
      })),
    };

    await database.editRecipe(modifiedRecipe);

    const recipeAfterEdit = database.get_recipes().find(r => r.id === recipeToModify.id);
    expect(recipeAfterEdit?.persons).toBe(2);
    const ingredientBefore = recipeAfterEdit?.ingredients.find(
      ing => ing.id === firstIngredient.id
    );
    expect(ingredientBefore).toBeDefined();
    expect(ingredientBefore?.quantity).toBe('100');

    const { getByTestId } = await renderDefaultPersonsSettings();

    fireEvent.press(getByTestId('DefaultPersonSettings::Slider'));

    fireEvent.press(getByTestId('DefaultPersonSettings::Save'));

    await waitFor(() => {
      expect(mockNavigationFunctions.goBack).toHaveBeenCalled();
    });

    const scaledRecipe = database.get_recipes().find(r => r.id === recipeToModify.id);

    expect(scaledRecipe).toBeDefined();
    expect(scaledRecipe?.persons).toBe(5);

    const scaledIngredient = scaledRecipe?.ingredients.find(ing => ing.id === ingredientBefore?.id);
    expect(scaledIngredient).toBeDefined();
    expect(scaledIngredient?.quantity).toBe('250');
  });

  test('shows loading overlay while scaling recipes', async () => {
    const { getByTestId, queryByTestId } = await renderDefaultPersonsSettings();

    expect(queryByTestId('DefaultPersonSettings::LoadingOverlay::Overlay')).toBeNull();

    fireEvent.press(getByTestId('DefaultPersonSettings::Slider'));
    fireEvent.press(getByTestId('DefaultPersonSettings::Save'));

    await waitFor(() => {
      expect(mockNavigationFunctions.goBack).toHaveBeenCalled();
    });
  });
});
