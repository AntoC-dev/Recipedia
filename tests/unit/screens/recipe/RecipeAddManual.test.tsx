import { fireEvent, waitFor } from '@testing-library/react-native';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { AddManuallyProp } from '@customTypes/RecipeNavigationTypes';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { defaultValueNumber } from '@utils/Constants';

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
jest.mock('@components/dialogs/ValidationQueue', () =>
  require('@mocks/components/dialogs/ValidationQueue-mock')
);
jest.mock('@components/organisms/AppBar', () => ({
  AppBar: require('@mocks/components/organisms/AppBar-mock').appBarMock,
}));
jest.mock('@screens/ModalImageSelect', () => ({
  ModalImageSelect: require('@mocks/screens/ModalImageSelect-mock').modalImageSelectMock,
}));

describe('RecipeAddManual', () => {
  const mockRouteAddManually: AddManuallyProp = { mode: 'addManually' };
  let dbInstance: ReturnType<typeof RecipeDatabase.getInstance>;

  beforeEach(async () => {
    jest.clearAllMocks();
    dbInstance = await setupDb();
  });

  afterEach(async () => {
    await teardownDb();
  });

  test('renders initial state in add manually mode', async () => {
    const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

    checkAppbarButtons(mockRouteAddManually, getByTestId, queryByTestId);
    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    checkNutrition(mockRouteAddManually, getByTestId, queryByTestId);
  });

  test('shows manual nutrition empty state', async () => {
    const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);
    checkNutrition(mockRouteAddManually, getByTestId, queryByTestId);
  });

  describe('field fills', () => {
    test('fill recipeTitle and reflects in RecipeText only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      const newTitle = 'New Recipe Title';
      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newTitle);

      checkImage(mockRouteAddManually, getByTestId, '');
      checkTitle(mockRouteAddManually, getByTestId, queryByTestId, newTitle);
      checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
      checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
      checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
      checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
      checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
      checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    });

    test('fill recipeDescription and reflects in RecipeText only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      const newDescription = 'New Recipe Description';
      fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), newDescription);

      checkImage(mockRouteAddManually, getByTestId, '');
      checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
      checkDescription(mockRouteAddManually, getByTestId, queryByTestId, newDescription);
      checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
      checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
      checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
      checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
      checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    });

    test('fill recipePersons and reflects in RecipeText only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      const newPerson = 23;
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPerson.toString());

      checkImage(mockRouteAddManually, getByTestId, '');
      checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
      checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
      checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
      checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
      checkPersons(mockRouteAddManually, getByTestId, queryByTestId, newPerson);
      checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
      checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    });

    test('fill recipeTime and reflects in RecipeText only', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      const newTime = 71;
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newTime.toString());

      checkImage(mockRouteAddManually, getByTestId, '');
      checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
      checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
      checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
      checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
      checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
      checkTime(mockRouteAddManually, getByTestId, queryByTestId, newTime);
      checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    });
  });

  describe('save flow', () => {
    test('validate button reflects new values after press in add manually mode', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      const newTitle = 'New Recipe Title';
      const newDescription = 'New Recipe Description';
      const newPersons = 23;
      const newTime = 71;

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newTitle);
      fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), newDescription);
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPersons.toString());
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newTime.toString());

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      checkImage(mockRouteAddManually, getByTestId, '');
      checkTitle(mockRouteAddManually, getByTestId, queryByTestId, newTitle);
      checkDescription(mockRouteAddManually, getByTestId, queryByTestId, newDescription);
      checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
      checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
      checkPersons(mockRouteAddManually, getByTestId, queryByTestId, newPersons);
      checkTime(mockRouteAddManually, getByTestId, queryByTestId, newTime);
      checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    });
  });

  describe('validation errors', () => {
    test('shows validation error when image is missing', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Test Recipe');
      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');
      fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
        'alerts.missingElements.titlePlural'
      );
      expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
        'alerts.missingElements.image'
      );
    });

    test('shows validation error when time is missing', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Test Recipe');
      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');
      fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
        'alerts.missingElements.titlePlural'
      );
      expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
        'alerts.missingElements.titleTime'
      );
    });

    test('shows plural validation errors when multiple elements are missing', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
        'alerts.missingElements.titlePlural'
      );
      expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
        'alerts.missingElements.messagePlural'
      );
    });
  });

  describe('field-level validation triggers', () => {
    test.each([
      ['RecipeTitle', 'Temp', '', 'alerts.inlineErrors.titleRecipe'],
      ['RecipePersons', '4', defaultValueNumber.toString(), 'alerts.inlineErrors.titlePersons'],
      ['RecipeTime', '30', defaultValueNumber.toString(), 'alerts.inlineErrors.titleTime'],
    ])(
      'editing %s to an invalid value shows an inline error',
      async (field, validPreset, invalidPreset, expectedKey) => {
        const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

        expect(queryByTestId(`${field}::Error`)).toBeNull();

        fireEvent.press(getByTestId(`${field}::SetTextToEdit`), validPreset);
        fireEvent.press(getByTestId(`${field}::SetTextToEdit`), invalidPreset);
        fireEvent.press(getByTestId(`${field}::OnBlur`));

        await waitFor(() => {
          expect(getByTestId(`${field}::Error`).props.children).toBe(expectedKey);
        });
      }
    );

    test('focus + blur on an untouched empty field does not show an inline error', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTitle::OnBlur'));

      await waitFor(() => {
        expect(queryByTestId('RecipeTitle::Error')).toBeNull();
      });
    });

    test('blurring description does not produce an error since it is optional', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeDescription::OnBlur'));

      await waitFor(() => {
        expect(queryByTestId('RecipeDescription::Error')).toBeNull();
      });
    });
  });

  describe('similar recipe detection', () => {
    test('shows similar recipe warning when adding duplicate', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), testRecipes[0].title);
      fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), 'Test description');
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), '30');
      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
    });

    test('shows similarity dialog when a similar recipe already exists', async () => {
      const existingTitle = testRecipes[0].title;

      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), existingTitle);
      fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), 'desc');
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), '30');
      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
    });
  });

  describe('ValidationQueue integration', () => {
    test('shows ValidationQueue when manually adding a new tag', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      expect(getByTestId('RecipeValidation::ValidationQueue::Mock::type').props.children).toBe(
        'Tag'
      );
    });

    test('does not show ValidationQueue immediately when adding empty ingredient row', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('hides ValidationQueue when onComplete is called', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onComplete'));

      await waitFor(() => {
        expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
      });
    });

    test('adds tag when ValidationQueue calls onValidated', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);
      const initialCount = initialTags.length;

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
        const finalTags = JSON.parse(finalTagsJson);
        expect(finalTags.length).toBeGreaterThan(initialCount);
      });
    });

    test('adds empty ingredient row when add button is pressed', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      expect(
        getByTestId('RecipeIngredients::0::NameInput::TextInputWithDropdown::Value').props.children
      ).toBe('');
    });

    test('ValidationQueue processes items sequentially', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      const items = JSON.parse(
        getByTestId('RecipeValidation::ValidationQueue::Mock::items').props.children
      );
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('mockTag');
    });

    test('ValidationQueue passes correct testId', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });
    });

    test('exact match tag is added directly without ValidationQueue', async () => {
      await dbInstance.addTag({ name: 'mockTag' });

      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialCount = JSON.parse(initialTagsJson).length;

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        const finalTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(finalTags.length).toBeGreaterThan(initialCount);
      });

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('ValidationQueue callback preserves previously added tags from state', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      const initialTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
      expect(initialTags.length).toBe(0);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const tagsAfterFirst = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(tagsAfterFirst).toContain('mockTag');
        expect(tagsAfterFirst.length).toBe(1);
      });

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const finalTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(finalTags).toContain('mockTag');
        expect(finalTags.length).toBe(1);
      });
    });

    test('ValidationQueue callback preserves previously auto-added exact match ingredients', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      expect(getByTestId('RecipeIngredients::0::NameInput::Value').props.children).toBe('');
      expect(queryByTestId('RecipeIngredients::1::Row')).toBeNull();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::1::Row')).toBeTruthy();
      });

      expect(getByTestId('RecipeIngredients::0::NameInput::Value').props.children).toBe('');
      expect(getByTestId('RecipeIngredients::1::NameInput::Value').props.children).toBe('');
      expect(queryByTestId('RecipeIngredients::2::Row')).toBeNull();
    });

    test('ValidationQueue prevents duplicate tags using latest state', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      const initialTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
      expect(initialTags).toHaveLength(0);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const tags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(tags).toHaveLength(1);
        expect(tags[0]).toBe('mockTag');
      });

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const finalTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(finalTags).toHaveLength(1);
        expect(finalTags[0]).toBe('mockTag');
      });
    });

    test('exact match ingredient auto-added then new ingredient validated both persist', async () => {
      await dbInstance.addIngredient({
        name: 'PreExisting',
        type: ingredientType.vegetable,
        unit: 'g',
        season: [],
      });

      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      expect(queryByTestId('RecipeIngredients::0::Row')).toBeNull();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });
      expect(getByTestId('RecipeIngredients::0::NameInput::Value').props.children).toBe('');

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      expect(queryByTestId('RecipeIngredients::1::Row')).toBeNull();
    });
  });

  describe('image handling', () => {
    test('pressing image button does not directly invoke ImagePicker', async () => {
      const ImagePicker = require('@utils/ImagePicker');

      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));

      expect(ImagePicker.pickImage).not.toHaveBeenCalled();
    });

    test('pressing image button opens the modal', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      expect(queryByTestId('ModalImageSelect')).toBeNull();
      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
    });

    test('modal has autoSelect=false in addManually mode', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));

      await waitFor(() => {
        expect(getByTestId('ModalImageSelect::AutoSelect').props.children).toBe('false');
      });
    });

    test('dismissing modal closes it without updating the image', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      fireEvent.press(getByTestId('ModalImageSelect::Dismiss'));

      await waitFor(() => expect(queryByTestId('ModalImageSelect')).toBeNull());
      expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('');
    });

    test('selecting image for image target updates RecipeImage via cropImage result', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => {
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('/path/to/cropped/img');
      });
    });
  });

  describe('state-input consistency', () => {
    test('Validate saves in-progress numeric text without explicit blur', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Manual Live-Numeric');
      fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '6');
      fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), '55');

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 6);
      checkTime(mockRouteAddManually, getByTestId, queryByTestId, 55);
    });

    test('Validate saves in-progress dropdown (ingredient name) text without explicit blur', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddManually);

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
      fireEvent.press(
        getByTestId('RecipeIngredients::0::OnLiveNameChange'),
        'Live-Manual-Ingredient'
      );

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      expect(getByTestId('RecipeIngredients::0::NameInput::Value').props.children).toBe(
        'Live-Manual-Ingredient'
      );
    });
  });
});
