import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RowActionsMenu } from '@components/molecules/RowActionsMenu';

jest.mock('@expo/vector-icons', () => require('@mocks/deps/expo-vector-icons-mock'));

const ROW_TEST_ID = 'Row::0';

function renderMenu(overrides: Partial<React.ComponentProps<typeof RowActionsMenu>> = {}) {
  return render(<RowActionsMenu testID={ROW_TEST_ID} onDelete={jest.fn()} {...overrides} />);
}

describe('RowActionsMenu', () => {
  it('renders a dots-vertical anchor with a closed menu', async () => {
    const { getByTestId, queryByTestId } = await renderMenu();

    expect(getByTestId(`${ROW_TEST_ID}::ActionsButton::Icon`).props.children).toBe('dots-vertical');
    expect(getByTestId(`${ROW_TEST_ID}::ActionsMenu`).props.visible).toBe(false);
    expect(queryByTestId(`${ROW_TEST_ID}::DeleteItem`)).toBeNull();
  });

  it('opens the menu with move up, move down then delete items', async () => {
    const { getByTestId } = await renderMenu({ onMoveUp: jest.fn(), onMoveDown: jest.fn() });

    await fireEvent.press(getByTestId(`${ROW_TEST_ID}::ActionsButton`));

    expect(getByTestId(`${ROW_TEST_ID}::ActionsMenu`).props.visible).toBe(true);
    expect(getByTestId(`${ROW_TEST_ID}::MoveUpItem`)).toHaveTextContent('arrow-upMove up');
    expect(getByTestId(`${ROW_TEST_ID}::MoveDownItem`)).toHaveTextContent('arrow-downMove down');
    expect(getByTestId(`${ROW_TEST_ID}::DeleteItem::LeadingIcon`).props.children).toBe('delete');
    expect(getByTestId(`${ROW_TEST_ID}::DeleteItem`)).toHaveTextContent(/}delete$/);
  });

  it('colors the delete item with the theme error role', async () => {
    const { getByTestId } = await renderMenu();

    await fireEvent.press(getByTestId(`${ROW_TEST_ID}::ActionsButton`));

    const deleteTheme = JSON.parse(getByTestId(`${ROW_TEST_ID}::DeleteItem::Theme`).props.children);
    expect(deleteTheme.colors.onSurface).toBe(deleteTheme.colors.onSurfaceVariant);
    expect(deleteTheme.colors.onSurface).toBeTruthy();
  });

  it.each([
    ['MoveUpItem', 'onMoveUp'],
    ['MoveDownItem', 'onMoveDown'],
    ['DeleteItem', 'onDelete'],
  ] as const)('pressing %s calls %s and closes the menu', async (itemId, handlerName) => {
    const handlers = { onMoveUp: jest.fn(), onMoveDown: jest.fn(), onDelete: jest.fn() };
    const { getByTestId, queryByTestId } = await renderMenu(handlers);

    await fireEvent.press(getByTestId(`${ROW_TEST_ID}::ActionsButton`));
    await fireEvent.press(getByTestId(`${ROW_TEST_ID}::${itemId}`));

    expect(handlers[handlerName]).toHaveBeenCalledTimes(1);
    Object.entries(handlers)
      .filter(([name]) => name !== handlerName)
      .forEach(([, handler]) => expect(handler).not.toHaveBeenCalled());
    expect(getByTestId(`${ROW_TEST_ID}::ActionsMenu`).props.visible).toBe(false);
    expect(queryByTestId(`${ROW_TEST_ID}::${itemId}`)).toBeNull();
  });

  it.each([
    ['MoveUpItem', 'MoveDownItem', { onMoveDown: jest.fn() }],
    ['MoveDownItem', 'MoveUpItem', { onMoveUp: jest.fn() }],
  ] as const)(
    'disables %s and enables %s when only the other handler is provided',
    async (disabledItem, enabledItem, handlers) => {
      const { getByTestId } = await renderMenu(handlers);

      await fireEvent.press(getByTestId(`${ROW_TEST_ID}::ActionsButton`));

      expect(getByTestId(`${ROW_TEST_ID}::${disabledItem}`)).toBeDisabled();
      expect(getByTestId(`${ROW_TEST_ID}::${enabledItem}`)).toBeEnabled();
    }
  );

  it('hides both move items when no move handler is provided', async () => {
    const { getByTestId, queryByTestId } = await renderMenu();

    await fireEvent.press(getByTestId(`${ROW_TEST_ID}::ActionsButton`));

    expect(queryByTestId(`${ROW_TEST_ID}::MoveUpItem`)).toBeNull();
    expect(queryByTestId(`${ROW_TEST_ID}::MoveDownItem`)).toBeNull();
    expect(getByTestId(`${ROW_TEST_ID}::DeleteItem`)).toBeTruthy();
  });

  it('closes the menu on dismiss without calling any handler', async () => {
    const onDelete = jest.fn();
    const { getByTestId } = await renderMenu({ onDelete });

    await fireEvent.press(getByTestId(`${ROW_TEST_ID}::ActionsButton`));
    await fireEvent(getByTestId(`${ROW_TEST_ID}::ActionsMenu`), 'dismiss');

    expect(getByTestId(`${ROW_TEST_ID}::ActionsMenu`).props.visible).toBe(false);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
