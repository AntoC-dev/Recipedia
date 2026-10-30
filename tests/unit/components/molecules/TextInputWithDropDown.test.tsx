import React, { act } from 'react';
import { Keyboard, View } from 'react-native';
import { fireEvent, render, waitFor, within, RenderResult } from '@testing-library/react-native';
import {
  TextInputWithDropDown,
  AUTOCOMPLETE_ANCHOR_ID,
  filterSuggestions,
  TextInputWithDropDownType,
} from '@components/molecules/TextInputWithDropDown';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';

jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));

const inputId = 'TextInputWithDropDown::CustomTextInput';
const listId = 'TextInputWithDropDown::AutocompleteList';
const itemId = (item: string) => `TextInputWithDropDown::AutocompleteItem::${item}`;

function SlotHost(props: TextInputWithDropDownType) {
  return (
    <TextInputWithDropDown
      {...props}
      renderLayout={(field, dropdown) => (
        <View>
          <View testID='Field'>{field}</View>
          <View testID='Slot'>{dropdown}</View>
        </View>
      )}
    />
  );
}

async function typeText(input: RenderResult['getByTestId'], text: string) {
  await fireEvent.changeText(input(inputId), text);
}

describe('filterSuggestions', () => {
  const reference = ['Pasta', 'Pastis', 'Salmon', 'Basil'];

  test('keeps case-insensitive substring matches in reference order', () => {
    expect(filterSuggestions(reference, 'AS')).toEqual(['Pasta', 'Pastis', 'Basil']);
  });

  test('returns every suggestion for empty text', () => {
    expect(filterSuggestions(reference, '')).toEqual(reference);
  });

  test('returns nothing when no suggestion matches', () => {
    expect(filterSuggestions(reference, 'xyz')).toEqual([]);
  });

  test('returns nothing when the only match equals the text ignoring case', () => {
    expect(filterSuggestions(reference, 'salmon')).toEqual([]);
  });

  test('keeps an exact match when other suggestions also match', () => {
    expect(filterSuggestions(['Pasta', 'Pasta sauce'], 'pasta')).toEqual(['Pasta', 'Pasta sauce']);
  });

  test('keeps duplicated exact matches', () => {
    expect(filterSuggestions(['Salmon', 'Salmon'], 'salmon')).toEqual(['Salmon', 'Salmon']);
  });

  test('keeps a single partial match', () => {
    expect(filterSuggestions(reference, 'salm')).toEqual(['Salmon']);
  });

  test('returns nothing for an empty reference', () => {
    expect(filterSuggestions([], 'pa')).toEqual([]);
  });
});

describe('TextInputWithDropDown Component', () => {
  const mockOnValidate = jest.fn();
  const dbInstance = RecipeDatabase.getInstance();

  const defaultProps: TextInputWithDropDownType = {
    testID: 'TextInputWithDropDown',
    referenceTextArray: [],
    label: 'Ingredient',
    onValidate: mockOnValidate,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
    await dbInstance.addMultipleRecipes(testRecipes);
    defaultProps.referenceTextArray = dbInstance
      .get_ingredients()
      .map(ingredient => ingredient.name)
      .sort();
  });

  afterEach(async () => {
    await dbInstance.closeAndReset();
  });

  describe('rendering', () => {
    test('renders input without dropdown when not focused', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} />
      );

      expect(getByTestId(inputId)).toBeTruthy();
      expect(queryByTestId(listId)).toBeNull();
    });

    test('renders with initial value from props', async () => {
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} value='Initial Value' />
      );

      expect(getByTestId(inputId).props.value).toEqual('Initial Value');
    });

    test('wraps the field and its bubble in a single autocomplete anchor', async () => {
      const { getByTestId, container } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');

      const anchors = container.queryAll(node => node.props.nativeID === AUTOCOMPLETE_ANCHOR_ID);
      expect(anchors).toHaveLength(1);
      expect(within(anchors[0]!).getByTestId(inputId)).toBeTruthy();
      expect(within(anchors[0]!).getByTestId(itemId('Pasta'))).toBeTruthy();
    });
  });

  describe('dropdown visibility', () => {
    test('shows dropdown when typing matching text', async () => {
      const { getByTestId } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');

      await waitFor(() => expect(getByTestId(itemId('Pasta'))).toBeTruthy());
    });

    test('shows dropdown on focus when text has matches', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} value='Sal' />
      );

      expect(queryByTestId(listId)).toBeNull();

      await fireEvent(getByTestId(inputId), 'focus');

      await waitFor(() => expect(getByTestId(itemId('Salmon'))).toBeTruthy());
    });

    test('calls onFocus when the input gains focus', async () => {
      const onFocus = jest.fn();
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} onFocus={onFocus} />
      );

      await fireEvent(getByTestId(inputId), 'focus');

      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    test('hides dropdown when no matching items', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} />
      );

      await typeText(getByTestId, 'nonexistentitem');

      expect(getByTestId(inputId).props.value).toEqual('nonexistentitem');
      expect(queryByTestId(listId)).toBeNull();
    });

    test('hides dropdown when text matches exactly one item', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} />
      );

      await typeText(getByTestId, 'pasta');

      expect(getByTestId(inputId).props.value).toEqual('pasta');
      expect(queryByTestId(listId)).toBeNull();
    });

    test('keeps dropdown when the exact text also prefixes other items', async () => {
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} referenceTextArray={['Salt', 'Salted Butter']} />
      );

      await typeText(getByTestId, 'Salt');

      expect(getByTestId(itemId('Salt'))).toBeTruthy();
      expect(getByTestId(itemId('Salted Butter'))).toBeTruthy();
    });
  });

  describe('onChangeText callback', () => {
    test('fires onChangeText on every keystroke with the typed text', async () => {
      const mockOnChangeText = jest.fn();
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} onChangeText={mockOnChangeText} />
      );

      await typeText(getByTestId, 'p');
      await typeText(getByTestId, 'pa');
      await typeText(getByTestId, 'pas');

      expect(mockOnChangeText).toHaveBeenCalledTimes(3);
      expect(mockOnChangeText).toHaveBeenNthCalledWith(1, 'p');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(2, 'pa');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(3, 'pas');
    });

    test('fires both onChangeText and onValidate when a dropdown item is selected', async () => {
      const mockOnChangeText = jest.fn();
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} onChangeText={mockOnChangeText} />
      );

      await typeText(getByTestId, 'past');
      mockOnChangeText.mockClear();

      await fireEvent.press(getByTestId(itemId('Pasta')));

      expect(mockOnChangeText).toHaveBeenCalledWith('Pasta');
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
    });

    test('does not throw when onChangeText is not provided', async () => {
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} onChangeText={undefined} />
      );

      await expect(typeText(getByTestId, 'test')).resolves.not.toThrow();
    });
  });

  describe('item selection', () => {
    test('dismisses the keyboard when an item is selected', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
      const { getByTestId } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await fireEvent.press(getByTestId(itemId('Pasta')));

      expect(dismissSpy).toHaveBeenCalled();
      dismissSpy.mockRestore();
    });

    test('calls onValidate exactly once when endEditing fires after dropdown selection', async () => {
      const { getByTestId } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await fireEvent.press(getByTestId(itemId('Pasta')));
      await fireEvent(getByTestId(inputId), 'endEditing');

      expect(mockOnValidate).toHaveBeenCalledTimes(1);
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
    });

    test('validates again on a later endEditing after a selection', async () => {
      const { getByTestId } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await fireEvent.press(getByTestId(itemId('Pasta')));
      await fireEvent(getByTestId(inputId), 'endEditing');
      await fireEvent(getByTestId(inputId), 'endEditing');

      expect(mockOnValidate).toHaveBeenCalledTimes(2);
    });

    test('validates the next edit after picking from a dropdown left open on an unfocused input', async () => {
      const { getByTestId } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await fireEvent(getByTestId(inputId), 'endEditing');
      await fireEvent.press(getByTestId(itemId('Pasta')));
      mockOnValidate.mockClear();

      await fireEvent(getByTestId(inputId), 'focus');
      await typeText(getByTestId, 'custom text');
      await fireEvent(getByTestId(inputId), 'endEditing');

      expect(mockOnValidate).toHaveBeenCalledWith('custom text');
    });

    test('selects item and closes the dropdown when pressing an item', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} />
      );

      await typeText(getByTestId, 'past');
      await fireEvent.press(getByTestId(itemId('Pasta')));

      expect(getByTestId(inputId).props.value).toEqual('Pasta');
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
      expect(queryByTestId(listId)).toBeNull();
    });

    test('calls onValidate on end editing', async () => {
      const { getByTestId } = await render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'custom text');
      await fireEvent(getByTestId(inputId), 'endEditing');

      expect(mockOnValidate).toHaveBeenCalledWith('custom text');
    });

    test('routes a dropdown pick through onSelect (not onChangeText/onValidate) when onSelect is provided', async () => {
      const onSelect = jest.fn();
      const onChangeText = jest.fn();
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} onChangeText={onChangeText} onSelect={onSelect} />
      );

      await typeText(getByTestId, 'past');
      onChangeText.mockClear();

      await fireEvent.press(getByTestId(itemId('Pasta')));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('Pasta');
      expect(mockOnValidate).not.toHaveBeenCalled();
      expect(onChangeText).not.toHaveBeenCalled();
    });

    test('works without onValidate callback', async () => {
      const { getByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} onValidate={undefined} />
      );

      await typeText(getByTestId, 'past');
      await fireEvent.press(getByTestId(itemId('Pasta')));
      await fireEvent(getByTestId(inputId), 'endEditing');
      await fireEvent(getByTestId(inputId), 'endEditing');

      expect(getByTestId(inputId).props.value).toEqual('Pasta');
    });
  });

  describe('renderLayout', () => {
    test('lets the parent place the field and the bubble', async () => {
      const { getByTestId } = await render(<SlotHost {...defaultProps} />);

      await typeText(getByTestId, 'past');

      expect(within(getByTestId('Field')).getByTestId(inputId)).toBeTruthy();
      expect(within(getByTestId('Field')).queryByTestId(listId)).toBeNull();
      expect(within(getByTestId('Slot')).getByTestId(itemId('Pasta'))).toBeTruthy();
      expect(within(getByTestId('Slot')).getAllByTestId(listId)).toHaveLength(1);
    });

    test('anchors only the field, not the slotted bubble', async () => {
      const { getByTestId, container } = await render(<SlotHost {...defaultProps} />);

      await typeText(getByTestId, 'past');

      const anchors = container.queryAll(node => node.props.nativeID === AUTOCOMPLETE_ANCHOR_ID);
      expect(anchors).toHaveLength(1);
      expect(within(anchors[0]!).getByTestId(inputId)).toBeTruthy();
      expect(within(anchors[0]!).queryByTestId(itemId('Pasta'))).toBeNull();
    });

    test('keeps the slotted suggestions in sync with the typed text', async () => {
      const { getByTestId, queryByTestId } = await render(
        <SlotHost {...defaultProps} referenceTextArray={['Apple', 'Apricot', 'Banana']} />
      );

      await typeText(getByTestId, 'ap');
      expect(getByTestId(itemId('Apricot'))).toBeTruthy();

      await typeText(getByTestId, 'apr');
      expect(getByTestId(itemId('Apricot'))).toBeTruthy();
      expect(queryByTestId(itemId('Apple'))).toBeNull();
    });

    test('clears the slot when the dropdown hides', async () => {
      const { getByTestId, queryByTestId } = await render(<SlotHost {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await typeText(getByTestId, 'nonexistentitem');

      expect(queryByTestId(listId)).toBeNull();
    });

    test('routes a slotted pick to the latest onSelect prop', async () => {
      const staleOnSelect = jest.fn();
      const latestOnSelect = jest.fn();
      const { getByTestId, rerender } = await render(
        <SlotHost {...defaultProps} onSelect={staleOnSelect} />
      );

      await typeText(getByTestId, 'past');
      await rerender(<SlotHost {...defaultProps} onSelect={latestOnSelect} />);

      await fireEvent.press(getByTestId(itemId('Pasta')));

      expect(staleOnSelect).not.toHaveBeenCalled();
      expect(latestOnSelect).toHaveBeenCalledWith('Pasta');
      expect(getByTestId(inputId).props.value).toEqual('Pasta');
    });
  });

  describe('external value changes', () => {
    test('syncs internal state when value prop changes externally', async () => {
      const { getByTestId, rerender } = await render(
        <TextInputWithDropDown {...defaultProps} value='Initial' />
      );

      await rerender(<TextInputWithDropDown {...defaultProps} value='Updated Value' />);

      expect(getByTestId(inputId).props.value).toEqual('Updated Value');
    });

    test('handles value changing to undefined', async () => {
      const { getByTestId, rerender } = await render(
        <TextInputWithDropDown {...defaultProps} value='Initial' />
      );

      await rerender(<TextInputWithDropDown {...defaultProps} value={undefined} />);

      expect(getByTestId(inputId).props.value).toEqual('');
    });
  });

  describe('filtering', () => {
    test('filters items case-insensitively', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} />
      );

      await typeText(getByTestId, 'PAST');

      expect(getByTestId(itemId('Pasta'))).toBeTruthy();
      expect(queryByTestId(itemId('Salmon'))).toBeNull();
    });

    test('shows multiple matching items', async () => {
      const { getByTestId } = await render(
        <TextInputWithDropDown
          {...defaultProps}
          referenceTextArray={['Apple', 'Apricot', 'Banana']}
        />
      );

      await typeText(getByTestId, 'ap');

      expect(getByTestId(itemId('Apple'))).toBeTruthy();
      expect(getByTestId(itemId('Apricot'))).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    test('handles empty reference array', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} referenceTextArray={[]} />
      );

      await typeText(getByTestId, 'test');

      expect(queryByTestId(listId)).toBeNull();
    });

    test('handles rapid text changes', async () => {
      const { getByTestId, queryByTestId } = await render(
        <TextInputWithDropDown {...defaultProps} />
      );

      await act(async () => {
        await fireEvent.changeText(getByTestId(inputId), 'p');
        await fireEvent.changeText(getByTestId(inputId), 'pa');
        await fireEvent.changeText(getByTestId(inputId), 'past');
      });
      expect(getByTestId(itemId('Pasta'))).toBeTruthy();

      await typeText(getByTestId, 'xyz');
      expect(queryByTestId(listId)).toBeNull();
    });
  });
});
