/**
 * Unit tests for MenuRecipeCard component
 *
 * Tests the menu item card component that displays recipes in the weekly menu.
 * Covers rendering, cooked state management, count badges, user interactions,
 * navigation behavior, and edge cases.
 *
 * Test Coverage:
 * - Basic rendering with all required elements and testIds
 * - Cooked state toggle (checkbox status, title strikethrough)
 * - Count badge visibility and display (hidden when 1, shown when >1)
 * - User interactions (checkbox toggle, remove button, card press)
 * - Navigation to Recipe screen in readOnly mode
 * - Edge cases (empty images, long titles, special characters, missing recipes)
 * - Visual state changes with re-renders
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MenuRecipeCard } from '@components/molecules/MenuRecipeCard';
import React from 'react';
import { menuTableElement } from '@customTypes/DatabaseElementTypes';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { mockNavigate } from '@mocks/deps/react-navigation-mock';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import {
  testMenuItemUncooked,
  testMenuItemCooked,
  testMenuItemMultipleCount,
  createMockMenuItem,
} from '@test-data/menuDataset';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

const Stack = createStackNavigator();

describe('MenuRecipeCard', () => {
  const database = RecipeDatabase.getInstance();

  const defaultProps = {
    testId: 'test-menu-card',
    menuItem: testMenuItemUncooked,
    onToggleCooked: jest.fn(),
    onRemove: jest.fn(),
  };

  const testId = defaultProps.testId;

  const renderMenuRecipeCard = (overrideProps = {}) => {
    const props = { ...defaultProps, ...overrideProps };

    return render(
      <RecipeDatabaseProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name='Test' component={() => <MenuRecipeCard {...props} />} />
          </Stack.Navigator>
        </NavigationContainer>
      </RecipeDatabaseProvider>
    );
  };

  const assertBasicElements = (
    getByTestId: (testId: string) => any,
    menuItem: menuTableElement = testMenuItemUncooked
  ) => {
    expect(getByTestId(testId)).toBeTruthy();
    expect(getByTestId(`${testId}::Checkbox`)).toBeTruthy();
    expect(getByTestId(`${testId}::Cover`)).toBeTruthy();
    expect(getByTestId(`${testId}::Title`).props.children).toBe(menuItem.recipeTitle);
    expect(getByTestId(`${testId}::RemoveButton`)).toBeTruthy();
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await database.init();
    await database.addMultipleTags(testTags);
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('Basic Rendering', () => {
    test('renders all elements with correct testIds', () => {
      const { getByTestId } = renderMenuRecipeCard();

      assertBasicElements(getByTestId);
    });

    test('renders recipe image with correct source', () => {
      const { getByTestId } = renderMenuRecipeCard();

      expect(getByTestId(`${testId}::Cover`).props.source.uri).toBe(
        testMenuItemUncooked.imageSource
      );
    });

    test('renders recipe title with correct number of lines', () => {
      const { getByTestId } = renderMenuRecipeCard();

      expect(getByTestId(`${testId}::Title`).props.numberOfLines).toBe(2);
    });

    test('renders with custom testId', () => {
      const customTestId = 'custom-menu-card';
      const { getByTestId } = renderMenuRecipeCard({ testId: customTestId });

      expect(getByTestId(customTestId)).toBeTruthy();
      expect(getByTestId(`${customTestId}::Checkbox`)).toBeTruthy();
      expect(getByTestId(`${customTestId}::Title`)).toBeTruthy();
    });
  });

  describe('Cooked State', () => {
    test('displays unchecked checkbox when isCooked is false', () => {
      const { getByTestId } = renderMenuRecipeCard();

      expect(getByTestId(`${testId}::Checkbox::Status`).props.children).toBe('unchecked');
    });

    test('displays checked checkbox when isCooked is true', () => {
      const cookedMenuItem: menuTableElement = { ...testMenuItemUncooked, isCooked: true };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: cookedMenuItem });

      expect(getByTestId(`${testId}::Checkbox::Status`).props.children).toBe('checked');
    });

    test('applies strikethrough style to title when isCooked is true', () => {
      const cookedMenuItem: menuTableElement = { ...testMenuItemUncooked, isCooked: true };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: cookedMenuItem });

      const titleStyle = getByTestId(`${testId}::Title`).props.style;
      const hasStrikethrough = titleStyle.some(
        (style: any) => style.textDecorationLine === 'line-through'
      );

      expect(hasStrikethrough).toBe(true);
    });

    test('does not apply strikethrough style when isCooked is false', () => {
      const { getByTestId } = renderMenuRecipeCard();

      const titleStyle = getByTestId(`${testId}::Title`).props.style;
      const hasStrikethrough = titleStyle.some(
        (style: any) => style.textDecorationLine === 'line-through'
      );

      expect(hasStrikethrough).toBe(false);
    });
  });

  describe('Count Badge', () => {
    test('hides badge when count is 1', () => {
      const { queryByTestId } = renderMenuRecipeCard();

      expect(queryByTestId(`${testId}::CountBadge`)).toBeNull();
    });

    test('displays badge when count is greater than 1', () => {
      const multipleMenuItem: menuTableElement = { ...testMenuItemUncooked, count: 3 };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: multipleMenuItem });

      expect(getByTestId(`${testId}::CountBadge`)).toBeTruthy();
      expect(getByTestId(`${testId}::CountBadge`).props.children.props.children).toBe(3);
    });

    test('displays correct count value in badge', () => {
      const countValues = [2, 5, 10];

      countValues.forEach(count => {
        const menuItem: menuTableElement = { ...testMenuItemUncooked, count };
        const { getByTestId } = renderMenuRecipeCard({ menuItem });

        expect(getByTestId(`${testId}::CountBadge`).props.children.props.children).toBe(count);
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onToggleCooked when checkbox is pressed', () => {
      const onToggleCooked = jest.fn();
      const { getByTestId } = renderMenuRecipeCard({ onToggleCooked });

      fireEvent.press(getByTestId(`${testId}::Checkbox`));

      expect(onToggleCooked).toHaveBeenCalledTimes(1);
    });

    test('calls onRemove when remove button is pressed', () => {
      const onRemove = jest.fn();
      const { getByTestId } = renderMenuRecipeCard({ onRemove });

      fireEvent.press(getByTestId(`${testId}::RemoveButton`));

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    test('calls onToggleCooked for cooked items when checkbox pressed', () => {
      const onToggleCooked = jest.fn();
      const cookedMenuItem: menuTableElement = { ...testMenuItemUncooked, isCooked: true };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: cookedMenuItem, onToggleCooked });

      fireEvent.press(getByTestId(`${testId}::Checkbox`));

      expect(onToggleCooked).toHaveBeenCalledTimes(1);
    });

    test('does not call callbacks when card is pressed', () => {
      const onToggleCooked = jest.fn();
      const onRemove = jest.fn();
      const { getByTestId } = renderMenuRecipeCard({ onToggleCooked, onRemove });

      fireEvent.press(getByTestId(testId));

      expect(onToggleCooked).not.toHaveBeenCalled();
      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    test('navigates to Recipe screen with readOnly mode when card pressed', async () => {
      const { getByTestId } = renderMenuRecipeCard();

      await waitFor(() => {
        expect(database.get_recipes().length).toBeGreaterThan(0);
      });

      fireEvent.press(getByTestId(testId));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('Recipe', {
        mode: 'readOnly',
        recipe: expect.objectContaining({
          id: testMenuItemUncooked.recipeId,
          title: testMenuItemUncooked.recipeTitle,
        }),
      });
    });

    test('does not navigate when recipe not found in context', () => {
      const nonExistentMenuItem: menuTableElement = {
        ...testMenuItemUncooked,
        recipeId: 9999,
        recipeTitle: 'Non-existent Recipe',
      };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: nonExistentMenuItem });

      fireEvent.press(getByTestId(testId));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('navigates with correct recipe data for cooked items', async () => {
      const cookedMenuItem: menuTableElement = { ...testMenuItemUncooked, isCooked: true };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: cookedMenuItem });

      await waitFor(() => {
        expect(database.get_recipes().length).toBeGreaterThan(0);
      });

      fireEvent.press(getByTestId(testId));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('Recipe', {
        mode: 'readOnly',
        recipe: expect.objectContaining({
          id: cookedMenuItem.recipeId,
        }),
      });
    });

    test('navigates with correct recipe data for multiple count items', async () => {
      const multipleMenuItem: menuTableElement = { ...testMenuItemUncooked, count: 3 };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: multipleMenuItem });

      await waitFor(() => {
        expect(database.get_recipes().length).toBeGreaterThan(0);
      });

      fireEvent.press(getByTestId(testId));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('Recipe', {
        mode: 'readOnly',
        recipe: expect.objectContaining({
          id: multipleMenuItem.recipeId,
        }),
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty imageSource gracefully', () => {
      const emptyImageMenuItem: menuTableElement = { ...testMenuItemUncooked, imageSource: '' };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: emptyImageMenuItem });

      assertBasicElements(getByTestId, emptyImageMenuItem);
      expect(getByTestId(`${testId}::Cover`).props.source.uri).toBe('');
    });

    test('handles long recipe title with ellipsis', () => {
      const longTitleMenuItem: menuTableElement = {
        ...testMenuItemUncooked,
        recipeTitle:
          'Very Long Recipe Title That Should Be Truncated After Two Lines Of Text Display',
      };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: longTitleMenuItem });

      expect(getByTestId(`${testId}::Title`).props.children).toBe(longTitleMenuItem.recipeTitle);
      expect(getByTestId(`${testId}::Title`).props.numberOfLines).toBe(2);
    });

    test('handles special characters in recipe title', () => {
      const specialCharMenuItem: menuTableElement = {
        ...testMenuItemUncooked,
        recipeTitle: 'Café & Crème Brûlée with "Special" Ingredients',
      };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: specialCharMenuItem });

      expect(getByTestId(`${testId}::Title`).props.children).toBe(specialCharMenuItem.recipeTitle);
    });

    test('handles menu item without id', () => {
      const menuItemWithoutId: menuTableElement = {
        recipeId: 1,
        recipeTitle: 'Test Recipe',
        imageSource: 'test.jpg',
        isCooked: false,
        count: 1,
      };
      const { getByTestId } = renderMenuRecipeCard({ menuItem: menuItemWithoutId });

      assertBasicElements(getByTestId, menuItemWithoutId);
    });

    test('renders correctly with all edge case combinations', () => {
      const edgeCaseMenuItem: menuTableElement = {
        recipeId: 1,
        recipeTitle: '',
        imageSource: '',
        isCooked: true,
        count: 10,
      };
      const { getByTestId, queryByTestId } = renderMenuRecipeCard({ menuItem: edgeCaseMenuItem });

      expect(getByTestId(testId)).toBeTruthy();
      expect(getByTestId(`${testId}::Checkbox::Status`).props.children).toBe('checked');
      expect(getByTestId(`${testId}::Title`).props.children).toBe('');
      expect(getByTestId(`${testId}::CountBadge`).props.children.props.children).toBe(10);
    });
  });

  describe('Visual State Changes', () => {
    test('changes visual state when toggling from uncooked to cooked', () => {
      const { getByTestId, rerender } = renderMenuRecipeCard();

      expect(getByTestId(`${testId}::Checkbox::Status`).props.children).toBe('unchecked');

      const cookedMenuItem: menuTableElement = { ...testMenuItemUncooked, isCooked: true };
      rerender(
        <RecipeDatabaseProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name='Test'
                component={() => <MenuRecipeCard {...defaultProps} menuItem={cookedMenuItem} />}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </RecipeDatabaseProvider>
      );

      expect(getByTestId(`${testId}::Checkbox::Status`).props.children).toBe('checked');
    });

    test('shows and hides badge when count changes', () => {
      const { getByTestId, queryByTestId, rerender } = renderMenuRecipeCard();

      expect(queryByTestId(`${testId}::CountBadge`)).toBeNull();

      const multipleMenuItem: menuTableElement = { ...testMenuItemUncooked, count: 2 };
      rerender(
        <RecipeDatabaseProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                name='Test'
                component={() => <MenuRecipeCard {...defaultProps} menuItem={multipleMenuItem} />}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </RecipeDatabaseProvider>
      );

      expect(getByTestId(`${testId}::CountBadge`).props.children.props.children).toBe(2);
    });
  });
});
