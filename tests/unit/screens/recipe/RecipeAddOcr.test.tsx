import { fireEvent, waitFor } from '@testing-library/react-native';
import RecipeDatabase from '@utils/RecipeDatabase';
import { AddFromPicProp } from '@customTypes/RecipeNavigationTypes';
import { computeOcrFieldStatus } from '@utils/OCR';

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
  mockNavigation,
  renderRoute,
  setupDb,
  teardownDb,
} from './recipeTestHelpers';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

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

  describe('OCR feedback snackbar', () => {
    async function selectImageForTitleTarget(getByTestId: (id: string) => unknown) {
      fireEvent.press(getByTestId('RecipeTitle::OpenModal') as never);
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select') as never);
    }

    test('shows the no-data snackbar when extraction yields empty', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('empty');

      await selectImageForTitleTarget(getByTestId);

      await waitFor(() => {
        expect(getByTestId('Recipe::OcrSnackbar::Text').props.children).toBe('ocrFeedback.noData');
      });
    });

    test('shows the quantity-mismatch snackbar when counts differ', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('mismatch');

      await selectImageForTitleTarget(getByTestId);

      await waitFor(() => {
        expect(getByTestId('Recipe::OcrSnackbar::Text').props.children).toBe(
          'ocrFeedback.quantityMismatch'
        );
      });
    });

    test('shows no snackbar when extraction succeeds', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('success');

      await selectImageForTitleTarget(getByTestId);

      await waitFor(() => expect(queryByTestId('ModalImageSelect')).toBeNull());
      expect(queryByTestId('Recipe::OcrSnackbar')).toBeNull();
    });

    test('dismissing the snackbar hides it', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('empty');

      await selectImageForTitleTarget(getByTestId);

      await waitFor(() => expect(getByTestId('Recipe::OcrSnackbar')).toBeTruthy());

      fireEvent.press(getByTestId('Recipe::OcrSnackbar::Dismiss'));

      await waitFor(() => expect(queryByTestId('Recipe::OcrSnackbar')).toBeNull());
    });
  });

  test('non-empty route imgUri seeds the shared image gallery', async () => {
    const routeWithGalleryImage: AddFromPicProp = {
      mode: 'addFromPic',
      imgUri: '/pre-existing/gallery.jpg',
    };
    const { getByTestId } = await renderRoute(routeWithGalleryImage);

    fireEvent.press(getByTestId('RecipeImage::OpenModal'));

    await waitFor(() => {
      expect(getByTestId('ModalImageSelect::Images').props.children).toBe(
        JSON.stringify(['/pre-existing/gallery.jpg'])
      );
    });
  });

  describe('navigation callbacks', () => {
    test('pressing the back button navigates back', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);

      fireEvent.press(getByTestId('Recipe::AppBar::BackButton'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    test('selecting an image for a non-image target runs OCR extraction and, on success, confirms addAnyway then navigates back', async () => {
      const OCR = require('@utils/OCR');
      (OCR.extractFieldFromImage as jest.Mock).mockResolvedValueOnce({
        recipeImage: '/path/to/cropped/img',
        recipeTitle: 'Wholly Unique OCR Save Flow Recipe',
        recipePersons: 4,
        recipeTime: 30,
        recipePreparation: [{ title: 'Step 1', description: 'Cook pasta until al dente' }],
        recipeIngredients: [{ name: 'Spaghetti', quantity: '100', unit: 'g' }],
      });

      const { getByTestId } = await renderRoute(mockRouteAddOCR);

      fireEvent.press(getByTestId('RecipeTitle::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => {
        expect(OCR.extractFieldFromImage).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe(
          'Wholly Unique OCR Save Flow Recipe'
        );
      });

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe('addAnyway');

      fireEvent.press(getByTestId('Recipe::Alert::OnConfirm'));

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });
});
