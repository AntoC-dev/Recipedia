import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import React from 'react';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import Menu from '@screens/Menu';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';

const { mockUseSafeCopilot } = require('@mocks/hooks/useSafeCopilot-mock');

jest.mock('@components/molecules/MenuRecipeCard', () => ({
  MenuRecipeCard: require('@mocks/components/molecules/MenuRecipeCard-mock').menuRecipeCardMock,
}));

jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

jest.mock('@react-navigation/native', () => ({
  ...require('@mocks/deps/react-navigation-mock').reactNavigationMock(),
}));

const mockRoute = {
  key: 'Menu',
  name: 'Menu',
  params: {},
};

const defaultProps = {
  navigation: mockNavigationFunctions,
  route: mockRoute,
} as any;

const screenId = 'MenuScreen';

async function renderMenuAndWait() {
  const result = render(
    <RecipeDatabaseProvider>
      <Menu {...defaultProps} />
    </RecipeDatabaseProvider>
  );

  const hasMenuItems = RecipeDatabase.getInstance().get_menu().length > 0;

  await waitFor(() => {
    const elementExpectedMounted = hasMenuItems
      ? `${screenId}::ScrollView`
      : `${screenId}::TextNoItem`;
    expect(result.getByTestId(elementExpectedMounted)).toBeTruthy();
  });

  return result;
}

describe('Menu Screen', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => await database.closeAndReset());

  describe('Empty Menu State', () => {
    test('renders empty state text when menu is empty', async () => {
      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId(`${screenId}::TextNoItem`)).toBeTruthy();
      expect(getByTestId(`${screenId}::TextNoItem`).props.children).toBe(
        'menuScreen.noItemsInMenu'
      );
    });

    test('renders hint text when menu is empty', async () => {
      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId(`${screenId}::TextHint`)).toBeTruthy();
      expect(getByTestId(`${screenId}::TextHint`).props.children).toBe(
        'menuScreen.addRecipesToMenu'
      );
    });

    test('does not render ScrollView when menu is empty', async () => {
      const { queryByTestId } = await renderMenuAndWait();

      expect(queryByTestId(`${screenId}::ScrollView`)).toBeNull();
    });

    test('does not render tutorial overlay when menu is empty', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: {},
        currentStep: { order: 1, name: 'Menu', text: 'Menu step' },
        isActive: true,
      });

      const { queryByTestId } = await renderMenuAndWait();

      expect(queryByTestId('CopilotStep::Menu')).toBeNull();
    });
  });

  describe('Menu with Items - Sections', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]);
      await database.addRecipeToMenu(testRecipes[1]);
      await database.addRecipeToMenu(testRecipes[2]);
    });

    test('renders toCook section when uncooked items exist', async () => {
      const { getByText } = await renderMenuAndWait();

      expect(getByText('menuScreen.toCook')).toBeTruthy();
    });

    test('renders cooked section when cooked items exist', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem.id!);

      const { getByText } = await renderMenuAndWait();

      expect(getByText('menuScreen.cooked')).toBeTruthy();
    });

    test('renders both sections when mixed items', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem.id!);

      const { getByText } = await renderMenuAndWait();

      expect(getByText('menuScreen.toCook')).toBeTruthy();
      expect(getByText('menuScreen.cooked')).toBeTruthy();
    });

    test('does not render toCook section when all items cooked', async () => {
      const menu = database.get_menu();
      for (const item of menu) {
        await database.toggleMenuItemCooked(item.id!);
      }

      const { queryByText, getByText } = await renderMenuAndWait();

      expect(queryByText('menuScreen.toCook')).toBeNull();
      expect(getByText('menuScreen.cooked')).toBeTruthy();
    });

    test('does not render cooked section when no items cooked', async () => {
      const { queryByText, getByText } = await renderMenuAndWait();

      expect(getByText('menuScreen.toCook')).toBeTruthy();
      expect(queryByText('menuScreen.cooked')).toBeNull();
    });
  });

  describe('MenuRecipeCard Integration', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]);
      await database.addRecipeToMenu(testRecipes[1]);
      await database.addRecipeToMenu(testRecipes[2]);
    });

    test('renders correct number of cards', async () => {
      const { getByTestId } = await renderMenuAndWait();

      const menu = database.get_menu();

      menu.forEach((_, index) => {
        expect(getByTestId(`${screenId}::MenuItem::${index + 1}`)).toBeTruthy();
      });
    });

    test('cards have correct testId format', async () => {
      const { getByTestId } = await renderMenuAndWait();

      const menu = database.get_menu();
      menu.forEach((_, index) => {
        expect(getByTestId(`${screenId}::MenuItem::${index + 1}`)).toBeTruthy();
      });
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]);
      await database.addRecipeToMenu(testRecipes[1]);
    });

    test('calls toggleMenuItemCooked when checkbox pressed on card', async () => {
      const { getByTestId } = await renderMenuAndWait();

      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      const initialCookedStatus = firstMenuItem.isCooked;

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::Checkbox`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        const updatedItem = updatedMenu.find(item => item.id === firstMenuItem.id);
        expect(updatedItem?.isCooked).toBe(!initialCookedStatus);
      });
    });

    test('calls removeFromMenu when remove button pressed on card', async () => {
      const { getByTestId, queryByTestId } = await renderMenuAndWait();

      const initialMenuLength = database.get_menu().length;

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        expect(updatedMenu.length).toBe(initialMenuLength - 1);
        expect(queryByTestId(`${screenId}::MenuItem::2`)).toBeNull();
      });
    });

    test('calls toggleMenuItemCooked when checkbox pressed on cooked card', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem.id!);

      const { getByTestId } = await renderMenuAndWait();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::2::Checkbox`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        const updatedItem = updatedMenu.find(item => item.id === firstMenuItem.id);
        expect(updatedItem?.isCooked).toBe(false);
      });
    });

    test('calls removeFromMenu when remove button pressed on cooked card', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem.id!);
      const initialMenuLength = menu.length;

      const { getByTestId, queryByTestId } = await renderMenuAndWait();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::2::RemoveButton`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        expect(updatedMenu.length).toBe(initialMenuLength - 1);
        expect(queryByTestId(`${screenId}::MenuItem::2`)).toBeNull();
      });
    });
  });

  describe('Tutorial Integration', () => {
    beforeEach(() => {
      mockUseSafeCopilot.mockReturnValue(null);
    });

    test('renders CopilotStep when copilotData exists AND menu has items', async () => {
      await database.addRecipeToMenu(testRecipes[0]);

      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: {},
        currentStep: { order: 1, name: 'Menu', text: 'Menu step' },
        isActive: true,
      });

      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId('CopilotStep::Menu')).toBeTruthy();
    });

    test('does not render CopilotStep when copilotData is null', async () => {
      await database.addRecipeToMenu(testRecipes[0]);

      const { queryByTestId } = await renderMenuAndWait();

      expect(queryByTestId('CopilotStep::Menu')).toBeNull();
    });

    test('does not render CopilotStep when menu is empty', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: {},
        currentStep: { order: 1, name: 'Menu', text: 'Menu step' },
        isActive: true,
      });

      const { queryByTestId } = await renderMenuAndWait();

      expect(queryByTestId('CopilotStep::Menu')).toBeNull();
    });
  });
});
