import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ShoppingListItem } from '@components/molecules/ShoppingListItem';
import { ComputedShoppingItem, ingredientType } from '@customTypes/DatabaseElementTypes';

const testID = 'ShoppingScreen::SectionList::Flour';

function buildItem(overrides: Partial<ComputedShoppingItem> = {}): ComputedShoppingItem {
  return {
    name: 'Flour',
    type: ingredientType.baking,
    unit: 'g',
    quantity: '200',
    purchased: false,
    recipeTitles: ['Classic Pancakes'],
    ...overrides,
  };
}

function renderItem(overrides: Partial<ComputedShoppingItem> = {}) {
  const onToggle = jest.fn();
  const onShowRecipes = jest.fn();
  const result = render(
    <ShoppingListItem
      item={buildItem(overrides)}
      testID={testID}
      onToggle={onToggle}
      onShowRecipes={onShowRecipes}
    />
  );

  return { ...result, onToggle, onShowRecipes };
}

function hasStrikethrough(style: unknown) {
  return Array.isArray(style) && style.some(s => s && s.textDecorationLine === 'line-through');
}

describe('ShoppingListItem', () => {
  test('shows the ingredient name with its aggregated quantity and unit', () => {
    const { getByTestId } = renderItem();

    expect(getByTestId(`${testID}::Title`).props.children).toBe('Flour (200g)');
  });

  test('describes a single source recipe in the singular', () => {
    const { getByTestId } = renderItem();

    expect(getByTestId(`${testID}::Description`).props.children).toBe('1 shoppingScreen.recipe');
  });

  test('describes several source recipes in the plural', () => {
    const { getByTestId } = renderItem({ recipeTitles: ['Pancakes', 'Crepes', 'Waffles'] });

    expect(getByTestId(`${testID}::Description`).props.children).toBe('3 shoppingScreen.recipes');
  });

  test('describes an ingredient with no source recipe in the singular', () => {
    const { getByTestId } = renderItem({ recipeTitles: [] });

    expect(getByTestId(`${testID}::Description`).props.children).toBe('0 shoppingScreen.recipe');
  });

  test('shows an ingredient carrying no quantity without inventing one', () => {
    const { getByTestId } = renderItem({ quantity: '', unit: '' });

    expect(getByTestId(`${testID}::Title`).props.children).toBe('Flour ()');
  });

  test('leaves the checkbox unchecked and the text plain while still to buy', () => {
    const { getByTestId } = renderItem();

    expect(getByTestId(`${testID}::Checkbox::Status`).props.children).toBe('unchecked');
    expect(hasStrikethrough(getByTestId(`${testID}::Title`).props.style)).toBe(false);
  });

  test('checks the box and strikes the text through once purchased', () => {
    const { getByTestId } = renderItem({ purchased: true });

    expect(getByTestId(`${testID}::Checkbox::Status`).props.children).toBe('checked');
    expect(hasStrikethrough(getByTestId(`${testID}::Title`).props.style)).toBe(true);
    expect(hasStrikethrough(getByTestId(`${testID}::Description`).props.style)).toBe(true);
  });

  test('calls onToggle when the row is pressed', () => {
    const { getByTestId, onToggle, onShowRecipes } = renderItem();

    fireEvent.press(getByTestId(testID));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onShowRecipes).not.toHaveBeenCalled();
  });

  test('calls onShowRecipes on long press', () => {
    const { getByTestId, onToggle, onShowRecipes } = renderItem();

    fireEvent(getByTestId(testID), 'longPress');

    expect(onShowRecipes).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  test('formats a decimal quantity for display', () => {
    const { getByTestId } = renderItem({ quantity: '133.333333', unit: 'ml' });

    expect(getByTestId(`${testID}::Title`).props.children).toBe('Flour (133,33ml)');
  });
});
