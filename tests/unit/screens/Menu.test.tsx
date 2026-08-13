import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Snackbar } from 'react-native-paper';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import React from 'react';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import Menu from '@screens/Menu';
import { padding } from '@styles/spacing';

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
const removeSnackbarId = `${screenId}::RemoveSnackbar`;
const toCookHeaderId = `${screenId}::SectionHeader::ToCook`;
const cookedHeaderId = `${screenId}::SectionHeader::Cooked`;

async function renderMenuAndWait() {
  const result = render(<Menu {...defaultProps} />);

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

    test('renders tutorial overlay even when menu is empty', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: {},
        currentStep: { order: 1, name: 'Menu', text: 'Menu step' },
        isActive: true,
      });

      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId('CopilotStep::Menu')).toBeTruthy();
    });

    test('remove snackbar is hidden when menu is empty', async () => {
      const { queryByTestId } = await renderMenuAndWait();

      expect(queryByTestId(removeSnackbarId)).toBeNull();
    });
  });

  describe('Menu with Items - Sections', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]!);
      await database.addRecipeToMenu(testRecipes[1]!);
      await database.addRecipeToMenu(testRecipes[2]!);
    });

    test('renders toCook section when uncooked items exist', async () => {
      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId(toCookHeaderId).props.children).toBe('menuScreen.toCook');
    });

    test('renders cooked section when cooked items exist', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem!.id!);

      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId(cookedHeaderId).props.children).toBe('menuScreen.cooked');
    });

    test('renders both sections when mixed items', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem!.id!);

      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId(toCookHeaderId)).toBeTruthy();
      expect(getByTestId(cookedHeaderId)).toBeTruthy();
    });

    test('does not render toCook section when all items cooked', async () => {
      const menu = database.get_menu();
      for (const item of menu) {
        await database.toggleMenuItemCooked(item.id!);
      }

      const { queryByTestId, getByTestId } = await renderMenuAndWait();

      expect(queryByTestId(toCookHeaderId)).toBeNull();
      expect(getByTestId(cookedHeaderId)).toBeTruthy();
    });

    test('does not render cooked section when no items cooked', async () => {
      const { queryByTestId, getByTestId } = await renderMenuAndWait();

      expect(getByTestId(toCookHeaderId)).toBeTruthy();
      expect(queryByTestId(cookedHeaderId)).toBeNull();
    });

    test('renders section headers as tier-level accessibility headers', async () => {
      const menu = database.get_menu();
      await database.toggleMenuItemCooked(menu[0]!.id!);

      const { getByTestId } = await renderMenuAndWait();

      for (const headerId of [toCookHeaderId, cookedHeaderId]) {
        expect(getByTestId(headerId).props.variant).toBe('titleMedium');
        expect(getByTestId(headerId).props.accessibilityRole).toBe('header');
      }
    });

    test('insets the list content so headers and cards share one left edge', async () => {
      const { getByTestId } = await renderMenuAndWait();

      const contentStyle = getByTestId(`${screenId}::ScrollView`).props.contentContainerStyle;

      expect(contentStyle).toEqual(expect.objectContaining({ paddingHorizontal: padding.large }));
    });
  });

  describe('MenuRecipeCard Integration', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]!);
      await database.addRecipeToMenu(testRecipes[1]!);
      await database.addRecipeToMenu(testRecipes[2]!);
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

  describe('Toggle Cooked Interactions', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]!);
      await database.addRecipeToMenu(testRecipes[1]!);
    });

    test('calls toggleMenuItemCooked when checkbox pressed on card', async () => {
      const { getByTestId } = await renderMenuAndWait();

      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      const initialCookedStatus = firstMenuItem!.isCooked;

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::Checkbox`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        const updatedItem = updatedMenu.find(item => item.id === firstMenuItem!.id);
        expect(updatedItem?.isCooked).toBe(!initialCookedStatus);
      });
    });

    test('calls toggleMenuItemCooked when checkbox pressed on cooked card', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem!.id!);

      const { getByTestId } = await renderMenuAndWait();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::2::Checkbox`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        const updatedItem = updatedMenu.find(item => item.id === firstMenuItem!.id);
        expect(updatedItem?.isCooked).toBe(false);
      });
    });
  });

  describe('Remove with undo', () => {
    beforeEach(async () => {
      await database.addRecipeToMenu(testRecipes[0]!);
      await database.addRecipeToMenu(testRecipes[1]!);
    });

    test('pressing remove immediately removes the item and shows the undo snackbar', async () => {
      const { getByTestId, queryByTestId } = await renderMenuAndWait();

      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      const initialMenuLength = menu.length;

      expect(queryByTestId(removeSnackbarId)).toBeNull();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        expect(updatedMenu.length).toBe(initialMenuLength - 1);
        expect(updatedMenu.find(item => item.id === firstMenuItem!.id)).toBeUndefined();
      });

      expect(getByTestId(`${removeSnackbarId}::Text`).props.children).toBe(
        'menuScreen.removedFromMenu'
      );
      expect(getByTestId(`${removeSnackbarId}::Action::Children`).props.children).toBe('undo');
    });

    test('keeps the undo snackbar up for the long paper duration', async () => {
      const { getByTestId } = await renderMenuAndWait();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));

      await waitFor(() => {
        expect(getByTestId(removeSnackbarId)).toBeTruthy();
      });

      expect(getByTestId(`${removeSnackbarId}::Duration`).props.children).toBe(
        Snackbar.DURATION_LONG
      );
    });

    test('pressing undo re-adds the removed recipe and hides the snackbar', async () => {
      const { getByTestId, queryByTestId } = await renderMenuAndWait();

      const initialMenuLength = database.get_menu().length;

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));

      await waitFor(() => {
        expect(database.get_menu().length).toBe(initialMenuLength - 1);
      });

      fireEvent.press(getByTestId(`${removeSnackbarId}::Action`));

      await waitFor(() => {
        expect(database.get_menu().length).toBe(initialMenuLength);
      });
      expect(queryByTestId(removeSnackbarId)).toBeNull();
    });

    test('undo restores only the most recently removed recipe', async () => {
      const { getByTestId } = await renderMenuAndWait();

      const secondRecipeId = database.get_menu()[1]!.recipeId;

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));
      await waitFor(() => {
        expect(database.get_menu().length).toBe(1);
      });

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));
      await waitFor(() => {
        expect(database.get_menu().length).toBe(0);
      });

      fireEvent.press(getByTestId(`${removeSnackbarId}::Action`));

      await waitFor(() => {
        const restoredMenu = database.get_menu();
        expect(restoredMenu.length).toBe(1);
        expect(restoredMenu[0]!.recipeId).toBe(secondRecipeId);
      });
    });

    test('dismissing the snackbar keeps the item removed', async () => {
      const { getByTestId, queryByTestId } = await renderMenuAndWait();

      const initialMenuLength = database.get_menu().length;

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));

      await waitFor(() => {
        expect(getByTestId(removeSnackbarId)).toBeTruthy();
      });

      fireEvent.press(getByTestId(`${removeSnackbarId}::Dismiss`));

      await waitFor(() => {
        expect(queryByTestId(removeSnackbarId)).toBeNull();
      });
      expect(database.get_menu().length).toBe(initialMenuLength - 1);
    });

    test('removing a cooked card also removes immediately and shows the snackbar', async () => {
      const menu = database.get_menu();
      const firstMenuItem = menu[0];
      await database.toggleMenuItemCooked(firstMenuItem!.id!);
      const initialMenuLength = database.get_menu().length;

      const { getByTestId } = await renderMenuAndWait();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::2::RemoveButton`));

      await waitFor(() => {
        const updatedMenu = database.get_menu();
        expect(updatedMenu.length).toBe(initialMenuLength - 1);
        expect(updatedMenu.find(item => item.id === firstMenuItem!.id)).toBeUndefined();
      });

      expect(getByTestId(removeSnackbarId)).toBeTruthy();
    });

    test('removing a card whose recipe no longer exists shows no undo snackbar', async () => {
      const orphanMenuItem = database.get_menu()[0]!;
      const deletedRecipe = database
        .get_recipes()
        .find(recipe => recipe.id === orphanMenuItem.recipeId)!;

      await database.addRecipeToMenu(deletedRecipe);
      await database.deleteRecipe(deletedRecipe);

      expect(database.get_menu().find(item => item.id === orphanMenuItem.id)).toBeDefined();

      const { getByTestId, queryByTestId } = await renderMenuAndWait();

      fireEvent.press(getByTestId(`${screenId}::MenuItem::1::RemoveButton`));

      await waitFor(() => {
        expect(database.get_menu().find(item => item.id === orphanMenuItem.id)).toBeUndefined();
      });

      expect(queryByTestId(removeSnackbarId)).toBeNull();
    });
  });

  describe('Tutorial Integration', () => {
    beforeEach(() => {
      mockUseSafeCopilot.mockReturnValue(null);
    });

    test('renders CopilotStep when copilotData exists AND menu has items', async () => {
      await database.addRecipeToMenu(testRecipes[0]!);

      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: {},
        currentStep: { order: 1, name: 'Menu', text: 'Menu step' },
        isActive: true,
      });

      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId('CopilotStep::Menu')).toBeTruthy();
    });

    test('does not render CopilotStep when copilotData is null', async () => {
      await database.addRecipeToMenu(testRecipes[0]!);

      const { queryByTestId } = await renderMenuAndWait();

      expect(queryByTestId('CopilotStep::Menu')).toBeNull();
    });

    test('renders CopilotStep even when menu has no items', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: {},
        currentStep: { order: 1, name: 'Menu', text: 'Menu step' },
        isActive: true,
      });

      const { getByTestId } = await renderMenuAndWait();

      expect(getByTestId('CopilotStep::Menu')).toBeTruthy();
    });
  });
});
