import { Dimensions, StyleSheet } from 'react-native';
import { fireEvent, RenderResult } from '@testing-library/react-native';
import { KeyboardControllerNative, useKeyboardState } from 'react-native-keyboard-controller';
import { AddManuallyProp } from '@customTypes/RecipeNavigationTypes';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import { getAutocompleteMaxListHeight } from '@utils/autocompleteFocusMode';
import { keyboardToolbarCaretClearance } from '@styles/spacing';
import { resetPreventRemove } from '@mocks/deps/react-navigation-mock';
import { mockFindNodeHandle } from '@mocks/deps/react-native-find-node-handle-mock';
import { fakeReadOnlyElement } from '@test-helpers/fakeReadOnlyElement';
import { renderRoute, setupDb, teardownDb } from './recipeTestHelpers';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@utils/ImagePicker', () => require('@mocks/utils/ImagePicker-mock').imagePickerMock());
jest.mock('@utils/OCR', () => require('@mocks/utils/OCR-mock').ocrMock());
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

describe('RecipeForm autocomplete list cap through the real tag input', () => {
  const addManuallyRoute: AddManuallyProp = { mode: 'addManually' };
  const scrollViewId = 'Recipe::ScrollView';
  const tagInputId = 'RecipeTags::List::0';
  const tagViewportId = tagInputId + '::AutocompleteViewport';
  const scrollViewWindowTop = 88;
  const textKeyboardHeight = 299;
  const anchorRect = { top: 900, bottom: 960 };
  const focusedInputRect = { top: 905, bottom: 955 };
  const tagFieldHeight = focusedInputRect.bottom - anchorRect.top;
  const scrollViewElement = fakeReadOnlyElement('ScrollViewWrapper', {
    top: scrollViewWindowTop,
    bottom: 2000,
  });
  const tagAnchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, anchorRect);
  const focusedTagInput = fakeReadOnlyElement('', focusedInputRect, tagAnchor);
  const plainInput = fakeReadOnlyElement('', { top: 200, bottom: 250 });
  const mockedUseKeyboardState = useKeyboardState as jest.Mock;
  const viewPositionInWindow = KeyboardControllerNative.viewPositionInWindow as jest.Mock;
  let findNodeHandleSpy: ReturnType<typeof mockFindNodeHandle>;
  let screen: RenderResult;

  function setKeyboardHeight(height: number) {
    mockedUseKeyboardState.mockImplementation(selector => selector({ height }));
  }

  async function focusScrollViewChild(target: ReturnType<typeof fakeReadOnlyElement>) {
    await fireEvent(screen.getByTestId(scrollViewId), 'focus', {
      target,
      currentTarget: scrollViewElement,
    });
  }

  async function openTagSuggestions() {
    await fireEvent.press(screen.getByTestId('RecipeTags::RoundButton'));
    await fireEvent.changeText(screen.getByTestId(tagInputId + '::CustomTextInput'), 'a');
  }

  function tagListMaxHeight() {
    return StyleSheet.flatten(screen.getByTestId(tagViewportId).props.style).maxHeight;
  }

  function expectedTagListCap(keyboardHeight: number) {
    return getAutocompleteMaxListHeight(
      keyboardToolbarCaretClearance,
      tagFieldHeight,
      scrollViewWindowTop,
      Dimensions.get('window').height,
      keyboardHeight
    );
  }

  beforeEach(async () => {
    resetPreventRemove();
    await setupDb();
    findNodeHandleSpy = mockFindNodeHandle(42);
    viewPositionInWindow.mockResolvedValue({ x: 0, y: scrollViewWindowTop, width: 0, height: 0 });
    setKeyboardHeight(0);
    screen = await renderRoute(addManuallyRoute);
    await fireEvent(screen.getByTestId(scrollViewId), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } },
    });
    await openTagSuggestions();
  });

  afterEach(async () => {
    findNodeHandleSpy.mockRestore();
    setKeyboardHeight(0);
    await teardownDb();
  });

  test('leaves the tag suggestion list uncapped while the keyboard is closed', async () => {
    await focusScrollViewChild(focusedTagInput);

    expect(tagListMaxHeight()).toBeUndefined();
  });

  test('caps the tag suggestion list when the tag field is focused above the open keyboard', async () => {
    setKeyboardHeight(textKeyboardHeight);
    await focusScrollViewChild(focusedTagInput);

    expect(tagListMaxHeight()).toBe(expectedTagListCap(textKeyboardHeight));
  });

  test('drops the tag suggestion list cap when focus moves to a plain input', async () => {
    setKeyboardHeight(textKeyboardHeight);
    await focusScrollViewChild(focusedTagInput);
    expect(tagListMaxHeight()).toBe(expectedTagListCap(textKeyboardHeight));

    await focusScrollViewChild(plainInput);

    expect(tagListMaxHeight()).toBeUndefined();
  });
});
