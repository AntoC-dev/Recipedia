import { fireEvent, waitFor } from '@testing-library/react-native';
import { isPreventRemoveArmed, resetPreventRemove } from '@mocks/deps/react-navigation-mock';
import { AddFromScrapeProp, AddManuallyProp } from '@customTypes/RecipeNavigationTypes';
import { testIngredients } from '@test-data/ingredientsDataset';

import { renderRoute, setupDb, teardownDb } from './recipeTestHelpers';

jest.mock('react-hook-form', () =>
  require('@mocks/deps/react-hook-form-mock').reactHookFormFrozenProviderMock()
);

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

describe('RecipeFormScreen discard guard with a frozen form provider', () => {
  const mockRouteAddManually: AddManuallyProp = { mode: 'addManually' };

  beforeEach(async () => {
    jest.clearAllMocks();
    resetPreventRemove();
    await setupDb();
  });

  afterEach(async () => {
    await teardownDb();
  });

  test('leaves the guard disarmed while the form is pristine', async () => {
    await renderRoute(mockRouteAddManually);

    expect(isPreventRemoveArmed()).toBe(false);
  });

  test('arms the guard when a field is edited', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddManually);

    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Half Typed Recipe');

    await waitFor(() => {
      expect(isPreventRemoveArmed()).toBe(true);
    });
  });
});

describe('RecipeFormScreen discard guard on an imported form', () => {
  const mockRouteAddFromScrape: AddFromScrapeProp = {
    mode: 'addFromScrape',
    sourceUrl: 'https://example.com/guarded-scrape',
    scrapedData: {
      image_Source: 'guarded-scrape.jpg',
      title: 'Wholly Unique Guarded Scrape Recipe',
      description: 'A scraped recipe',
      persons: 4,
      time: 30,
      ingredients: [{ ...testIngredients[0], quantity: '100' }],
      preparation: [{ title: 'Step 1', description: 'Scraped step' }],
      tags: [],
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    resetPreventRemove();
    await setupDb();
  });

  afterEach(async () => {
    await teardownDb();
  });

  test('arms the guard as soon as the scraped recipe is mounted', async () => {
    await renderRoute(mockRouteAddFromScrape);

    await waitFor(() => {
      expect(isPreventRemoveArmed()).toBe(true);
    });
  });
});
