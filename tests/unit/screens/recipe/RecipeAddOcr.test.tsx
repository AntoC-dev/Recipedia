import { fireEvent, waitFor } from '@testing-library/react-native';
import RecipeDatabase from '@utils/RecipeDatabase';
import { AddFromPicProp } from '@customTypes/RecipeNavigationTypes';

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
  defaultUri,
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

describe('RecipeAddOcr', () => {
  const mockRouteAddOCR: AddFromPicProp = { mode: 'addFromPic', imgUri: defaultUri };
  let dbInstance: ReturnType<typeof RecipeDatabase.getInstance>;

  beforeEach(async () => {
    jest.clearAllMocks();
    dbInstance = await setupDb();
  });

  afterEach(async () => {
    await teardownDb();
  });

  test('renders initial state in addFromPic mode without looping', async () => {
    const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);

    checkAppbarButtons(mockRouteAddOCR, getByTestId, queryByTestId);
    checkImage(mockRouteAddOCR, getByTestId);
    checkTitle(mockRouteAddOCR, getByTestId, queryByTestId);
    checkDescription(mockRouteAddOCR, getByTestId, queryByTestId);
    checkTags(mockRouteAddOCR, getByTestId, queryByTestId);
    checkIngredients(mockRouteAddOCR, getByTestId, queryByTestId);
    checkPersons(mockRouteAddOCR, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddOCR, getByTestId, queryByTestId);
    checkPreparation(mockRouteAddOCR, getByTestId, queryByTestId);
    checkNutrition(mockRouteAddOCR, getByTestId, queryByTestId);
  });

  test('pressing the image button opens the shared ModalImageSelect', async () => {
    const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);

    expect(queryByTestId('ModalImageSelect')).toBeNull();
    fireEvent.press(getByTestId('RecipeImage::OpenModal'));
    await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
  });

  test('modal has autoSelect=false in OCR mode', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddOCR);

    fireEvent.press(getByTestId('RecipeImage::OpenModal'));

    await waitFor(() => {
      expect(getByTestId('ModalImageSelect::AutoSelect').props.children).toBe('false');
    });
  });

  test('OCR loading overlay is hidden when no extraction is in flight', async () => {
    const { queryByTestId } = await renderRoute(mockRouteAddOCR);

    expect(queryByTestId('RecipeOcrLoading::Overlay')).toBeNull();
  });

  describe('image-target modal select in OCR mode', () => {
    test('selecting from modal for image target updates RecipeImage via cropImage result', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => {
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('/path/to/cropped/img');
      });
    });

    test('modal is dismissed after image selection', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);

      fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => expect(queryByTestId('ModalImageSelect')).toBeNull());
    });
  });
});
