import { act, fireEvent, RenderResult, waitFor, within } from '@testing-library/react-native';
import { KEYBOARD_TOOLBAR_HOST_TYPES, queryAllByHostType } from '@test-helpers/hostQueries';
import { keyboardToolbarCaretClearance, padding } from '@styles/spacing';
import { isPreventRemoveArmed, resetPreventRemove } from '@mocks/deps/react-navigation-mock';
import { AddFromScrapeProp, AddManuallyProp } from '@customTypes/RecipeNavigationTypes';
import { testIngredients } from '@test-data/ingredientsDataset';
import {
  KeyboardControllerNative,
  useKeyboardHandler,
  useKeyboardState,
} from 'react-native-keyboard-controller';
import { AUTOCOMPLETE_ANCHOR_ID } from '@components/molecules/TextInputWithDropDown';
import { ReadOnlyElement } from '@utils/autocompleteFocusMode';
import { mockFindNodeHandle } from '@mocks/deps/react-native-find-node-handle-mock';
import { fakeReadOnlyElement } from '@test-helpers/fakeReadOnlyElement';
import { scrollViewScrollTo } from '@test-helpers/scrollViewScrollTo';

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

    await fireEvent(getByTestId('RecipeTitle::SetTextToEdit'), 'press', 'Half Typed Recipe');

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

describe('RecipeFormScreen keyboard handling', () => {
  const mockRouteAddManually: AddManuallyProp = { mode: 'addManually' };

  beforeEach(async () => {
    jest.clearAllMocks();
    resetPreventRemove();
    await setupDb();
  });

  afterEach(async () => {
    await teardownDb();
  });

  test('renders every form field inside the keyboard-aware scroll view', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddManually);

    const keyboardAwareScrollView = getByTestId('Recipe::ScrollView');
    expect(within(keyboardAwareScrollView).getByTestId('RecipeTitle::SetTextToEdit')).toBeTruthy();
    expect(
      within(keyboardAwareScrollView).getByTestId('Recipe::RecipeNutrition::NutritionEmptyState')
    ).toBeTruthy();
  });

  test('keeps the caret clear of the keyboard before the toolbar is measured', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddManually);

    expect(getByTestId('Recipe::ScrollView').props.bottomOffset).toEqual(
      keyboardToolbarCaretClearance
    );
  });

  test('keeps the caret clear of the measured keyboard toolbar', async () => {
    const measuredToolbarHeight = 57;
    const { container, getByTestId } = await renderRoute(mockRouteAddManually);

    await fireEvent(queryAllByHostType(container, KEYBOARD_TOOLBAR_HOST_TYPES.prev)[0]!, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: measuredToolbarHeight } },
    });

    expect(getByTestId('Recipe::ScrollView').props.bottomOffset).toEqual(
      measuredToolbarHeight + keyboardToolbarCaretClearance
    );
  });

  test('keeps the scroll position when the keyboard hides', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddManually);

    expect(getByTestId('Recipe::ScrollView').props.disableScrollOnKeyboardHide).toBe(true);
  });

  test('offers previous, next and done controls above the keyboard', async () => {
    const { container } = await renderRoute(mockRouteAddManually);

    expect(queryAllByHostType(container, KEYBOARD_TOOLBAR_HOST_TYPES.prev)).toHaveLength(1);
    expect(queryAllByHostType(container, KEYBOARD_TOOLBAR_HOST_TYPES.next)).toHaveLength(1);
    expect(queryAllByHostType(container, KEYBOARD_TOOLBAR_HOST_TYPES.done)[0]!.props.text).toEqual(
      'done'
    );
  });

  test('keeps taps on form controls while the keyboard is open', async () => {
    const { getByTestId } = await renderRoute(mockRouteAddManually);

    expect(getByTestId('Recipe::ScrollView').props.keyboardShouldPersistTaps).toEqual('handled');
  });
});

describe('RecipeFormScreen search-field focus mode', () => {
  const scrollViewWindowTop = 88;
  const numericKeyboardHeight = 255;
  const textKeyboardHeight = 299;
  const mockRouteAddFromScrape: AddFromScrapeProp = {
    mode: 'addFromScrape',
    sourceUrl: 'https://example.com/focus-mode-scrape',
    scrapedData: {
      image_Source: 'focus-mode-scrape.jpg',
      title: 'Wholly Unique Focus Mode Recipe',
      description: 'A scraped recipe',
      persons: 4,
      time: 30,
      ingredients: [{ ...testIngredients[0], quantity: '100' }],
      preparation: [{ title: 'Step 1', description: 'Scraped step' }],
      tags: [],
    },
  };
  const mockedUseKeyboardState = useKeyboardState as jest.Mock;
  const mockedUseKeyboardHandler = useKeyboardHandler as jest.Mock;
  const viewPositionInWindow = KeyboardControllerNative.viewPositionInWindow as jest.Mock;
  const scrollViewElement = fakeReadOnlyElement('ScrollViewWrapper', {
    top: scrollViewWindowTop,
    bottom: 2000,
  });
  const anchorRect = { top: 900, bottom: 960 };
  const autocompleteAnchor = fakeReadOnlyElement(AUTOCOMPLETE_ANCHOR_ID, anchorRect);
  const autocompleteInput = fakeReadOnlyElement('', { top: 905, bottom: 955 }, autocompleteAnchor);
  const plainInput = fakeReadOnlyElement('', { top: 200, bottom: 250 });
  let keyboardEndHandler: ((event: { height: number; duration: number }) => void) | null = null;
  let findNodeHandleSpy: ReturnType<typeof mockFindNodeHandle>;

  function setKeyboardHeight(height: number) {
    mockedUseKeyboardState.mockImplementation(selector => selector({ height }));
  }

  async function renderFocusModeRoute() {
    const rendered = await renderRoute(mockRouteAddFromScrape);
    await fireEvent(rendered.getByTestId('Recipe::ScrollView'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } },
    });
    return rendered;
  }

  async function focus(rendered: RenderResult, target: ReadOnlyElement) {
    await fireEvent(rendered.getByTestId('Recipe::ScrollView'), 'focus', {
      target,
      currentTarget: scrollViewElement,
    });
  }

  async function scrollContentTo(rendered: RenderResult, y: number) {
    await fireEvent.scroll(rendered.getByTestId('Recipe::ScrollView'), {
      nativeEvent: { contentOffset: { x: 0, y } },
    });
  }

  async function keyboardSettles(height: number, duration = 250) {
    await act(async () => keyboardEndHandler!({ height, duration }));
  }

  function bottomOffset(rendered: RenderResult) {
    return rendered.getByTestId('Recipe::ScrollView').props.bottomOffset;
  }

  function scrolledToYs() {
    return scrollViewScrollTo().mock.calls.map(([options]) => options.y);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    resetPreventRemove();
    await setupDb();
    anchorRect.top = 900;
    mockedUseKeyboardHandler.mockImplementation(handler => {
      keyboardEndHandler = handler.onEnd;
    });
    findNodeHandleSpy = mockFindNodeHandle(42);
    viewPositionInWindow.mockResolvedValue({ x: 0, y: scrollViewWindowTop, width: 0, height: 0 });
    setKeyboardHeight(0);
  });

  afterEach(async () => {
    findNodeHandleSpy.mockRestore();
    setKeyboardHeight(0);
    mockedUseKeyboardHandler.mockReset();
    keyboardEndHandler = null;
    await teardownDb();
  });

  test('keeps a constant bottom offset through autocomplete focus and keyboard events', async () => {
    setKeyboardHeight(numericKeyboardHeight);
    const rendered = await renderFocusModeRoute();
    const offsetBeforeFocus = bottomOffset(rendered);

    await focus(rendered, autocompleteInput);
    expect(bottomOffset(rendered)).toBe(offsetBeforeFocus);

    await keyboardSettles(numericKeyboardHeight, 0);
    expect(bottomOffset(rendered)).toBe(offsetBeforeFocus);

    setKeyboardHeight(textKeyboardHeight);
    await focus(rendered, autocompleteInput);
    await keyboardSettles(textKeyboardHeight);
    expect(bottomOffset(rendered)).toBe(offsetBeforeFocus);

    await focus(rendered, plainInput);
    await keyboardSettles(0);
    expect(bottomOffset(rendered)).toBe(keyboardToolbarCaretClearance);
  });

  test('pins the focused autocomplete field once the keyboard has settled', async () => {
    const rendered = await renderFocusModeRoute();
    await scrollContentTo(rendered, 120);

    await focus(rendered, autocompleteInput);
    await keyboardSettles(textKeyboardHeight);

    expect(scrollViewScrollTo()).toHaveBeenCalledWith({
      y: 120 + 900 - scrollViewWindowTop - padding.small,
      animated: true,
    });
  });

  test('re-pins the field after the numeric to text keyboard switch', async () => {
    setKeyboardHeight(numericKeyboardHeight);
    const rendered = await renderFocusModeRoute();
    await focus(rendered, autocompleteInput);
    await keyboardSettles(numericKeyboardHeight, 0);
    const pinnedY = 900 - scrollViewWindowTop - padding.small;
    await scrollContentTo(rendered, pinnedY);
    anchorRect.top = scrollViewWindowTop - 44;
    scrollViewScrollTo().mockClear();

    await keyboardSettles(textKeyboardHeight);

    expect(scrolledToYs()).toEqual([pinnedY - 44 - padding.small]);
  });

  test('does not scroll for a plain input', async () => {
    const rendered = await renderFocusModeRoute();

    await focus(rendered, plainInput);
    await keyboardSettles(textKeyboardHeight);

    expect(scrollViewScrollTo()).not.toHaveBeenCalled();
  });
});
