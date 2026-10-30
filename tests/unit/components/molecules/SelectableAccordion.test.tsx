import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  SelectableAccordion,
  SelectableAccordionProps,
} from '@components/molecules/SelectableAccordion';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockOnPress = jest.fn();
const mockOnToggleAll = jest.fn();

const singleSelectItems = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

const multiSelectItems = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
];

describe('SelectableAccordion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders title in accordion header', async () => {
    const props: SelectableAccordionProps = {
      testID: 'TestAccordion',
      title: 'Pick a fruit',
      items: singleSelectItems,
      selectedValues: [],
      onPress: mockOnPress,
    };

    const { getByTestId } = await render(<SelectableAccordion {...props} />);

    expect(getByTestId('TestAccordion::Title').props.children).toBe('Pick a fruit');
  });

  test('toggling accordion fires onPress on header', async () => {
    const props: SelectableAccordionProps = {
      testID: 'TestAccordion',
      title: 'Fruit',
      items: singleSelectItems,
      selectedValues: [],
      onPress: mockOnPress,
    };

    const { getByTestId } = await render(<SelectableAccordion {...props} />);

    await fireEvent.press(getByTestId('TestAccordion::Header'));

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  describe('description', () => {
    test('shows selected labels joined with comma in multi-select', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Seasonality',
        items: multiSelectItems,
        selectedValues: ['1', '3'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('January, March');
    });

    test('shows selected label in single-select', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: ['banana'],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('Banana');
    });

    test('shows empty description when nothing selected in multi-select', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Seasonality',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('');
    });

    test('shows empty description when nothing selected in single-select', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('');
    });

    test('shows allSelectedLabel when all items are selected', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Seasonality',
        items: multiSelectItems,
        selectedValues: ['1', '2', '3'],
        onPress: mockOnPress,
        multiSelect: true,
        allSelectedLabel: 'All year',
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('All year');
    });

    test('shows individual labels when not all items are selected even with allSelectedLabel', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Seasonality',
        items: multiSelectItems,
        selectedValues: ['1', '3'],
        onPress: mockOnPress,
        multiSelect: true,
        allSelectedLabel: 'All year',
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('January, March');
    });

    test('shows joined labels when all selected but no allSelectedLabel', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Seasonality',
        items: multiSelectItems,
        selectedValues: ['1', '2', '3'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe(
        'January, February, March'
      );
    });

    test('preserves item order in description regardless of selection order', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Seasonality',
        items: multiSelectItems,
        selectedValues: ['3', '1'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('January, March');
    });

    test('ignores selectedValues that do not match any item', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: ['nonexistent'],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('');
    });
  });

  describe('single-select mode', () => {
    test('pressing an item calls onPress with its value', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: ['apple'],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      await fireEvent.press(getByTestId('TestAccordion::banana'));

      expect(mockOnPress).toHaveBeenCalledWith('banana');
    });

    test('RadioButton.Group receives value matching selectedValues[0]', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: ['cherry'],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::RadioGroup').props.value).toBe('cherry');
    });

    test('RadioButton.Group receives empty string when no value selected', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::RadioGroup').props.value).toBe('');
    });

    test('renders all items', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      for (const item of singleSelectItems) {
        expect(getByTestId('TestAccordion::' + item.value)).toBeTruthy();
      }
    });

    test('renders FlatList with correct testID', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::List')).toBeTruthy();
    });

    test('does not render RadioGroup in multi-select mode', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { queryByTestId } = await render(<SelectableAccordion {...props} />);

      expect(queryByTestId('TestAccordion::RadioGroup')).toBeNull();
    });
  });

  describe('multi-select mode', () => {
    test('pressing a chip calls onPress with its value', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: ['1'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      await fireEvent.press(getByTestId('TestAccordion::2'));

      expect(mockOnPress).toHaveBeenCalledWith('2');
    });

    test('selected chips have selected=true', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: ['1', '3'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::1::Selected').props.children).toBe('true');
      expect(getByTestId('TestAccordion::3::Selected').props.children).toBe('true');
    });

    test('unselected chips have selected=false', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: ['1'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::2::Selected').props.children).toBe('false');
    });

    test('renders all items', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      for (const item of multiSelectItems) {
        expect(getByTestId('TestAccordion::' + item.value)).toBeTruthy();
      }
    });

    test('renders chip labels', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      for (const item of multiSelectItems) {
        expect(getByTestId('TestAccordion::' + item.value + '::Children').props.children).toBe(
          item.label
        );
      }
    });

    test('renders FlatList with correct testID', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::List')).toBeTruthy();
    });

    test('all chips are unselected when selectedValues is empty', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      for (const item of multiSelectItems) {
        expect(getByTestId('TestAccordion::' + item.value + '::Selected').props.children).toBe(
          'false'
        );
      }
    });

    test('all chips are selected when all values are in selectedValues', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: ['1', '2', '3'],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      for (const item of multiSelectItems) {
        expect(getByTestId('TestAccordion::' + item.value + '::Selected').props.children).toBe(
          'true'
        );
      }
    });
  });

  describe('toggle all button', () => {
    test('does not render button when onToggleAll is not provided', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { queryByTestId } = await render(<SelectableAccordion {...props} />);

      expect(queryByTestId('TestAccordion::ToggleAllButton')).toBeNull();
    });

    test('does not render button in single-select mode even with onToggleAll', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Fruit',
        items: singleSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        onToggleAll: mockOnToggleAll,
      };

      const { queryByTestId } = await render(<SelectableAccordion {...props} />);

      expect(queryByTestId('TestAccordion::ToggleAllButton')).toBeNull();
    });

    test('renders button in multi-select mode when onToggleAll is provided', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
        onToggleAll: mockOnToggleAll,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::ToggleAllButton')).toBeTruthy();
    });

    test('shows select_all label when not all items are selected', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: ['1'],
        onPress: mockOnPress,
        multiSelect: true,
        onToggleAll: mockOnToggleAll,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::ToggleAllButton::Children').props.children).toBe(
        'select_all'
      );
    });

    test('shows deselect_all label when all items are selected', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: ['1', '2', '3'],
        onPress: mockOnPress,
        multiSelect: true,
        onToggleAll: mockOnToggleAll,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::ToggleAllButton::Children').props.children).toBe(
        'deselect_all'
      );
    });

    test('shows select_all label when no items are selected', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
        onToggleAll: mockOnToggleAll,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::ToggleAllButton::Children').props.children).toBe(
        'select_all'
      );
    });

    test('pressing button calls onToggleAll', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Months',
        items: multiSelectItems,
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
        onToggleAll: mockOnToggleAll,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      await fireEvent.press(getByTestId('TestAccordion::ToggleAllButton'));

      expect(mockOnToggleAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('empty items', () => {
    test('renders with no items in single-select mode', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Empty',
        items: [],
        selectedValues: [],
        onPress: mockOnPress,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Title').props.children).toBe('Empty');
      expect(getByTestId('TestAccordion::Description').props.children).toBe('');
    });

    test('renders with no items in multi-select mode', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Empty',
        items: [],
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Title').props.children).toBe('Empty');
      expect(getByTestId('TestAccordion::Description').props.children).toBe('');
    });

    test('allSelectedLabel shown when items and selectedValues are both empty', async () => {
      const props: SelectableAccordionProps = {
        testID: 'TestAccordion',
        title: 'Empty',
        items: [],
        selectedValues: [],
        onPress: mockOnPress,
        multiSelect: true,
        allSelectedLabel: 'All',
      };

      const { getByTestId } = await render(<SelectableAccordion {...props} />);

      expect(getByTestId('TestAccordion::Description').props.children).toBe('All');
    });
  });
});
