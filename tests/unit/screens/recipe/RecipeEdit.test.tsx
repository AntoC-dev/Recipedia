import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { EditRecipeProp, RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';
import * as FileGestion from '@utils/FileGestion';

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
  mockNavigation,
  renderRoute,
  runSaveNavigationReducer,
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
jest.mock('@components/dialogs/ValidationQueue', () =>
  require('@mocks/components/dialogs/ValidationQueue-mock')
);
jest.mock('@components/organisms/AppBar', () => ({
  AppBar: require('@mocks/components/organisms/AppBar-mock').appBarMock,
}));
jest.mock('@screens/ModalImageSelect', () => ({
  ModalImageSelect: require('@mocks/screens/ModalImageSelect-mock').modalImageSelectMock,
}));

describe('RecipeEdit', () => {
  let mockRouteEdit: EditRecipeProp;
  let dbInstance: ReturnType<typeof RecipeDatabase.getInstance>;

  beforeEach(async () => {
    jest.clearAllMocks();
    dbInstance = await setupDb();
    mockRouteEdit = { mode: 'edit', recipe: { ...testRecipes[6] } } as EditRecipeProp;
  });

  afterEach(async () => {
    await teardownDb();
  });

  test('renders initial state in edit mode', async () => {
    const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

    checkAppbarButtons(mockRouteEdit, getByTestId, queryByTestId);
    checkImage(mockRouteEdit, getByTestId);
    checkTitle(mockRouteEdit, getByTestId, queryByTestId);
    checkDescription(mockRouteEdit, getByTestId, queryByTestId);
    checkTags(mockRouteEdit, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteEdit, getByTestId, queryByTestId);
    checkPersons(mockRouteEdit, getByTestId, queryByTestId);
    checkTime(mockRouteEdit, getByTestId, queryByTestId);
    checkPreparation(mockRouteEdit, getByTestId, queryByTestId);
    checkNutrition(mockRouteEdit, getByTestId, queryByTestId);
  });

  describe('field updates', () => {
    test('updates recipeTitle and reflects in RecipeText only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const newTitle = 'New Recipe Title';
      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newTitle);
      const newEditProp: EditRecipeProp = { ...mockRouteEdit };
      newEditProp.recipe.title = newTitle;

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkIngredients(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    test('updates recipeDescription and reflects in RecipeDescription only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const newDescription = 'New Recipe Description';
      fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), newDescription);
      const newEditProp: EditRecipeProp = { ...mockRouteEdit };
      newEditProp.recipe.description = newDescription;

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkIngredients(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    test('removes recipeTag and reflects in RecipeTags only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeTags::RemoveTag'));
      const newEditProp: EditRecipeProp = {
        mode: mockRouteEdit.mode,
        recipe: {
          ...mockRouteEdit.recipe,
          tags: mockRouteEdit.recipe.tags.map(tag => ({ ...tag })),
        },
      };
      newEditProp.recipe.tags.splice(0, 1);

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkIngredients(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    test('updates recipePersons and scales ingredients accordingly', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const newPerson = '23';
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPerson);
      const newEditProp: EditRecipeProp = { ...mockRouteEdit };
      newEditProp.recipe.persons = Number(newPerson);

      newEditProp.recipe.ingredients = newEditProp.recipe.ingredients.map(ingredient => ({
        ...ingredient,
        quantity: ingredient.quantity
          ? (() => {
              const scaledValue = (parseFloat(ingredient.quantity) * 23) / 6;
              const rounded = Math.round(scaledValue * 100) / 100;
              return rounded.toString();
            })()
          : ingredient.quantity,
      }));

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkIngredients(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    test('updates recipeIngredients row visibility', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const initialName = getByTestId(
        'RecipeIngredients::0::NameInput::TextInputWithDropdown::Value'
      ).props.children;
      expect(initialName).toBe('Flour');

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      const newEditProp: EditRecipeProp = { ...mockRouteEdit };

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    test('updates recipeTime and reflects in RecipeTime only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const newTime = '71';
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newTime);
      const newEditProp: EditRecipeProp = { ...mockRouteEdit };
      newEditProp.recipe.time = Number(newTime);

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkIngredients(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    test('updates recipePreparation and reflects in RecipePreparation only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const newEditProp: EditRecipeProp = {
        ...mockRouteEdit,
        recipe: {
          ...mockRouteEdit.recipe,
          preparation: [...mockRouteEdit.recipe.preparation],
        },
      };
      newEditProp.recipe.preparation[0].description += '.New part of a paragraph';

      const descriptionInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      fireEvent(descriptionInput, 'endEditing', {
        nativeEvent: { text: newEditProp.recipe.preparation[0].description },
      });

      await waitFor(() => {
        checkPreparation(newEditProp, getByTestId, queryByTestId);
      });

      checkImage(newEditProp, getByTestId);
      checkTitle(newEditProp, getByTestId, queryByTestId);
      checkDescription(newEditProp, getByTestId, queryByTestId);
      checkTags(newEditProp, getByTestId, queryByTestId);
      checkIngredients(newEditProp, getByTestId, queryByTestId);
      checkPersons(newEditProp, getByTestId, queryByTestId);
      checkTime(newEditProp, getByTestId, queryByTestId);
    });
  });

  describe('save flow', () => {
    test('validate button persists edits and replaces to RecipeView', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const newPropEdit: EditRecipeProp = {
        ...mockRouteEdit,
        recipe: {
          image_Source: mockRouteEdit.recipe.image_Source,
          title: 'New Recipe Title',
          description: 'New Recipe Description',
          tags: new Array(mockRouteEdit.recipe.tags[1]),
          persons: 23,
          ingredients: mockRouteEdit.recipe.ingredients.map(ingredient => ({ ...ingredient })),
          time: 71,
          preparation: [...mockRouteEdit.recipe.preparation],
          season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        },
      };

      newPropEdit.recipe.ingredients = newPropEdit.recipe.ingredients.map((ingredient, index) => ({
        ...ingredient,
        quantity:
          index === 0
            ? '766.67'
            : (() => {
                const originalQty = parseFloat(ingredient.quantity as string);
                const scaledQty = Math.round(((originalQty * 23) / 6) * 100) / 100;
                return scaledQty.toString();
              })(),
      }));

      const updatePreparationWith = '.New part of a paragraph';
      newPropEdit.recipe.preparation[0].description += updatePreparationWith;

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newPropEdit.recipe.title);
      fireEvent.press(
        getByTestId('RecipeDescription::SetTextToEdit'),
        newPropEdit.recipe.description
      );
      fireEvent.press(getByTestId('RecipeTags::RemoveTag'));
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPropEdit.recipe.persons);
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newPropEdit.recipe.time);

      const descriptionInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
      );
      fireEvent(descriptionInput, 'endEditing', {
        nativeEvent: { text: newPropEdit.recipe.preparation[0].description },
      });

      await waitFor(() => {
        checkPreparation(newPropEdit, getByTestId, queryByTestId);
      });

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(mockNavigation.dispatch).toHaveBeenCalled();
      });

      expect(runSaveNavigationReducer().savedView.name).toBe('RecipeView');
    });

    test('save rewrites the stack so the stale original RecipeView is dropped', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Stack Rewrite Title');
      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(mockNavigation.dispatch).toHaveBeenCalled();
      });

      const { routes, savedView } = runSaveNavigationReducer();
      expect(routes.map(route => route.name)).toEqual(['Home', 'RecipeView']);
      expect(savedView.name).toBe('RecipeView');
    });

    test('Validate saves in-progress text from text inputs without an explicit blur', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

      const editRoute: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(editRoute);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Live-Commit Title');
      fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), 'Live-Commit Description');

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      const savedRecipe = editRecipeSpy.mock.calls[0][0];
      expect(savedRecipe.title).toBe('Live-Commit Title');
      expect(savedRecipe.description).toBe('Live-Commit Description');

      editRecipeSpy.mockRestore();
    });

    test('scales recipe back to default persons before saving', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

      const editRoute: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(editRoute);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Modified Title');
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '8');

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      const savedRecipe = editRecipeSpy.mock.calls[0][0];
      expect(savedRecipe.title).toBe('Modified Title');
      expect(savedRecipe.persons).toBe(4);
      expect(savedRecipe.ingredients[0].quantity).toBe('200');
      expect(savedRecipe.ingredients[1].quantity).toBe('300');
      expect(savedRecipe.ingredients[2].quantity).toBe('250');
      expect(savedRecipe.ingredients[3].quantity).toBe('50');

      editRecipeSpy.mockRestore();
    });

    test('forwards the entered serving count as scaledFromServings when scaling occurs', async () => {
      const editRoute: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(editRoute);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Modified Title');
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '8');

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(mockNavigation.dispatch).toHaveBeenCalled();
      });

      const { savedView } = runSaveNavigationReducer();
      expect(savedView.name).toBe('RecipeView');
      expect(savedView.params?.scaledFromServings).toBe(8);
    });

    test('omits scaledFromServings when the serving count stays at the default', async () => {
      const editRoute: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(editRoute);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Another Title');
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(mockNavigation.dispatch).toHaveBeenCalled();
      });

      expect(runSaveNavigationReducer().savedView.params?.scaledFromServings).toBeUndefined();
    });

    test('validation passes when all required fields are complete', async () => {
      const completeRoute: EditRecipeProp = {
        mode: 'edit',
        recipe: { ...testRecipes[1], nutrition: undefined },
      };

      const { getByTestId } = await renderRoute(completeRoute);

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(false);
    });

    test('editRecipe is not called when validating unchanged recipe', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');
      const route: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(route);

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(mockNavigation.dispatch).toHaveBeenCalled();
      });
      const { savedView } = runSaveNavigationReducer();
      expect(savedView.name).toBe('RecipeView');
      expect(savedView.params?.recipe).toEqual(expect.any(Object));
      expect(editRecipeSpy).not.toHaveBeenCalled();
      editRecipeSpy.mockRestore();
    });

    test('calls clearCache after editRecipe in edit flow', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');
      const clearCacheMock = FileGestion.clearCache as jest.Mock;

      const route: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };
      const { getByTestId } = await renderRoute(route);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Modified Title For Ordering');
      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
        expect(clearCacheMock).toHaveBeenCalled();
      });

      expect(clearCacheMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        editRecipeSpy.mock.invocationCallOrder[0]
      );

      editRecipeSpy.mockRestore();
    });
  });

  describe('validation errors', () => {
    test('shows validation error when nutrition has zero values in edit mode', async () => {
      const mockRecipeWithNutrition: EditRecipeProp = {
        mode: 'edit',
        recipe: {
          ...testRecipes[1],
          nutrition: {
            energyKcal: defaultValueNumber,
            energyKj: 200,
            fat: 5,
            saturatedFat: 1,
            carbohydrates: 20,
            sugars: 5,
            fiber: 3,
            protein: 10,
            salt: 1,
            portionWeight: 100,
          },
        },
      };

      const { getByTestId } = await renderRoute(mockRecipeWithNutrition);

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
        'alerts.missingElements.titleSingular'
      );
      expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
        'alerts.missingElements.messageSingularNutrition'
      );
    });

    test('edit mode validates comprehensively when image missing', async () => {
      const route: EditRecipeProp = {
        mode: 'edit',
        recipe: { ...testRecipes[1], image_Source: '' },
      };

      const { getByTestId } = await renderRoute(route);

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
        'alerts.missingElements.titleSingular'
      );
      expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
        'alerts.missingElements.image'
      );
    });

    test('shows special nutrition message for single missing nutrition', async () => {
      const route: EditRecipeProp = {
        mode: 'edit',
        recipe: {
          ...testRecipes[1],
          nutrition: {
            energyKcal: defaultValueNumber,
            energyKj: defaultValueNumber,
            fat: defaultValueNumber,
            saturatedFat: defaultValueNumber,
            carbohydrates: defaultValueNumber,
            sugars: defaultValueNumber,
            fiber: defaultValueNumber,
            protein: defaultValueNumber,
            salt: defaultValueNumber,
            portionWeight: defaultValueNumber,
          },
        },
      };

      const { getByTestId } = await renderRoute(route);

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
        'alerts.missingElements.titleSingular'
      );
      expect(getByTestId('Recipe::Alert::Content').props.children).toBe(
        'alerts.missingElements.messageSingularNutrition'
      );
    });
  });

  describe('duplicate prevention', () => {
    test('prevents adding duplicate tag with exact same name', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);
      const initialCount = initialTags.length;

      expect(initialCount).toBeGreaterThan(0);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags).toHaveLength(initialCount);
        },
        { timeout: 1000 }
      );
    });

    test('prevents adding duplicate tag with case insensitive match', async () => {
      const route: RecipePropType = {
        mode: 'edit',
        recipe: { ...testRecipes[6], tags: [{ id: 1, name: 'Dessert' }] },
      };

      const { getByTestId } = await renderRoute(route);

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);

      expect(initialTags).toEqual(['Dessert']);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags).toHaveLength(1);
          expect(finalTags).toEqual(['Dessert']);
        },
        { timeout: 1000 }
      );
    });

    test('prevents adding duplicate ingredient with exact same name', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      const initialCount = mockRouteEdit.recipe.ingredients.length;

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId(`RecipeIngredients::${initialCount}::Row`)).toBeTruthy();
      });

      for (let i = 0; i <= initialCount; i++) {
        expect(getByTestId(`RecipeIngredients::${i}::Row`)).toBeTruthy();
      }
    });

    test('prevents adding duplicate ingredient with case insensitive match', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      const initialCount = mockRouteEdit.recipe.ingredients.length;

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId(`RecipeIngredients::${initialCount}::Row`)).toBeTruthy();
      });

      for (let i = 0; i <= initialCount; i++) {
        expect(getByTestId(`RecipeIngredients::${i}::Row`)).toBeTruthy();
      }
    });

    test('allows editing ingredient to a different value', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      const initialCount = mockRouteEdit.recipe.ingredients.length;
      const initialName = getByTestId(
        'RecipeIngredients::0::NameInput::TextInputWithDropdown::Value'
      ).props.children;
      expect(initialName).toBe('Flour');

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      mockRouteEdit.recipe.ingredients.forEach((_, index) => {
        expect(getByTestId(`RecipeIngredients::${index}::Row`)).toBeTruthy();
      });
      expect(mockRouteEdit.recipe.ingredients).toHaveLength(initialCount);
    });

    test('ValidationQueue handles duplicate ingredients by keeping single row', async () => {
      const route: RecipePropType = {
        mode: 'edit',
        recipe: {
          ...testRecipes[6],
          ingredients: [
            {
              id: 1,
              name: 'mockIngredient',
              type: ingredientType.vegetable,
              unit: 'g',
              quantity: '100',
              season: [],
            },
          ],
        },
      };

      const { getByTestId, queryByTestId } = await renderRoute(route);

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      const initialQty = getByTestId('RecipeIngredients::0::QuantityInput').props.children;
      expect(initialQty).toBe('100');

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('ValidationQueue handles ingredient replacement when units differ', async () => {
      const route: RecipePropType = {
        mode: 'edit',
        recipe: {
          ...testRecipes[6],
          ingredients: [
            {
              id: 1,
              name: 'Tomato',
              type: ingredientType.vegetable,
              unit: 'kg',
              quantity: '1',
              season: [],
            },
          ],
        },
      };

      const { getByTestId, queryByTestId } = await renderRoute(route);

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      const initialUnit = getByTestId('RecipeIngredients::0::UnitInput::CustomTextInput').props
        .children;
      expect(initialUnit).toBe('kg');

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('does not show ValidationQueue for duplicate tags (pre-filtered)', async () => {
      const route: RecipePropType = {
        mode: 'edit',
        recipe: { ...testRecipes[6], tags: [{ id: 1, name: 'mockTag' }] },
      };

      const { getByTestId, queryByTestId } = await renderRoute(route);

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);
      expect(initialTags).toEqual(['mockTag']);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags).toHaveLength(1);
          expect(finalTags).toEqual(['mockTag']);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('cancel flow', () => {
    test('cancel button restores original values and goes back', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Mutated Title');
      expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe('Mutated Title');

      fireEvent.press(getByTestId('Recipe::AppBar::Cancel'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('preparation step commits', () => {
    test('committing a preparation step title updates the step', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      const titleInput = getByTestId(
        'RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput'
      );
      fireEvent(titleInput, 'endEditing', { nativeEvent: { text: 'New First Title' } });

      await waitFor(() => {
        expect(
          getByTestId('RecipePreparation::EditableStep::0::TextInputTitle::CustomTextInput').props
            .value
        ).toBe('New First Title');
      });
    });
  });

  describe('nutrition removal', () => {
    test('tapping remove nutrition persists undefined nutrition on save', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

      const { getByTestId } = await renderRoute(mockRouteEdit);

      expect(getByTestId('Recipe::RecipeNutrition::NutritionTable')).toBeTruthy();

      fireEvent.press(getByTestId('Recipe::RecipeNutrition::NutritionTable::OnRemoveNutrition'));
      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      const saved = editRecipeSpy.mock.calls[0][0];
      expect(saved.nutrition).toBeUndefined();

      editRecipeSpy.mockRestore();
    });

    test('after save the route resets to RecipeView with undefined nutrition', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      expect(getByTestId('Recipe::RecipeNutrition::NutritionTable')).toBeTruthy();

      fireEvent.press(getByTestId('Recipe::RecipeNutrition::NutritionTable::OnRemoveNutrition'));
      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(
        () => {
          expect(mockNavigation.dispatch).toHaveBeenCalled();
        },
        { timeout: 8000 }
      );

      const { savedView } = runSaveNavigationReducer();
      expect(savedView.name).toBe('RecipeView');
      expect(savedView.params?.recipe?.nutrition).toBeUndefined();
    });

    test('removing nutrition then editing an ingredient still persists undefined nutrition', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('Recipe::RecipeNutrition::NutritionTable::OnRemoveNutrition'));

      const firstIngredient = mockRouteEdit.recipe.ingredients[0];
      fireEvent.press(
        getByTestId('RecipeIngredients::0::OnIngredientChange'),
        `${firstIngredient.quantity}::${firstIngredient.unit}::${firstIngredient.name}::a note`
      );

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      const saved = editRecipeSpy.mock.calls[0][0];
      expect(saved.nutrition).toBeUndefined();

      editRecipeSpy.mockRestore();
    });
  });

  describe('image handling', () => {
    test('pressing image button opens the modal', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      expect(queryByTestId('ModalImageSelect')).toBeNull();
      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
    });

    test('modal has autoSelect=true in edit mode', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));

      await waitFor(() => {
        expect(getByTestId('ModalImageSelect::AutoSelect').props.children).toBe('true');
      });
    });

    test('onSelectFunction updates recipeImage', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      expect(getByTestId('RecipeImage::ImgUri').props.children).toBe(
        mockRouteEdit.recipe.image_Source
      );

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => {
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('mock-image-uri');
      });
    });

    test('modal closes after a selection', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => expect(queryByTestId('ModalImageSelect')).toBeNull());
    });

    test('dismissing the modal does not change the image', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteEdit);

      const originalImage = mockRouteEdit.recipe.image_Source;

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      fireEvent.press(getByTestId('ModalImageSelect::Dismiss'));

      await waitFor(() => expect(queryByTestId('ModalImageSelect')).toBeNull());
      expect(getByTestId('RecipeImage::ImgUri').props.children).toBe(originalImage);
    });

    test('onImagesUpdated appends a URI to the modal list', async () => {
      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      const imagesBefore = JSON.parse(getByTestId('ModalImageSelect::Images').props.children);
      expect(imagesBefore).toHaveLength(0);

      fireEvent.press(getByTestId('ModalImageSelect::AddImage'));

      await waitFor(() => {
        const imagesAfter = JSON.parse(getByTestId('ModalImageSelect::Images').props.children);
        expect(imagesAfter).toContain('new-mock-image-uri');
      });
    });

    test('saves new image before clearing cache', async () => {
      const clearCacheMock = FileGestion.clearCache as jest.Mock;
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

      const recipeWithNoImage: EditRecipeProp = {
        mode: 'edit',
        recipe: { ...testRecipes[1], image_Source: '' },
      };
      const { getByTestId } = await renderRoute(recipeWithNoImage);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select'));
      await waitFor(() =>
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('mock-image-uri')
      );

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => expect(editRecipeSpy).toHaveBeenCalled());

      const editCallOrder = editRecipeSpy.mock.invocationCallOrder[0];
      const clearCacheCallOrder = clearCacheMock.mock.invocationCallOrder[0];
      expect(editCallOrder).toBeLessThan(clearCacheCallOrder);

      editRecipeSpy.mockRestore();
    });

    test('editRecipe is called when the image changes', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');
      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select'));
      await waitFor(() =>
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('mock-image-uri')
      );

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => expect(editRecipeSpy).toHaveBeenCalled());
      editRecipeSpy.mockRestore();
    });

    test('editRecipe is not called when validating an unchanged recipe', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');
      const route: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };
      const { getByTestId } = await renderRoute(route);

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => expect(mockNavigation.dispatch).toHaveBeenCalled());
      expect(editRecipeSpy).not.toHaveBeenCalled();
      editRecipeSpy.mockRestore();
    });

    test('displays permanent image URI after editing with a temporary image', async () => {
      const { isTemporaryImageUri } = require('@utils/FileGestion');
      (isTemporaryImageUri as jest.Mock).mockImplementation(
        (uri: string) => uri === 'mock-image-uri'
      );
      const permanentUri = '/mock/directory/saved_image.jpg';

      const recipeWithNoImage: EditRecipeProp = {
        mode: 'edit',
        recipe: { ...testRecipes[1], image_Source: '' },
      };
      const { getByTestId } = await renderRoute(recipeWithNoImage);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select'));
      await waitFor(() =>
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('mock-image-uri')
      );

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe(permanentUri);
      });

      (isTemporaryImageUri as jest.Mock).mockReturnValue(false);
    });

    test('editValidation does not crash when editRecipe throws', async () => {
      const editRecipeSpy = jest
        .spyOn(dbInstance, 'editRecipe')
        .mockRejectedValue(new Error('DB error'));
      const { getByTestId } = await renderRoute(mockRouteEdit);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select'));
      await waitFor(() =>
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('mock-image-uri')
      );

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      expect(mockNavigation.dispatch).not.toHaveBeenCalled();

      editRecipeSpy.mockRestore();
    });

    test('calls clearCache after editRecipe', async () => {
      const clearCacheMock = FileGestion.clearCache as jest.Mock;
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

      const { getByTestId } = await renderRoute({
        mode: 'edit',
        recipe: { ...testRecipes[0] },
      });

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Modified Title For Ordering');
      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
        expect(clearCacheMock).toHaveBeenCalled();
      });

      expect(clearCacheMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        editRecipeSpy.mock.invocationCallOrder[0]
      );

      editRecipeSpy.mockRestore();
    });
  });

  describe('state-input consistency', () => {
    test('Validate saves in-progress numeric text without explicit blur', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');
      const editRoute: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(editRoute);

      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '7');
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), '42');

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      const savedRecipe = editRecipeSpy.mock.calls[0][0];
      expect(savedRecipe.time).toBe(42);

      editRecipeSpy.mockRestore();
    });

    test('Validate saves in-progress dropdown (ingredient name) text without explicit blur', async () => {
      const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');
      const editRoute: EditRecipeProp = { mode: 'edit', recipe: { ...testRecipes[0] } };

      const { getByTestId } = await renderRoute(editRoute);

      fireEvent.press(
        getByTestId('RecipeIngredients::0::OnLiveNameChange'),
        'Live-Commit Ingredient'
      );

      fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

      await waitFor(() => {
        expect(editRecipeSpy).toHaveBeenCalled();
      });

      const savedRecipe = editRecipeSpy.mock.calls[0][0];
      expect(savedRecipe.ingredients[0].name).toBe('Live-Commit Ingredient');

      editRecipeSpy.mockRestore();
    });
  });

  describe('copilot tutorial integration', () => {
    test('mounts inside a CopilotProvider wrapper without crashing', async () => {
      const { CopilotProvider } = require('react-native-copilot');
      const { render } = require('@testing-library/react-native');
      const RecipeEdit = require('@screens/recipe/RecipeEdit').default;
      const recipe = { ...testRecipes[6] };

      const tree = render(
        <CopilotProvider>
          <RecipeEdit
            route={{ key: 'k', name: 'RecipeEdit', params: { recipe } }}
            navigation={mockNavigation}
          />
        </CopilotProvider>
      );

      await waitFor(() => {
        expect(tree.getByTestId('Recipe::AppBar::Cancel')).toBeTruthy();
      });
      expect(tree.getByTestId('CopilotProvider')).toBeTruthy();
    });
  });
});
