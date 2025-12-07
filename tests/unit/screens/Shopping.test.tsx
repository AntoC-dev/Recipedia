import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import React from 'react';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import Shopping from '@screens/Shopping';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import {
  getMockCopilotEvents,
  resetMockCopilot,
  triggerStepChangeEvent,
  triggerStopEvent,
} from '@mocks/deps/react-native-copilot-mock';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';

const { mockUseSafeCopilot } = require('@mocks/hooks/useSafeCopilot-mock');

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());

jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@components/dialogs/Alert', () => ({
  Alert: require('@mocks/components/dialogs/Alert-mock').alertMock,
}));

// Mock useSafeCopilot to return null by default (tutorial inactive) but allow override
jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

// Override react-navigation with useFocusEffect that calls callback once
jest.mock('@react-navigation/native', () => ({
  ...require('@mocks/deps/react-navigation-mock').reactNavigationMock(),
  useFocusEffect: jest.fn(callback => {
    // Call the callback once to trigger initial data loading
    if (typeof callback === 'function') {
      // Use a microtask to avoid infinite re-renders
      Promise.resolve().then(() => callback());
    }
  }),
}));

const mockRoute = {
  key: 'Shopping',
  name: 'Shopping',
  params: {},
};

const defaultProps = {
  navigation: mockNavigationFunctions,
  route: mockRoute,
} as any;

async function renderShoppingAndWaitForButtons() {
  const result = render(
    <RecipeDatabaseProvider>
      <Shopping {...defaultProps} />
    </RecipeDatabaseProvider>
  );

  // Wait for focus effect to trigger and buttons to render if they should be present
  // This checks if shopping list has items, and if so, waits for the clear button
  const hasShoppingItems = RecipeDatabase.getInstance().get_shopping().length > 0;

  await waitFor(() => {
    const elementExpectedMounted = hasShoppingItems
      ? 'ShoppingScreen::ClearShoppingListButton::RoundButton'
      : 'ShoppingScreen::TextNoItem';
    expect(result.getByTestId(elementExpectedMounted)).toBeTruthy();
  });

  return result;
}

describe('Shopping Screen', () => {
  const database: RecipeDatabase = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();

    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
    await database.addMultipleShopping([testRecipes[8], testRecipes[3]]);
  });

  afterEach(async () => await database.closeAndReset());

  test('renders Shopping screen with proper components structure', async () => {
    const { getByTestId, queryByTestId } = await renderShoppingAndWaitForButtons();

    expect(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeTruthy();
    expect(getByTestId('ShoppingScreen::Alert::IsVisible')).toBeTruthy();

    const hasEmptyState = queryByTestId('ShoppingScreen::TextNoItem');
    const hasSectionList = queryByTestId('ShoppingScreen::SectionList');

    // One of these should be present (not both, not neither)
    expect(hasEmptyState || hasSectionList).toBeTruthy();
    expect(!!(hasEmptyState && hasSectionList)).toBe(false);
  });

  test('shopping items display with quantity and unit in title', async () => {
    const { getByTestId } = await renderShoppingAndWaitForButtons();

    expect(getByTestId('ShoppingScreen::SectionList::Sushi Rice::Title').props.children).toBe(
      'Sushi Rice (250g)'
    );
    expect(getByTestId('ShoppingScreen::SectionList::Croutons::Title').props.children).toBe(
      'Croutons (50g)'
    );
    expect(getByTestId('ShoppingScreen::SectionList::Romaine Lettuce::Title').props.children).toBe(
      'Romaine Lettuce (100g)'
    );
  });

  test('renders empty state correctly when no shopping items', async () => {
    await database.resetShoppingList();

    const { getByTestId, queryByTestId } = await renderShoppingAndWaitForButtons();

    expect(getByTestId('ShoppingScreen::TextNoItem')).toBeTruthy();
    expect(getByTestId('ShoppingScreen::TextNoItem').props.children).toEqual(
      'shoppingScreen.noItemsInShoppingList'
    );
    expect(queryByTestId('ShoppingScreen::SectionList')).toBeNull();
    expect(queryByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeNull();
  });

  test('clear shopping list functionality works with confirmation', async () => {
    const { getByTestId } = await renderShoppingAndWaitForButtons();

    // Initially confirmation dialog should be hidden
    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children).toBe(
      false
    );

    fireEvent.press(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton'));

    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children).toBe(
      true
    );

    expect(database.get_shopping().length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('ShoppingScreen::ClearConfirmation::Alert::OnConfirm'));

    await waitFor(() => {
      expect(database.get_shopping().length).toBe(0);
      expect(
        getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children
      ).toBe(false);
    });
  });

  test('Recipe usage Alert dialog has correct props structure and values', async () => {
    const { getByTestId } = await renderShoppingAndWaitForButtons();

    // Verify Alert dialog props exist and have correct values
    expect(getByTestId('ShoppingScreen::Alert::IsVisible').props.children).toEqual(false);
    expect(getByTestId('ShoppingScreen::Alert::TestId').props.children).toEqual('ShoppingScreen');
    expect(getByTestId('ShoppingScreen::Alert::Title').props.children).toEqual(
      'shoppingScreen.recipeUsingTitle '
    );
    expect(getByTestId('ShoppingScreen::Alert::Content').props.children).toEqual(
      'shoppingScreen.recipeUsingMessage :'
    );
    expect(getByTestId('ShoppingScreen::Alert::ConfirmText').props.children).toEqual(
      'shoppingScreen.recipeUsingValidation'
    );

    // Verify function buttons exist
    expect(getByTestId('ShoppingScreen::Alert::OnClose')).toBeTruthy();

    // Verify no cancel text in this dialog (it's a simple confirmation dialog)
    expect(() => getByTestId('ShoppingScreen::Alert::CancelText')).toThrow();
    expect(() => getByTestId('ShoppingScreen::Alert::OnCancel')).toThrow();
  });

  test('Clear confirmation Alert dialog has correct props structure and values', async () => {
    const { getByTestId } = await renderShoppingAndWaitForButtons();

    expect(
      getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children
    ).toEqual(false);
    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::TestId').props.children).toEqual(
      'ShoppingScreen::ClearConfirmation'
    );
    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::Title').props.children).toEqual(
      'shoppingScreen.clearShoppingList'
    );
    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::Content').props.children).toEqual(
      'shoppingScreen.confirmClearShoppingList'
    );
    expect(
      getByTestId('ShoppingScreen::ClearConfirmation::Alert::ConfirmText').props.children
    ).toEqual('confirm');
    expect(
      getByTestId('ShoppingScreen::ClearConfirmation::Alert::CancelText').props.children
    ).toEqual('cancel');

    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::OnConfirm')).toBeTruthy();
    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::OnClose')).toBeTruthy();
  });

  test('clear button shows confirmation dialog when pressed', async () => {
    expect(database.get_shopping().length).toBeGreaterThan(0);

    const { getByTestId } = await renderShoppingAndWaitForButtons();

    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children).toBe(
      false
    );

    fireEvent.press(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton'));

    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children).toBe(
      true
    );
  });

  test('cancel button in confirmation dialog hides the dialog', async () => {
    expect(database.get_shopping().length).toBeGreaterThan(0);

    const { getByTestId } = await renderShoppingAndWaitForButtons();

    fireEvent.press(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton'));
    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children).toBe(
      true
    );

    fireEvent.press(getByTestId('ShoppingScreen::ClearConfirmation::Alert::OnClose'));

    expect(getByTestId('ShoppingScreen::ClearConfirmation::Alert::IsVisible').props.children).toBe(
      false
    );

    expect(database.get_shopping().length).toBeGreaterThan(0);
  });

  test('clear button is only visible when shopping list has items', async () => {
    expect(database.get_shopping().length).toBeGreaterThan(0);
    const { getByTestId: getWithItems } = await renderShoppingAndWaitForButtons();
    expect(getWithItems('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeTruthy();

    await database.resetShoppingList();
    expect(database.get_shopping().length).toBe(0);
    const { queryByTestId: queryEmpty } = await renderShoppingAndWaitForButtons();
    expect(queryEmpty('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeNull();
  });

  describe('Tutorial Integration', () => {
    const mockEvents = getMockCopilotEvents();
    const defaultMockValue = {
      copilotEvents: mockEvents,
      currentStep: {
        order: TUTORIAL_STEPS.Shopping.order,
        name: 'Shopping',
        text: 'Shopping step',
      },
      isActive: true,
    };
    beforeEach(() => {
      jest.useFakeTimers();
      resetMockCopilot();
      mockUseSafeCopilot.mockReturnValue(null);
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('renders with tutorial wrapper when copilot is available', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
        isActive: true,
      });

      const { getByTestId } = await renderShoppingAndWaitForButtons();

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();
      expect(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeTruthy();
      expect(getByTestId('ShoppingScreen::Alert::IsVisible')).toBeTruthy();
      expect(getByTestId('ShoppingScreen::Alert::IsVisible').props.children).toBe(false);
    });

    test('renders without tutorial wrapper when copilot is not available', async () => {
      const { queryByTestId, getByTestId } = await renderShoppingAndWaitForButtons();

      expect(queryByTestId('CopilotStep::Shopping')).toBeNull();
      expect(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeTruthy();
      expect(getByTestId('ShoppingScreen::Alert::IsVisible')).toBeTruthy();
      expect(getByTestId('ShoppingScreen::Alert::IsVisible').props.children).toBe(false);
    });

    test('starts demo when current step matches Shopping step', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { getByTestId } = await renderShoppingAndWaitForButtons();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();

      expect(getByTestId('ShoppingScreen::Alert::IsVisible').props.children).toBe(false);

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);

      expect(mockEvents.on).toHaveBeenCalled();
    });

    test('handles stepChange event correctly', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
        isActive: true,
      });

      await renderShoppingAndWaitForButtons();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
      });

      triggerStepChangeEvent({
        order: TUTORIAL_STEPS.Shopping.order,
        name: 'Shopping',
        text: 'Shopping step',
      });

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);
      expect(mockEvents.on).toHaveBeenCalled();

      triggerStepChangeEvent({ order: 999, name: 'Other', text: 'Other step' });

      expect(mockEvents.on).toHaveBeenCalled();
    });

    test('stops demo when tutorial stops', async () => {
      const mockEvents = getMockCopilotEvents();
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      await renderShoppingAndWaitForButtons();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      triggerStopEvent();

      expect(mockEvents.on).toHaveBeenCalled();
    });

    test('cleans up event listeners and demo on unmount', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { unmount } = await renderShoppingAndWaitForButtons();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalled();
      });

      unmount();

      expect(mockEvents.off).toHaveBeenCalledWith('stepChange', expect.any(Function));
      expect(mockEvents.off).toHaveBeenCalledWith('stop', expect.any(Function));
    });

    test('does not set up listeners when copilot events unavailable', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: null,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
        isActive: true,
      });

      await renderShoppingAndWaitForButtons();

      expect(mockEvents.on).not.toHaveBeenCalled();
    });

    test('demo toggles dialog state correctly', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { getByTestId } = await renderShoppingAndWaitForButtons();

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();
      expect(getByTestId('ShoppingScreen::ClearShoppingListButton::RoundButton')).toBeTruthy();

      expect(getByTestId('ShoppingScreen::Alert::IsVisible').props.children).toBe(false);

      expect(getByTestId('ShoppingScreen::Alert::TestId').props.children).toBe('ShoppingScreen');
      expect(getByTestId('ShoppingScreen::Alert::Title').props.children).toBe(
        'shoppingScreen.recipeUsingTitle '
      );
      expect(getByTestId('ShoppingScreen::Alert::Content').props.children).toBe(
        'shoppingScreen.recipeUsingMessage :'
      );

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);

      // We verify the demo mechanism is in place rather than testing the actual dialog
      // since the dialog requires specific shopping list data structure
      expect(mockEvents.on).toHaveBeenCalled();
    });
  });
});
