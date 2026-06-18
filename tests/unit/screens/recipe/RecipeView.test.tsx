import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { RecipeView } from '@screens/recipe/RecipeView';

import {
  checkAppbarButtons,
  checkDescription,
  checkImage,
  checkIngredients,
  checkNutrition,
  checkPersons,
  checkPreparation,
  checkTags,
  checkTime,
  checkTitle,
  makeRoute,
  mockNavigation,
  renderRoute,
  setupDb,
  teardownDb,
} from './recipeTestHelpers';

jest.mock('@utils/ImagePicker', () => require('@mocks/utils/ImagePicker-mock').imagePickerMock());
jest.mock('@utils/OCR', () => require('@mocks/utils/OCR-mock').ocrMock());

jest.mock('@components/organisms/RecipeTags', () => ({
  RecipeTags: require('@mocks/components/organisms/RecipeTags-mock').recipeTagsMock,
}));
jest.mock('@components/organisms/RecipeImage', () => ({
  RecipeImage: require('@mocks/components/organisms/RecipeImage-mock').recipeImageMock,
}));
jest.mock('@components/organisms/RecipeText', () => ({
  RecipeText: require('@mocks/components/organisms/RecipeText-mock').recipeTextMock,
}));
jest.mock('@components/organisms/RecipeNumber', () => ({
  RecipeNumber: require('@mocks/components/organisms/RecipeNumber-mock').recipeNumberMock,
}));
jest.mock('@components/organisms/RecipeIngredients', () => {
  const mocks = require('@mocks/components/organisms/RecipeIngredients-mock');
  return {
    RecipeIngredients: mocks.recipeIngredientsMock,
    IngredientsTable: mocks.ingredientsTableMock,
    IngredientRow: mocks.ingredientRowMock,
    IngredientsAddEmpty: mocks.ingredientsAddEmptyMock,
    IngredientsAddTail: mocks.ingredientsAddTailMock,
  };
});
jest.mock('@components/organisms/RecipePreparation', () => {
  const mocks = require('@mocks/components/organisms/RecipePreparation-mock');
  return {
    RecipePreparation: mocks.recipePreparationMock,
    PreparationSection: mocks.preparationSectionMock,
    PreparationEmptyAdd: mocks.preparationEmptyAddMock,
    EditableStep: mocks.editableStepMock,
  };
});
jest.mock('@components/molecules/NutritionTable', () =>
  require('@mocks/components/molecules/NutritionTable-mock')
);
jest.mock('@components/molecules/NutritionEmptyState', () =>
  require('@mocks/components/molecules/NutritionEmptyState-mock')
);
jest.mock('@components/dialogs/Alert', () => ({
  Alert: require('@mocks/components/dialogs/Alert-mock').alertMock,
}));
jest.mock('@components/organisms/AppBar', () => ({
  AppBar: require('@mocks/components/organisms/AppBar-mock').appBarMock,
}));

describe('RecipeView', () => {
  const mockRouteReadOnly: RecipePropType = {
    mode: 'readOnly',
    recipe: testRecipes[1],
  };

  let dbInstance: ReturnType<typeof RecipeDatabase.getInstance>;
  beforeEach(async () => {
    jest.clearAllMocks();
    dbInstance = await setupDb();
  });
  afterEach(async () => {
    await teardownDb();
  });

  test('renders initial readonly state from route params', async () => {
    const { getByTestId, queryByTestId } = await renderRoute(mockRouteReadOnly);

    checkAppbarButtons(mockRouteReadOnly, getByTestId, queryByTestId);
    checkImage(mockRouteReadOnly, getByTestId);
    checkTitle(mockRouteReadOnly, getByTestId, queryByTestId);
    checkDescription(mockRouteReadOnly, getByTestId, queryByTestId);
    checkTags(mockRouteReadOnly, getByTestId, queryByTestId);
    checkIngredients(mockRouteReadOnly, getByTestId, queryByTestId);
    checkPersons(mockRouteReadOnly, getByTestId, queryByTestId);
    checkTime(mockRouteReadOnly, getByTestId, queryByTestId);
    checkPreparation(mockRouteReadOnly, getByTestId, queryByTestId);
    checkNutrition(mockRouteReadOnly, getByTestId, queryByTestId);
  });

  test('add-to-menu button persists the recipe to the menu', async () => {
    const { getByTestId } = await renderRoute(mockRouteReadOnly);

    expect(RecipeDatabase.getInstance().get_menu()).toEqual([]);

    fireEvent.press(getByTestId('Recipe::BottomActionButton'));

    await waitFor(() => {
      expect(RecipeDatabase.getInstance().get_menu()).toHaveLength(1);
    });

    const menu = RecipeDatabase.getInstance().get_menu();
    expect(menu[0].recipeTitle).toEqual('Chicken Tacos');
    expect(menu[0].isCooked).toBe(false);
  });

  describe('edit handoff', () => {
    test('pressing the edit button pushes the RecipeEdit route', async () => {
      const { getByTestId } = await renderRoute(mockRouteReadOnly);

      fireEvent.press(getByTestId('Recipe::AppBar::Edit'));

      expect(mockNavigation.push).toHaveBeenCalledWith('RecipeEdit', {
        recipe: mockRouteReadOnly.recipe,
      });
    });
  });

  describe('delete functionality', () => {
    test('shows delete confirmation dialog', async () => {
      const { getByTestId } = await renderRoute(mockRouteReadOnly);

      fireEvent.press(getByTestId('Recipe::AppBar::Delete'));

      expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe('deleteRecipe');
      expect(getByTestId('Recipe::Alert::Content').props.children).toBe('confirmDelete');
    });

    test('deletes the recipe and shows the success message on confirm', async () => {
      const deleteRecipeSpy = jest.spyOn(dbInstance, 'deleteRecipe');
      const { getByTestId } = await renderRoute(mockRouteReadOnly);

      fireEvent.press(getByTestId('Recipe::AppBar::Delete'));
      fireEvent.press(getByTestId('Recipe::Alert::OnConfirm'));

      await waitFor(() => {
        expect(deleteRecipeSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
          'deletedFromDatabase'
        );
      });

      deleteRecipeSpy.mockRestore();
    });

    test('navigates back after confirming delete success', async () => {
      const { getByTestId } = await renderRoute(mockRouteReadOnly);

      fireEvent.press(getByTestId('Recipe::AppBar::Delete'));
      fireEvent.press(getByTestId('Recipe::Alert::OnConfirm'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
          'deletedFromDatabase'
        );
      });

      fireEvent.press(getByTestId('Recipe::Alert::OnConfirm'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('readOnly validation dialog', () => {
    test('confirming the success dialog navigates back', async () => {
      const { getByTestId } = await renderRoute(mockRouteReadOnly);

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });

      fireEvent.press(getByTestId('Recipe::Alert::OnConfirm'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('scaling notice', () => {
    test('does not show the scaling snackbar without a scaledFromServings param', async () => {
      const { queryByTestId } = await renderRoute(mockRouteReadOnly);

      expect(queryByTestId('RecipeScalingSnackbar')).toBeNull();
    });

    test('shows the scaling snackbar when scaledFromServings is present', () => {
      const recipe = testRecipes[1];
      const { getByTestId } = render(
        <RecipeView
          route={makeRoute('RecipeView', { recipe, scaledFromServings: 2 })}
          navigation={mockNavigation as never}
        />
      );

      expect(getByTestId('RecipeScalingSnackbar')).toBeTruthy();
      expect(getByTestId('RecipeScalingSnackbar::Text').props.children).toBe(
        'servingsScaledNotice'
      );
    });

    test('dismissing the scaling snackbar hides it', () => {
      const recipe = testRecipes[1];
      const { getByTestId, queryByTestId } = render(
        <RecipeView
          route={makeRoute('RecipeView', { recipe, scaledFromServings: 2 })}
          navigation={mockNavigation as never}
        />
      );

      fireEvent.press(getByTestId('RecipeScalingSnackbar::Action'));

      expect(queryByTestId('RecipeScalingSnackbar')).toBeNull();
    });
  });

  describe('app bar back button', () => {
    test('pressing the back button invokes navigation.goBack', async () => {
      const { getByTestId } = await renderRoute(mockRouteReadOnly);
      (mockNavigation.goBack as jest.Mock).mockClear();

      fireEvent.press(getByTestId('Recipe::AppBar::BackButton'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});
