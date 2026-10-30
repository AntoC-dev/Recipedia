import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ShoppingListItem } from '@components/molecules/ShoppingListItem';
import { ComputedShoppingItem, ingredientType } from '@customTypes/DatabaseElementTypes';

jest.mock('expo-localization', () =>
  require('@mocks/deps/expo-localization-mock').expoLocalizationMock()
);

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

async function renderItem(overrides: Partial<ComputedShoppingItem> = {}) {
  const onToggle = jest.fn();
  const onShowRecipes = jest.fn();
  const result = await render(
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

function checkboxStatus(getByTestId: Awaited<ReturnType<typeof renderItem>>['getByTestId']) {
  return getByTestId(`${testID}::Checkbox::Status`, { includeHiddenElements: true }).props.children;
}

describe('ShoppingListItem', () => {
  test('shows the ingredient name with its aggregated quantity and unit', async () => {
    const { getByTestId } = await renderItem();

    expect(getByTestId(`${testID}::Title`).props.children).toBe('Flour (200g)');
  });

  test('describes a single source recipe in the singular', async () => {
    const { getByTestId } = await renderItem();

    expect(getByTestId(`${testID}::Description`).props.children).toBe('1 shoppingScreen.recipe');
  });

  test('describes several source recipes in the plural', async () => {
    const { getByTestId } = await renderItem({ recipeTitles: ['Pancakes', 'Crepes', 'Waffles'] });

    expect(getByTestId(`${testID}::Description`).props.children).toBe('3 shoppingScreen.recipes');
  });

  test('describes an ingredient with no source recipe in the singular', async () => {
    const { getByTestId } = await renderItem({ recipeTitles: [] });

    expect(getByTestId(`${testID}::Description`).props.children).toBe('0 shoppingScreen.recipe');
  });

  test('shows an ingredient carrying no quantity without inventing one', async () => {
    const { getByTestId } = await renderItem({ quantity: '', unit: '' });

    expect(getByTestId(`${testID}::Title`).props.children).toBe('Flour ()');
  });

  test('leaves the checkbox unchecked and the text plain while still to buy', async () => {
    const { getByTestId } = await renderItem();

    expect(checkboxStatus(getByTestId)).toBe('unchecked');
    expect(hasStrikethrough(getByTestId(`${testID}::Title`).props.style)).toBe(false);
  });

  test('checks the box and strikes the text through once purchased', async () => {
    const { getByTestId } = await renderItem({ purchased: true });

    expect(checkboxStatus(getByTestId)).toBe('checked');
    expect(hasStrikethrough(getByTestId(`${testID}::Title`).props.style)).toBe(true);
    expect(hasStrikethrough(getByTestId(`${testID}::Description`).props.style)).toBe(true);
  });

  test('calls onToggle when the row is pressed', async () => {
    const { getByTestId, onToggle, onShowRecipes } = await renderItem();

    await fireEvent.press(getByTestId(testID));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onShowRecipes).not.toHaveBeenCalled();
  });

  test('calls onShowRecipes on long press', async () => {
    const { getByTestId, onToggle, onShowRecipes } = await renderItem();

    await fireEvent(getByTestId(testID), 'longPress');

    expect(onShowRecipes).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  test('formats a decimal quantity for display', async () => {
    const { getByTestId } = await renderItem({ quantity: '133.333333', unit: 'ml' });

    expect(getByTestId(`${testID}::Title`).props.children).toBe('Flour (133.33ml)');
  });

  test('exposes the row as a checkbox to screen readers', async () => {
    const { getByTestId } = await renderItem();

    expect(getByTestId(testID).props.accessibilityRole).toBe('checkbox');
  });

  test('hides the decorative checkbox from screen readers', async () => {
    const { queryByTestId } = await renderItem();

    expect(queryByTestId(`${testID}::Checkbox`)).toBeNull();
  });

  test('reports the unpurchased row as unchecked', async () => {
    const { getByTestId } = await renderItem({ purchased: false });

    expect(getByTestId(testID).props.accessibilityState).toEqual({ checked: false });
  });

  test('reports the purchased row as checked', async () => {
    const { getByTestId } = await renderItem({ purchased: true });

    expect(getByTestId(testID).props.accessibilityState).toEqual({ checked: true });
  });
});
