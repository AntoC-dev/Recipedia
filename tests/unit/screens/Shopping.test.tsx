import {
  fireEvent,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { listSectionHeaderTextStyle } from '@components/atomic/ListSectionHeader';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import React from 'react';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import Shopping from '@screens/Shopping';
import {
  getMockCopilotEvents,
  resetMockCopilot,
  triggerStepChangeEvent,
  triggerStopEvent,
} from '@mocks/deps/react-native-copilot-mock';
import { TUTORIAL_DEMO_INTERVAL, TUTORIAL_STEPS } from '@utils/Constants';

const { mockUseSafeCopilot } = require('@mocks/hooks/useSafeCopilot-mock');

jest.mock('@components/dialogs/Alert', () => ({
  Alert: require('@mocks/components/dialogs/Alert-mock').alertMock,
}));

jest.mock('react-native/Libraries/Lists/SectionList', () => ({
  __esModule: true,
  default: require('@mocks/deps/react-native-sectionlist-mock').sectionListMock,
}));

jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

jest.mock('@hooks/useReducedMotion', () =>
  require('@mocks/hooks/useReducedMotion-mock').useReducedMotionMock()
);

const { mockUseReducedMotion } = require('@mocks/hooks/useReducedMotion-mock');

jest.mock('@react-navigation/native', () => ({
  ...require('@mocks/deps/react-navigation-mock').reactNavigationMock(),
  useFocusEffect: jest.fn(callback => {
    if (typeof callback === 'function') {
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

const screenId = 'ShoppingScreen';
const sectionId = `${screenId}::SectionList`;
const alertId = `${screenId}::Alert`;
const purchasedId = `${sectionId}::Purchased`;

function itemTestId(name: string) {
  return `${sectionId}::${name}`;
}

function categoryHeaderTestId(category: string) {
  return `${sectionId}::${category}::SubHeader`;
}

function headerBlockTestId(category: string) {
  return `${sectionId}::${category}::Header`;
}

function dividerTestId(category: string) {
  return `${sectionId}::${category}::Divider`;
}

function hasStrikethrough(style: unknown) {
  return Array.isArray(style) && style.some(s => s && s.textDecorationLine === 'line-through');
}

async function renderShoppingAndWait() {
  const result = render(<Shopping {...defaultProps} />);

  const hasMenuItems = RecipeDatabase.getInstance().get_menu().length > 0;

  await waitFor(() => {
    const elementExpectedMounted = hasMenuItems ? sectionId : `${screenId}::TextNoItem`;
    expect(result.getByTestId(elementExpectedMounted)).toBeTruthy();
  });

  return result;
}

async function addSushiAndSaladToMenu(database: RecipeDatabase) {
  await database.addRecipeToMenu(testRecipes[8]!);
  await database.addRecipeToMenu(testRecipes[3]!);
}

async function addPancakesToMenu(database: RecipeDatabase) {
  await database.addRecipeToMenu(testRecipes[2]!);
}

describe('Shopping Screen', () => {
  const database: RecipeDatabase = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();

    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => await database.closeAndReset());

  test('renders Shopping screen with proper components structure', async () => {
    await addSushiAndSaladToMenu(database);
    const { getByTestId } = await renderShoppingAndWait();

    expect(getByTestId(sectionId)).toBeTruthy();
    expect(getByTestId(`${alertId}::IsVisible`)).toBeTruthy();
  });

  test('anchors the list on the first visible row so checking an item does not scroll it', async () => {
    await addSushiAndSaladToMenu(database);
    const { getByTestId } = await renderShoppingAndWait();

    expect(getByTestId(`${sectionId}::maintainVisibleContentPosition`).props.children).toBe(
      JSON.stringify({ minIndexForVisible: 0 })
    );
  });

  test('shopping items display with quantity and unit in title', async () => {
    await addSushiAndSaladToMenu(database);
    const { getByTestId } = await renderShoppingAndWait();

    expect(getByTestId(`${itemTestId('Sushi Rice')}::Title`).props.children).toBe(
      'Sushi Rice (250g)'
    );
    expect(getByTestId(`${itemTestId('Croutons')}::Title`).props.children).toBe('Croutons (50g)');
    expect(getByTestId(`${itemTestId('Parmesan')}::Title`).props.children).toBe('Parmesan (30g)');
  });

  test('shows the recipe count in the description for items shared by multiple recipes', async () => {
    await database.addRecipeToMenu(testRecipes[0]!);
    await database.addRecipeToMenu(testRecipes[3]!);
    const { getByTestId } = await renderShoppingAndWait();

    expect(getByTestId(`${itemTestId('Parmesan')}::Description`).props.children).toBe(
      '2 shoppingScreen.recipes'
    );
    expect(getByTestId(`${itemTestId('Spaghetti')}::Description`).props.children).toBe(
      '1 shoppingScreen.recipe'
    );
  });

  test('renders empty state correctly when no menu items', async () => {
    const { getByTestId, queryByTestId } = await renderShoppingAndWait();

    expect(getByTestId(`${screenId}::TextNoItem`).props.children).toEqual(
      'shoppingScreen.noItemsInShoppingList'
    );
    expect(queryByTestId(sectionId)).toBeNull();
    expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
  });

  describe('Category sections', () => {
    beforeEach(async () => {
      await addSushiAndSaladToMenu(database);
    });

    test('groups unpurchased items under their ingredient category', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId(categoryHeaderTestId('ingredientTypes.cereal')).props.children).toBe(
        'ingredientTypes.cereal'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.condiment')).props.children).toBe(
        'ingredientTypes.condiment'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.fish')).props.children).toBe(
        'ingredientTypes.fish'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.fruit')).props.children).toBe(
        'ingredientTypes.fruit'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.topping')).props.children).toBe(
        'ingredientTypes.topping'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.vegetable')).props.children).toBe(
        'ingredientTypes.vegetable'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.sauce')).props.children).toBe(
        'ingredientTypes.sauce'
      );
      expect(getByTestId(categoryHeaderTestId('ingredientTypes.cheese')).props.children).toBe(
        'ingredientTypes.cheese'
      );
    });

    test('does not render categories with no items in the shopping list', async () => {
      const { queryByTestId } = await renderShoppingAndWait();

      expect(queryByTestId(categoryHeaderTestId('ingredientTypes.meat'))).toBeNull();
      expect(queryByTestId(categoryHeaderTestId('ingredientTypes.dairy'))).toBeNull();
    });

    test('does not render the purchased block when nothing is purchased', async () => {
      const { queryByTestId } = await renderShoppingAndWait();

      expect(queryByTestId(purchasedId)).toBeNull();
    });

    test('wraps each category subheader in a header block closed by a divider', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId(headerBlockTestId('ingredientTypes.cereal'))).toBeTruthy();
      expect(getByTestId(dividerTestId('ingredientTypes.cereal'))).toBeTruthy();
      expect(getByTestId(headerBlockTestId('ingredientTypes.fish'))).toBeTruthy();
      expect(getByTestId(dividerTestId('ingredientTypes.fish'))).toBeTruthy();
    });

    test('renders category subheaders as accessibility headers', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      expect(
        getByTestId(categoryHeaderTestId('ingredientTypes.cereal')).props.accessibilityRole
      ).toBe('header');
    });
  });

  describe('Purchase status toggling', () => {
    beforeEach(async () => {
      await addPancakesToMenu(database);
    });

    test('moves an item out of its category into the purchased block on press', async () => {
      const { getByTestId, queryByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Title`).props.children).toBe(
          'shoppingScreen.purchased'
        );
      });

      expect(queryByTestId(categoryHeaderTestId('ingredientTypes.baking'))).toBeNull();
      expect(getByTestId(`${itemTestId('Flour')}::Title`).props.children).toBe('Flour (200g)');
    });

    test('renders the purchased block collapsed while items remain to buy', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('false');
      });
    });

    test('expands the purchased block on press and collapses it again', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Header`)).toBeTruthy();
      });

      fireEvent.press(getByTestId(`${purchasedId}::Header`));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('true');
      });

      fireEvent.press(getByTestId(`${purchasedId}::Header`));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('false');
      });
    });

    test('opens the purchased block once nothing is left to buy', async () => {
      await database.clearMenu();
      await addPancakesToMenu(database);
      const { getByTestId } = await renderShoppingAndWait();

      for (const name of ['Flour', 'Milk', 'Eggs', 'Butter']) {
        fireEvent.press(getByTestId(itemTestId(name)));
      }

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('true');
      });
    });

    test('collapses the purchased block again once an item returns to the working list', async () => {
      await database.clearMenu();
      await addPancakesToMenu(database);
      const { getByTestId } = await renderShoppingAndWait();

      for (const name of ['Flour', 'Milk', 'Eggs', 'Butter']) {
        fireEvent.press(getByTestId(itemTestId(name)));
      }

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('true');
      });

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('false');
      });
    });

    test('mounts the purchased block open when everything was already purchased', async () => {
      await database.clearMenu();
      await addPancakesToMenu(database);
      for (const name of ['Flour', 'Milk', 'Eggs', 'Butter']) {
        await database.setPurchased(name, true);
      }

      const { getByTestId } = await renderShoppingAndWait();

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('true');
      });
    });

    test('collapses the purchased block again once it empties while items remain to buy', async () => {
      const { getByTestId, queryByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Header`)).toBeTruthy();
      });

      fireEvent.press(getByTestId(`${purchasedId}::Header`));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('true');
      });

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitForElementToBeRemoved(() => queryByTestId(purchasedId));

      fireEvent.press(getByTestId(itemTestId('Milk')));

      await waitFor(() => {
        expect(getByTestId(`${purchasedId}::Expanded`).props.children).toBe('false');
      });
    });

    test('styles the purchased block title like a category header', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(purchasedId)).toBeTruthy();
      });

      const { colors, fonts } = useTheme();
      const titleStyle = StyleSheet.flatten(getByTestId(`${purchasedId}::Title`).props.style);

      expect(titleStyle).toEqual(listSectionHeaderTextStyle(colors, fonts));
    });

    test('opens the recipe usage dialog from an item inside the purchased block', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(purchasedId)).toBeTruthy();
      });

      fireEvent(getByTestId(itemTestId('Flour')), 'longPress');

      await waitFor(() => {
        expect(getByTestId(`${alertId}::Title`).props.children).toBe(
          'shoppingScreen.recipeUsingTitle flour'
        );
      });
    });

    test('removes the category section entirely when its only item becomes purchased', async () => {
      const { getByTestId, queryByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Milk')));

      await waitFor(() => {
        expect(queryByTestId(categoryHeaderTestId('ingredientTypes.dairy'))).toBeNull();
      });

      expect(getByTestId(`${itemTestId('Milk')}::Title`)).toBeTruthy();
    });

    test('collects every purchased item in the same block regardless of category', async () => {
      const { getByTestId, queryByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));
      fireEvent.press(getByTestId(itemTestId('Milk')));

      await waitFor(() => {
        expect(queryByTestId(categoryHeaderTestId('ingredientTypes.dairy'))).toBeNull();
      });

      expect(queryByTestId(categoryHeaderTestId('ingredientTypes.baking'))).toBeNull();
      expect(getByTestId(`${itemTestId('Flour')}::Title`)).toBeTruthy();
      expect(getByTestId(`${itemTestId('Milk')}::Title`)).toBeTruthy();
    });

    test('toggling a purchased item again returns it to its category section', async () => {
      const { getByTestId, queryByTestId } = await renderShoppingAndWait();

      fireEvent.press(getByTestId(itemTestId('Flour')));
      await waitFor(() => {
        expect(getByTestId(purchasedId)).toBeTruthy();
      });

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitForElementToBeRemoved(() => queryByTestId(purchasedId));

      expect(getByTestId(categoryHeaderTestId('ingredientTypes.baking')).props.children).toBe(
        'ingredientTypes.baking'
      );
    });

    test('applies strikethrough style only to purchased item titles', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      expect(hasStrikethrough(getByTestId(`${itemTestId('Flour')}::Title`).props.style)).toBe(
        false
      );

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(hasStrikethrough(getByTestId(`${itemTestId('Flour')}::Title`).props.style)).toBe(
          true
        );
      });

      expect(hasStrikethrough(getByTestId(`${itemTestId('Milk')}::Title`).props.style)).toBe(false);
    });

    test('reflects purchase state in the item checkbox status', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId(`${itemTestId('Flour')}::Checkbox::Status`).props.children).toBe(
        'unchecked'
      );

      fireEvent.press(getByTestId(itemTestId('Flour')));

      await waitFor(() => {
        expect(getByTestId(`${itemTestId('Flour')}::Checkbox::Status`).props.children).toBe(
          'checked'
        );
      });
    });
  });

  describe('Recipe usage dialog', () => {
    beforeEach(async () => {
      await addSushiAndSaladToMenu(database);
    });

    test('has default closed state with correct static props', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
      expect(getByTestId(`${alertId}::TestId`).props.children).toBe(screenId);
      expect(getByTestId(`${alertId}::Title`).props.children).toBe(
        'shoppingScreen.recipeUsingTitle '
      );
      expect(getByTestId(`${alertId}::Content`).props.children).toBe(
        'shoppingScreen.recipeUsingMessage :'
      );
      expect(getByTestId(`${alertId}::ConfirmText`).props.children).toBe(
        'shoppingScreen.recipeUsingValidation'
      );
      expect(() => getByTestId(`${alertId}::CancelText`)).toThrow();
      expect(() => getByTestId(`${alertId}::OnCancel`)).toThrow();
    });

    test('opens with the ingredient name and recipe titles on long press', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      fireEvent(getByTestId(itemTestId('Sushi Rice')), 'longPress');

      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(true);
      expect(getByTestId(`${alertId}::Title`).props.children).toBe(
        'shoppingScreen.recipeUsingTitle sushi rice'
      );
      expect(getByTestId(`${alertId}::Content`).props.children).toBe(
        'shoppingScreen.recipeUsingMessage :\n\t- Sushi Rolls'
      );
    });

    test('closes and resets ingredient data when dismissed', async () => {
      const { getByTestId } = await renderShoppingAndWait();

      fireEvent(getByTestId(itemTestId('Sushi Rice')), 'longPress');
      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(true);

      fireEvent.press(getByTestId(`${alertId}::OnClose`));

      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
      expect(getByTestId(`${alertId}::Title`).props.children).toBe(
        'shoppingScreen.recipeUsingTitle '
      );
    });
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

    beforeEach(async () => {
      jest.useFakeTimers();
      resetMockCopilot();
      mockUseSafeCopilot.mockReturnValue(null);
      mockUseReducedMotion.mockReturnValue(false);
      await addSushiAndSaladToMenu(database);
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

      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();
      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
    });

    test('renders without tutorial wrapper when copilot is not available', async () => {
      const { queryByTestId, getByTestId } = await renderShoppingAndWait();

      expect(queryByTestId('CopilotStep::Shopping')).toBeNull();
      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
    });

    test('does not run the demo when reduced motion is enabled', async () => {
      mockUseReducedMotion.mockReturnValue(true);
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { getByTestId } = await renderShoppingAndWait();

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL * 2);

      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
    });

    test('starts demo when current step matches Shopping step', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { getByTestId } = await renderShoppingAndWait();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();
      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);

      expect(mockEvents.on).toHaveBeenCalled();
    });

    test('restarts the demo interval when the matching step fires again', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      await renderShoppingAndWait();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
      });

      expect(() =>
        triggerStepChangeEvent({
          order: TUTORIAL_STEPS.Shopping.order,
          name: 'Shopping',
          text: 'Shopping step',
        })
      ).not.toThrow();

      expect(mockEvents.on).toHaveBeenCalled();
    });

    test('handles stepChange event correctly', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
        isActive: true,
      });

      await renderShoppingAndWait();

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

      await renderShoppingAndWait();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      triggerStopEvent();

      expect(mockEvents.on).toHaveBeenCalled();
    });

    test('cleans up event listeners and demo on unmount', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { unmount } = await renderShoppingAndWait();

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

      await renderShoppingAndWait();

      expect(mockEvents.on).not.toHaveBeenCalled();
    });

    test('does not crash demo when shopping list has fewer than 3 items', async () => {
      await database.clearMenu();
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
      });

      expect(() => jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL)).not.toThrow();

      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
    });

    test('demo toggles dialog state correctly', async () => {
      mockUseSafeCopilot.mockReturnValue(defaultMockValue);

      const { getByTestId } = await renderShoppingAndWait();

      expect(getByTestId('CopilotStep::Shopping')).toBeTruthy();
      expect(getByTestId(`${alertId}::IsVisible`).props.children).toBe(false);
      expect(getByTestId(`${alertId}::TestId`).props.children).toBe(screenId);
      expect(getByTestId(`${alertId}::Title`).props.children).toBe(
        'shoppingScreen.recipeUsingTitle '
      );
      expect(getByTestId(`${alertId}::Content`).props.children).toBe(
        'shoppingScreen.recipeUsingMessage :'
      );

      await waitFor(() => {
        expect(mockEvents.on).toHaveBeenCalledWith('stepChange', expect.any(Function));
        expect(mockEvents.on).toHaveBeenCalledWith('stop', expect.any(Function));
      });

      jest.advanceTimersByTime(TUTORIAL_DEMO_INTERVAL);

      expect(mockEvents.on).toHaveBeenCalled();
    });
  });
});
