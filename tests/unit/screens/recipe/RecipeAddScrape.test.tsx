import { fireEvent, waitFor } from '@testing-library/react-native';
import { testIngredients } from '@test-data/ingredientsDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { AddFromScrapeProp } from '@customTypes/RecipeNavigationTypes';
import * as FileGestion from '@utils/FileGestion';

import { renderRoute, setupDb, teardownDb } from './recipeTestHelpers';

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

describe('RecipeAddScrape', () => {
  let dbInstance: ReturnType<typeof RecipeDatabase.getInstance>;

  beforeEach(async () => {
    jest.clearAllMocks();
    dbInstance = await setupDb();
  });

  afterEach(async () => {
    await teardownDb();
  });

  describe('save flow', () => {
    test('calls clearCache after addRecipe in scrape add flow', async () => {
      const addRecipeSpy = jest.spyOn(dbInstance, 'addRecipe');
      const clearCacheMock = FileGestion.clearCache as jest.Mock;

      const scrapedRoute: AddFromScrapeProp = {
        mode: 'addFromScrape',
        sourceUrl: 'https://example.com/test',
        scrapedData: {
          image_Source: 'ordering-test.jpg',
          title: 'Unique Ordering Test Recipe XYZ',
          description: 'A test recipe',
          persons: 4,
          time: 30,
          ingredients: [{ ...testIngredients[0], quantity: '100' }],
          preparation: [{ title: 'Step 1', description: 'Test step' }],
          tags: [],
        },
      };

      const { getByTestId } = await renderRoute(scrapedRoute);

      fireEvent.press(getByTestId('Recipe::BottomActionButton'));

      await waitFor(() => {
        expect(addRecipeSpy).toHaveBeenCalled();
        expect(clearCacheMock).toHaveBeenCalled();
      });

      expect(clearCacheMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        addRecipeSpy.mock.invocationCallOrder[0]!
      );

      addRecipeSpy.mockRestore();
    });
  });
});
