import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DatabasePickerDialog } from '@components/dialogs/DatabasePickerDialog';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

describe('DatabasePickerDialog', () => {
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
    test('renders when isVisible is true', () => {
      const { getByTestId } = render(
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

    test('does not render when isVisible is false', () => {
      const { queryByTestId } = render(
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
    test('renders title correctly', () => {
      const title = 'Pick an ingredient';
      const { getByText } = render(
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

    test('renders searchbar with placeholder', () => {
      const { getByTestId } = render(
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

    test('renders cancel button', () => {
      const { getByTestId, getByText } = render(
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

    test('renders all items in the list', () => {
      const { getByTestId } = render(
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
    test('filters items by search query (case-insensitive)', () => {
      const { getByTestId, queryByTestId } = render(
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
      fireEvent.changeText(searchbar, 'tom');

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Tomato');
      expect(queryByTestId(`${testId}::Item::1`)).toBeNull();
    });

    test('shows all items when search query is empty', () => {
      const { getByTestId } = render(
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

    test('shows no results message when no items match search', () => {
      const { getByTestId, getByText } = render(
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
      fireEvent.changeText(searchbar, 'xyz123notfound');

      expect(getByText('alerts.databasePicker.noResults')).toBeTruthy();
    });

    test('filters items correctly with partial matches', () => {
      const { getByTestId } = render(
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
      fireEvent.changeText(searchbar, 'an');

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Banana');
    });

    test('performs case-insensitive search', () => {
      const { getByTestId } = render(
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
      fireEvent.changeText(searchbar, 'APPLE');

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe('Apple');
    });
  });

  describe('empty state', () => {
    test('shows no results message when items array is empty', () => {
      const { getByText } = render(
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
    test('calls onSelect with correct item when list item is pressed', () => {
      const { getByTestId } = render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.press(getByTestId(`${testId}::Item::1`));

      expect(mockOnSelect).toHaveBeenCalledWith(mockItems[1]);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    test('clears search query when item is selected', () => {
      const { getByTestId } = render(
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
      fireEvent.changeText(searchbar, 'tom');

      const textInput = getByTestId(`${testId}::Searchbar::TextInput`);
      expect(textInput.props.value).toBe('tom');

      fireEvent.press(getByTestId(`${testId}::Item::0`));

      expect(textInput.props.value).toBe('');
    });
  });

  describe('dismiss behavior', () => {
    test('calls onDismiss when cancel button is pressed', () => {
      const { getByTestId } = render(
        <DatabasePickerDialog
          testId={testId}
          isVisible={true}
          title='Select an item'
          items={mockItems}
          onSelect={mockOnSelect}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.press(getByTestId(`${testId}::CancelButton`));

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    test('clears search query when dialog is dismissed', () => {
      const { getByTestId } = render(
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
      fireEvent.changeText(searchbarInput, 'search text');

      expect(searchbarInput.props.value).toBe('search text');

      fireEvent.press(getByTestId(`${testId}::CancelButton`));

      expect(searchbarInput.props.value).toBe('');
    });
  });

  describe('edge cases', () => {
    test('handles items with very long names', () => {
      const longNameItem = {
        id: 99,
        name: 'Very Long Item Name That Should Be Truncated Or Handled Properly In The UI Component',
        type: ingredientType.vegetable,
        unit: 'kg',
        season: [],
      };

      const { getByTestId } = render(
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

    test('handles special characters in search query', () => {
      const specialItem = {
        id: 100,
        name: 'Item-with-special_chars',
        type: ingredientType.vegetable,
        unit: 'kg',
        season: [],
      };

      const { getByTestId } = render(
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
      fireEvent.changeText(searchbar, 'special_chars');

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe(specialItem.name);
    });

    test('handles accented characters in search', () => {
      const accentedItem = {
        id: 101,
        name: 'Café',
        type: ingredientType.vegetable,
        unit: 'kg',
        season: [],
      };

      const { getByTestId } = render(
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
      fireEvent.changeText(searchbar, 'café');

      expect(getByTestId(`${testId}::Item::0::Title`).props.children).toBe(accentedItem.name);
    });
  });

  describe('FlashList integration', () => {
    test('uses correct keyExtractor for items', () => {
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

      const { getByTestId } = render(
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
  });
});
