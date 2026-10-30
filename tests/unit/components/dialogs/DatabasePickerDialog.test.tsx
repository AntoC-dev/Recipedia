import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { expectKeyboardDismissesOnDrag } from '@test-helpers/expectKeyboardDismissesOnDrag';
import { DatabasePickerDialog } from '@components/dialogs/DatabasePickerDialog';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
describe('DatabasePickerDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  const testId = 'test-picker';
  const mockOnSelect = jest.fn();
  const mockOnDismiss = jest.fn();

  const mockItems: ingredientTableElement[] = [
    {
      id: 1,
      name: 'Tomato',
      type: ingredientType.vegetable,
      unit: 'pieces',
      season: [],
    },
    {
      id: 2,
      name: 'Apple',
      type: ingredientType.fruit,
      unit: 'pieces',
      season: [],
    },
    {
      id: 3,
      name: 'Banana',
      type: ingredientType.fruit,
      unit: 'pieces',
      season: [],
    },
    {
      id: 4,
      name: 'Carrot',
      type: ingredientType.vegetable,
      unit: 'kg',
      season: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    test('renders when isVisible is true', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByTestId(testId)).toBeTruthy();
    });

    test('does not render when isVisible is false', async () => {
      const { queryByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={false}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(queryByTestId(testId)).toBeNull();
    });
  });

  describe('content rendering', () => {
    test('renders title correctly', async () => {
      const title = 'Pick an ingredient';
      const { getByText } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title={title}
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText(title)).toBeTruthy();
    });

    test('renders searchbar with placeholder', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      expect(searchbar).toBeTruthy();
      const placeholder = getByTestId(`${testId}::Searchbar::Placeholder`);
      expect(placeholder.props.children).toBe('alerts.databasePicker.searchPlaceholder');
    });

    test('renders cancel button', async () => {
      const { getByTestId, getByText } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const cancelButton = getByTestId(`${testId}::CancelButton`);
      expect(cancelButton).toBeTruthy();
      expect(getByText('cancel')).toBeTruthy();
    });

    test('renders all items in the list', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      mockItems.forEach((item, index) => {
        const listItem = getByTestId(`${testId}::Item::${index}`);
        expect(listItem).toBeTruthy();
        const titleElement = getByTestId(`${testId}::Item::${index}::Title`);
        expect(titleElement.props.children).toBe(item.name);
      });
    });
  });

  describe('search functionality', () => {
    test('filters items by search query (case-insensitive)', async () => {
      const { getByTestId, queryByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'tom');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Tomato');
      expect(queryByTestId(`${testId}::Item::1`)).toBeNull();
    });

    test('shows all items when search query is empty', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      mockItems.forEach((_, index) => {
        expect(getByTestId(`${testId}::Item::${index}`)).toBeTruthy();
      });
    });

    test('shows no results message when no items match search', async () => {
      const { getByTestId, getByText } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'xyz123notfound');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByText('alerts.databasePicker.noResults')).toBeTruthy();
    });

    test('filters items correctly with partial matches', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'an');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Banana');
    });

    test('performs case-insensitive search', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'APPLE');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Apple');
    });

    test('shows all items again after clearing search input', async () => {
      const { getByTestId, queryByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'tom');
      await act(() => jest.advanceTimersByTime(300));
      expect(queryByTestId(`${testId}::Item::1`)).toBeNull();

      await fireEvent.changeText(searchbar, '');
      await act(() => jest.advanceTimersByTime(300));

      mockItems.forEach((_, index) => {
        expect(getByTestId(`${testId}::Item::${index}`)).toBeTruthy();
      });
    });

    test('debounces filtering - does not filter immediately on typing', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'tom');

      expect(getByTestId(`${testId}::Item::0`)).toBeTruthy();
      expect(getByTestId(`${testId}::Item::1`)).toBeTruthy();
      expect(getByTestId(`${testId}::Item::2`)).toBeTruthy();
      expect(getByTestId(`${testId}::Item::3`)).toBeTruthy();

      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Tomato');
    });

    test('resets debounce timer on each keystroke', async () => {
      const { getByTestId, queryByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);

      await fireEvent.changeText(searchbar, 't');
      await act(() => jest.advanceTimersByTime(200));
      await fireEvent.changeText(searchbar, 'to');
      await act(() => jest.advanceTimersByTime(200));
      await fireEvent.changeText(searchbar, 'tom');

      expect(getByTestId(`${testId}::Item::3`)).toBeTruthy();

      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Tomato');
      expect(queryByTestId(`${testId}::Item::1`)).toBeNull();
    });
  });

  describe('empty state', () => {
    test('shows no results message when items array is empty', async () => {
      const { getByText } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={[]}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByText('alerts.databasePicker.noResults')).toBeTruthy();
    });
  });

  describe('item selection', () => {
    test('calls onSelect with correct item when list item is pressed', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      await fireEvent.press(getByTestId(`${testId}::Item::1`));

      expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    test('calls onSelect with correct item when selecting from filtered list', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'app');
      await act(() => jest.advanceTimersByTime(300));
      await fireEvent.press(getByTestId(`${testId}::Item::0`));

      expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
    });

    test('clears search query when item is selected', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'tom');
      await act(() => jest.advanceTimersByTime(300));

      const textInput = getByTestId(`${testId}::Searchbar::TextInput`);
      expect(textInput.props.value).toBe('tom');

      await fireEvent.press(getByTestId(`${testId}::Item::0`));

      expect(textInput.props.value).toBe('');
    });
  });

  describe('dismiss behavior', () => {
    test('calls onDismiss when cancel button is pressed', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      await fireEvent.press(getByTestId(`${testId}::CancelButton`));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    test('clears search query when dialog is dismissed', async () => {
      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbarInput = getByTestId(`${testId}::Searchbar::TextInput`);
      await fireEvent.changeText(searchbarInput, 'search text');
      await act(() => jest.advanceTimersByTime(300));

      expect(searchbarInput.props.value).toBe('search text');

      await fireEvent.press(getByTestId(`${testId}::CancelButton`));

      expect(searchbarInput.props.value).toBe('');
    });
  });

  describe('edge cases', () => {
    test('updates displayed items when items prop changes', async () => {
      const newItems: ingredientTableElement[] = [
        {
          id: 10,
          name: 'Mango',
          type: ingredientType.fruit,
          unit: 'pieces',
          season: [],
        },
      ];

      const { getByTestId, queryByTestId, rerender } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByTestId(`${testId}::Item::3`)).toBeTruthy();

      await rerender(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={newItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Mango');
      expect(queryByTestId(`${testId}::Item::1`)).toBeNull();
    });

    test('treats whitespace-only search as non-empty', async () => {
      const { getByTestId, getByText } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, '   ');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByText('alerts.databasePicker.noResults')).toBeTruthy();
    });

    test('handles items with very long names', async () => {
      const longNameItem = {
        id: 99,
        name: 'Very Long Item Name That Should Be Truncated Or Handled Properly In The UI Component',
        type: ingredientType.vegetable,
        unit: 'kg',
        season: [],
      };

      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={[longNameItem]}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const listItem = getByTestId(`${testId}::Item::0`);
      const titleElement = getByTestId(`${testId}::Item::0::Title`);
      expect(titleElement.props.children).toBe(longNameItem.name);
    });

    test('handles special characters in search query', async () => {
      const specialItem = {
        id: 100,
        name: 'Item-with-special_chars',
        type: ingredientType.vegetable,
        unit: 'kg',
        season: [],
      };

      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={[specialItem]}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'special_chars');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe(specialItem.name);
    });

    test('handles accented characters in search', async () => {
      const accentedItem = {
        id: 101,
        name: 'Café',
        type: ingredientType.vegetable,
        unit: 'kg',
        season: [],
      };

      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={[accentedItem]}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      const searchbar = getByTestId(`${testId}::Searchbar`);
      await fireEvent.changeText(searchbar, 'café');
      await act(() => jest.advanceTimersByTime(300));

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe(accentedItem.name);
    });
  });

  describe('FlashList integration', () => {
    test('uses correct keyExtractor for items', async () => {
      const duplicateNameItems = [
        {
          id: 1,
          name: 'Duplicate',
          type: ingredientType.vegetable,
          unit: 'kg',
          season: [],
        },
        {
          id: 2,
          name: 'Duplicate',
          type: ingredientType.vegetable,
          unit: 'kg',
          season: [],
        },
      ];

      const { getByTestId } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={duplicateNameItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expect(getByTestId(`${testId}::Item::0`)).toBeTruthy();
      expect(getByTestId(`${testId}::Item::1`)).toBeTruthy();
    });

    test('list dismisses the keyboard on drag', async () => {
      const { container } = await render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      expectKeyboardDismissesOnDrag(container);
    });
  });
});
