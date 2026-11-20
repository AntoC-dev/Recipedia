import { fireEvent, waitFor } from '@testing-library/react-native';
import { RecipeDatabase } from '@utils/RecipeDatabase';
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
  GetByIdType,
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
    IngredientsOcrButtons: mocks.ingredientsOcrButtonsMock,
  };
});
jest.mock('@components/organisms/RecipePreparation', () => {
  const mocks = require('@mocks/components/organisms/RecipePreparation-mock');
  return {
    RecipePreparation: mocks.recipePreparationMock,
    PreparationSection: mocks.preparationSectionMock,
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

const OCR = jest.requireMock('@utils/OCR');
const ImagePicker = jest.requireMock('@utils/ImagePicker');

describe('RecipeAddOcr', () => {
  const snackbarActionTestId = 'Recipe::OcrSnackbar::Action';
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
    await fireEvent.press(getByTestId('RecipeImage::OpenModal'));
    await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
  });

  test('modal has autoSelect=false in OCR mode', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddOCR);

    await fireEvent.press(getByTestId('RecipeImage::OpenModal'));

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

      await fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      await fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => {
        expect(getByTestId('RecipeImage::ImgUri').props.children).toBe('/path/to/cropped/img');
      });
    });

    test('modal is dismissed after image selection', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);

      await fireEvent.press(getByTestId('RecipeImage::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());

      await fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => expect(queryByTestId('ModalImageSelect')).toBeNull());
    });
  });

  describe('OCR feedback snackbar', () => {
    async function selectImageForTitleTarget(getByTestId: (id: string) => unknown) {
      await fireEvent.press(getByTestId('RecipeTitle::OpenModal') as never);
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      await fireEvent.press(getByTestId('ModalImageSelect::Select') as never);
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

      await fireEvent.press(getByTestId('Recipe::OcrSnackbar::Dismiss'));

      await waitFor(() => expect(queryByTestId('Recipe::OcrSnackbar')).toBeNull());
    });

    test('no-data snackbar has no undo action', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('empty');

      await selectImageForTitleTarget(getByTestId);

      await waitFor(() => expect(getByTestId('Recipe::OcrSnackbar')).toBeTruthy());
      expect(queryByTestId(snackbarActionTestId)).toBeNull();
    });
  });

  describe('OCR scan undo', () => {
    const firstScannedTitle = 'First Scanned Title';
    const secondScannedTitle = 'Second Scanned Title';
    const firstCroppedImage = '/path/to/cropped/img';
    const secondCroppedImage = '/path/to/second/cropped/img';

    async function scanTarget(getByTestId: GetByIdType, openModalTestId: string) {
      await fireEvent.press(getByTestId(openModalTestId));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      await fireEvent.press(getByTestId('ModalImageSelect::Select'));
    }

    async function scanTitle(getByTestId: GetByIdType, scannedTitle: string) {
      (OCR.extractFieldFromImage as jest.Mock).mockResolvedValueOnce({ recipeTitle: scannedTitle });
      await scanTarget(getByTestId, 'RecipeTitle::OpenModal');
      await waitFor(() => expectTitle(getByTestId, scannedTitle));
    }

    async function scanImage(getByTestId: GetByIdType, croppedImage: string) {
      (ImagePicker.cropImage as jest.Mock).mockResolvedValueOnce(croppedImage);
      await scanTarget(getByTestId, 'RecipeImage::OpenModal');
      await waitFor(() => expectImage(getByTestId, croppedImage));
    }

    function expectTitle(getByTestId: GetByIdType, title: string) {
      expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe(title);
    }

    function expectImage(getByTestId: GetByIdType, imageUri: string) {
      expect(getByTestId('RecipeImage::ImgUri').props.children).toBe(imageUri);
    }

    async function expectUndoSnackbar(getByTestId: GetByIdType, message: string) {
      await waitFor(() => {
        expect(getByTestId('Recipe::OcrSnackbar::Text').props.children).toBe(message);
      });
      expect(getByTestId(`${snackbarActionTestId}::Children`).props.children).toBe('undo');
    }

    test('scanning an empty title shows no snackbar', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);

      await scanTitle(getByTestId, firstScannedTitle);

      expect(queryByTestId('Recipe::OcrSnackbar')).toBeNull();
    });

    test('rescanning a filled title shows the replaced snackbar with undo', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);
      await scanTitle(getByTestId, firstScannedTitle);

      await scanTitle(getByTestId, secondScannedTitle);

      await expectUndoSnackbar(getByTestId, 'ocrFeedback.replaced.recipeTitle');
    });

    test('pressing undo restores the title held before the scan', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);
      await scanTitle(getByTestId, firstScannedTitle);
      await scanTitle(getByTestId, secondScannedTitle);
      await expectUndoSnackbar(getByTestId, 'ocrFeedback.replaced.recipeTitle');

      await fireEvent.press(getByTestId(snackbarActionTestId));

      await waitFor(() => expectTitle(getByTestId, firstScannedTitle));
    });

    test('mismatch on a replaced field shows the mismatch message with undo', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);
      await scanTitle(getByTestId, firstScannedTitle);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('mismatch');

      await scanTitle(getByTestId, secondScannedTitle);

      await expectUndoSnackbar(getByTestId, 'ocrFeedback.quantityMismatch');
    });

    test('mismatch without a replaced field shows the mismatch message without undo', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);
      (computeOcrFieldStatus as jest.Mock).mockReturnValueOnce('mismatch');

      await scanTitle(getByTestId, firstScannedTitle);

      await waitFor(() => {
        expect(getByTestId('Recipe::OcrSnackbar::Text').props.children).toBe(
          'ocrFeedback.quantityMismatch'
        );
      });
      expect(queryByTestId(snackbarActionTestId)).toBeNull();
    });

    test('picking the first image shows no snackbar', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);

      await scanImage(getByTestId, firstCroppedImage);

      expect(queryByTestId('Recipe::OcrSnackbar')).toBeNull();
    });

    test('replacing a filled image shows the replaced snackbar and undo restores it', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);
      await scanImage(getByTestId, firstCroppedImage);

      await scanImage(getByTestId, secondCroppedImage);
      await expectUndoSnackbar(getByTestId, 'ocrFeedback.replaced.recipeImage');
      await fireEvent.press(getByTestId(snackbarActionTestId));

      await waitFor(() => expectImage(getByTestId, firstCroppedImage));
    });

    test('picking the same image again shows no snackbar', async () => {
      const { getByTestId, queryByTestId } = await renderRoute(mockRouteAddOCR);
      await scanImage(getByTestId, firstCroppedImage);

      await scanImage(getByTestId, firstCroppedImage);

      expect(queryByTestId('Recipe::OcrSnackbar')).toBeNull();
    });
  });

  test('non-empty route imgUri seeds the shared image gallery', async () => {
    const routeWithGalleryImage: AddFromPicProp = {
      mode: 'addFromPic',
      imgUri: '/pre-existing/gallery.jpg',
    };
    const { getByTestId } = await renderRoute(routeWithGalleryImage);

    await fireEvent.press(getByTestId('RecipeImage::OpenModal'));

    await waitFor(() => {
      expect(getByTestId('ModalImageSelect::Images').props.children).toBe(
        JSON.stringify(['/pre-existing/gallery.jpg'])
      );
    });
  });

  describe('navigation callbacks', () => {
    test('pressing the back button navigates back', async () => {
      const { getByTestId } = await renderRoute(mockRouteAddOCR);

      await fireEvent.press(getByTestId('Recipe::AppBar::BackButton'));

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

      await fireEvent.press(getByTestId('RecipeTitle::OpenModal'));
      await waitFor(() => expect(getByTestId('ModalImageSelect')).toBeTruthy());
      await fireEvent.press(getByTestId('ModalImageSelect::Select'));

      await waitFor(() => {
        expect(OCR.extractFieldFromImage).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(getByTestId('RecipeTitle::TextEditable').props.children).toBe(
          'Wholly Unique OCR Save Flow Recipe'
        );
      });

      await fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
      });
      expect(getByTestId('Recipe::Alert::Title').props.children).toBe('addAnyway');

      await fireEvent.press(getByTestId('Recipe::Alert::OnConfirm'));

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });
});
