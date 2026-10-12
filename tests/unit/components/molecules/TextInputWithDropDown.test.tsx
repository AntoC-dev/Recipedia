import React, { act } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { Divider, Surface, TouchableRipple } from 'react-native-paper';
import TextInputWithDropDown, {
  AUTOCOMPLETE_ANCHOR_ID,
  AUTOCOMPLETE_DIVIDER_THICKNESS,
  AUTOCOMPLETE_MAX_VISIBLE_ROWS,
  AUTOCOMPLETE_ROW_HEIGHT,
  AUTOCOMPLETE_TAIL_INSET,
  AutocompleteBubble,
  getAutocompleteBubbleHeight,
  getAutocompleteListHeight,
  splitHighlight,
  TextInputWithDropDownType,
} from '@components/molecules/TextInputWithDropDown';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { scrollDecelerationRate } from '@utils/Constants';

jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').CustomTextInputMock,
}));

const inputId = 'TextInputWithDropDown::CustomTextInput';
const listId = 'TextInputWithDropDown::AutocompleteList';
const tailId = 'TextInputWithDropDown::AutocompleteTail';
const viewportId = 'TextInputWithDropDown::AutocompleteViewport';
const itemId = (item: string) => `TextInputWithDropDown::AutocompleteItem::${item}`;
const matchId = (item: string) => `TextInputWithDropDown::AutocompleteMatch::${item}`;

function isHostNode(node: { type: unknown }) {
  return typeof node.type === 'string';
}

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

async function typeText(input: ReturnType<typeof render>['getByTestId'], text: string) {
  await act(async () => {
    fireEvent.changeText(input(inputId), text);
  });
}

describe('splitHighlight', () => {
  test('splits around the first case-insensitive match keeping original casing', () => {
    expect(splitHighlight('Basil Leaves', 'LEA')).toEqual({
      before: 'Basil ',
      match: 'Lea',
      after: 'ves',
    });
  });

  test('uses only the first occurrence', () => {
    expect(splitHighlight('banana', 'an')).toEqual({ before: 'b', match: 'an', after: 'ana' });
  });

  test('returns the whole text as before when the query is empty', () => {
    expect(splitHighlight('Pasta', '')).toEqual({ before: 'Pasta', match: '', after: '' });
  });

  test('returns empty parts when the text is empty', () => {
    expect(splitHighlight('', 'xyz')).toEqual({ before: '', match: '', after: '' });
  });

  test('returns the whole text as before when the query is absent', () => {
    expect(splitHighlight('Pasta', 'xyz')).toEqual({ before: 'Pasta', match: '', after: '' });
  });
});

describe('getAutocompleteListHeight', () => {
  test('is zero for no items', () => {
    expect(getAutocompleteListHeight(0)).toBe(0);
  });

  test('is one row height for a single item', () => {
    expect(getAutocompleteListHeight(1)).toBe(AUTOCOMPLETE_ROW_HEIGHT);
  });

  test('grows by one row height and one divider per item below the visible cap', () => {
    expect(getAutocompleteListHeight(2)).toBe(
      2 * AUTOCOMPLETE_ROW_HEIGHT + AUTOCOMPLETE_DIVIDER_THICKNESS
    );
  });

  test('is capped at the max visible rows', () => {
    const cappedHeight =
      AUTOCOMPLETE_MAX_VISIBLE_ROWS * AUTOCOMPLETE_ROW_HEIGHT +
      (AUTOCOMPLETE_MAX_VISIBLE_ROWS - 1) * AUTOCOMPLETE_DIVIDER_THICKNESS;
    expect(getAutocompleteListHeight(AUTOCOMPLETE_MAX_VISIBLE_ROWS)).toBe(cappedHeight);
    expect(getAutocompleteListHeight(300)).toBe(cappedHeight);
  });
});

describe('getAutocompleteBubbleHeight', () => {
  test('adds the tail space and the surface vertical padding to the list height', () => {
    const { getByTestId, UNSAFE_getByType } = render(
      <AutocompleteBubble
        testID='TextInputWithDropDown'
        items={['A', 'B', 'C', 'D', 'E']}
        query=''
        onSelect={jest.fn()}
      />
    );
    const tailSpace = StyleSheet.flatten(
      getByTestId('TextInputWithDropDown::AutocompleteBubble').props.style
    ).marginTop as number;
    const surfacePadding = StyleSheet.flatten(UNSAFE_getByType(Surface).props.style)
      .paddingVertical as number;

    expect(getAutocompleteBubbleHeight(5)).toBe(
      tailSpace + 2 * surfacePadding + getAutocompleteListHeight(5)
    );
  });

  test('is capped like the list height', () => {
    expect(getAutocompleteBubbleHeight(300)).toBe(
      getAutocompleteBubbleHeight(AUTOCOMPLETE_MAX_VISIBLE_ROWS)
    );
  });
});

describe('AutocompleteBubble', () => {
  const manyItems = Array.from({ length: 300 }, (_, index) => `Tag ${index}`);

  function renderBubble(items: string[], query = '') {
    return render(
      <AutocompleteBubble
        testID='TextInputWithDropDown'
        items={items}
        query={query}
        onSelect={jest.fn()}
      />
    );
  }

  test('keeps taps and nested scrolling working inside the form scroll view', () => {
    const list = renderBubble(['A', 'B']).getByTestId(listId);

    expect(list.props.keyboardShouldPersistTaps).toBe('handled');
    expect(list.props.nestedScrollEnabled).toBe(true);
  });

  test('uses the app scroll deceleration rate', () => {
    const list = renderBubble(['A', 'B']).getByTestId(listId);

    expect(list.props.decelerationRate).toBe(scrollDecelerationRate);
  });

  test('does not draw rows beyond the visible area', () => {
    const list = renderBubble(['A', 'B']).getByTestId(listId);

    expect(list.props.drawDistance).toBe(0);
  });

  test('renders every row at the row height without a border', () => {
    const { getByTestId } = renderBubble(['A', 'B']);

    for (const item of ['A', 'B']) {
      const rowStyle = StyleSheet.flatten(getByTestId(itemId(item)).props.style);
      expect(rowStyle.height).toBe(AUTOCOMPLETE_ROW_HEIGHT);
      expect(rowStyle.borderTopWidth).toBeUndefined();
    }
  });

  test('exposes each row as a labelled button', () => {
    const { getByTestId } = renderBubble(['A', 'B']);

    const row = getByTestId(itemId('B'));
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toBe('B');
  });

  test('renders a row for an empty suggestion without a highlight', () => {
    const { getByTestId, queryByTestId } = renderBubble(['', 'A'], 'A');

    expect(getByTestId(itemId(''))).toBeTruthy();
    expect(queryByTestId(matchId(''))).toBeNull();
    expect(within(getByTestId(matchId('A'))).queryByText('A')).not.toBeNull();
  });

  test('renders every row of duplicated suggestions', () => {
    const { getAllByTestId } = renderBubble(['A', 'A']);

    expect(getAllByTestId(itemId('A'))).toHaveLength(2);
  });

  test('renders a bold divider between rows and none after the last', () => {
    const { UNSAFE_getAllByType } = renderBubble(['A', 'B', 'C']);

    const dividers = UNSAFE_getAllByType(Divider);
    expect(dividers).toHaveLength(2);
    expect(dividers.every(divider => divider.props.bold === true)).toBe(true);
  });

  test('renders no divider for a single row', () => {
    const { UNSAFE_queryAllByType } = renderBubble(['A']);

    expect(UNSAFE_queryAllByType(Divider)).toHaveLength(0);
  });

  test('renders rows as ripple touchables', () => {
    const { UNSAFE_getAllByType } = renderBubble(['A', 'B']);

    expect(UNSAFE_getAllByType(TouchableRipple).map(ripple => ripple.props.testID)).toEqual([
      itemId('A'),
      itemId('B'),
    ]);
  });

  test('does not mount rows far outside the bounded viewport', () => {
    const { getByTestId, queryByTestId } = renderBubble(manyItems);

    expect(getByTestId(itemId('Tag 0'))).toBeTruthy();
    expect(queryByTestId(itemId('Tag 299'))).toBeNull();
  });

  test('bounds the list container to the capped height', () => {
    const { getByTestId } = renderBubble(manyItems);

    expect(StyleSheet.flatten(getByTestId(viewportId).props.style)).toEqual(
      expect.objectContaining({ height: getAutocompleteListHeight(AUTOCOMPLETE_MAX_VISIBLE_ROWS) })
    );
  });

  test('places the tail at the default inset', () => {
    const { getByTestId } = renderBubble(['A']);

    expect(StyleSheet.flatten(getByTestId(tailId).props.style).left).toBe(AUTOCOMPLETE_TAIL_INSET);
  });

  test('highlights the matching part of each suggestion', () => {
    const { getByTestId, queryByTestId } = renderBubble(['Pasta', 'Salmon'], 'as');

    expect(getByTestId(matchId('Pasta')).props.children).toBe('as');
    expect(queryByTestId(matchId('Salmon'))).toBeNull();
  });

  test('calls onSelect with the pressed suggestion', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <AutocompleteBubble
        testID='TextInputWithDropDown'
        items={['A', 'B']}
        query=''
        onSelect={onSelect}
      />
    );

    fireEvent.press(getByTestId(itemId('B')));

    expect(onSelect).toHaveBeenCalledWith('B');
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
    test('renders input without dropdown when not focused', () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      expect(getByTestId(inputId)).toBeTruthy();
      expect(queryByTestId(listId)).toBeNull();
    });

    test('renders with initial value from props', () => {
      const { getByTestId } = render(
        <TextInputWithDropDown {...defaultProps} value='Initial Value' />
      );

      expect(getByTestId(inputId).props.value).toEqual('Initial Value');
    });

    test('wraps the field and its bubble in a single autocomplete anchor', async () => {
      const { getByTestId, UNSAFE_getAllByProps } = render(
        <TextInputWithDropDown {...defaultProps} />
      );

      await typeText(getByTestId, 'past');

      const anchors = UNSAFE_getAllByProps({ nativeID: AUTOCOMPLETE_ANCHOR_ID }).filter(isHostNode);
      expect(anchors).toHaveLength(1);
      expect(within(anchors[0]!).getByTestId(inputId)).toBeTruthy();
      expect(within(anchors[0]!).getByTestId(itemId('Pasta'))).toBeTruthy();
    });
  });

  describe('dropdown visibility', () => {
    test('shows dropdown when typing matching text', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');

      await waitFor(() => expect(getByTestId(itemId('Pasta'))).toBeTruthy());
    });

    test('shows dropdown on focus when text has matches', async () => {
      const { getByTestId, queryByTestId } = render(
        <TextInputWithDropDown {...defaultProps} value='Sal' />
      );

      expect(queryByTestId(listId)).toBeNull();

      await act(async () => {
        fireEvent(getByTestId(inputId), 'focus');
      });

      await waitFor(() => expect(getByTestId(itemId('Salmon'))).toBeTruthy());
    });

    test('calls onFocus when the input gains focus', async () => {
      const onFocus = jest.fn();
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} onFocus={onFocus} />);

      await act(async () => {
        fireEvent(getByTestId(inputId), 'focus');
      });

      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    test('hides dropdown when no matching items', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'nonexistentitem');

      expect(getByTestId(inputId).props.value).toEqual('nonexistentitem');
      expect(queryByTestId(listId)).toBeNull();
    });

    test('hides dropdown when text matches exactly one item', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'pasta');

      expect(getByTestId(inputId).props.value).toEqual('pasta');
      expect(queryByTestId(listId)).toBeNull();
    });

    test('keeps dropdown when the exact text also prefixes other items', async () => {
      const { getByTestId } = render(
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
      const { getByTestId } = render(
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
      const { getByTestId } = render(
        <TextInputWithDropDown {...defaultProps} onChangeText={mockOnChangeText} />
      );

      await typeText(getByTestId, 'past');
      mockOnChangeText.mockClear();

      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });

      expect(mockOnChangeText).toHaveBeenCalledWith('Pasta');
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
    });

    test('does not throw when onChangeText is not provided', async () => {
      const { getByTestId } = render(
        <TextInputWithDropDown {...defaultProps} onChangeText={undefined} />
      );

      await expect(typeText(getByTestId, 'test')).resolves.not.toThrow();
    });
  });

  describe('item selection', () => {
    test('dismisses the keyboard when an item is selected', async () => {
      const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });

      expect(dismissSpy).toHaveBeenCalled();
      dismissSpy.mockRestore();
    });

    test('calls onValidate exactly once when endEditing fires after dropdown selection', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });

      expect(mockOnValidate).toHaveBeenCalledTimes(1);
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
    });

    test('validates again on a later endEditing after a selection', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });

      expect(mockOnValidate).toHaveBeenCalledTimes(2);
    });

    test('validates the next edit after picking from a dropdown left open on an unfocused input', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });
      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });
      mockOnValidate.mockClear();

      await act(async () => {
        fireEvent(getByTestId(inputId), 'focus');
      });
      await typeText(getByTestId, 'custom text');
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });

      expect(mockOnValidate).toHaveBeenCalledWith('custom text');
    });

    test('selects item and closes the dropdown when pressing an item', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });

      expect(getByTestId(inputId).props.value).toEqual('Pasta');
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
      expect(queryByTestId(listId)).toBeNull();
    });

    test('calls onValidate on end editing', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'custom text');
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });

      expect(mockOnValidate).toHaveBeenCalledWith('custom text');
    });

    test('routes a dropdown pick through onSelect (not onChangeText/onValidate) when onSelect is provided', async () => {
      const onSelect = jest.fn();
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <TextInputWithDropDown {...defaultProps} onChangeText={onChangeText} onSelect={onSelect} />
      );

      await typeText(getByTestId, 'past');
      onChangeText.mockClear();

      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('Pasta');
      expect(mockOnValidate).not.toHaveBeenCalled();
      expect(onChangeText).not.toHaveBeenCalled();
    });

    test('works without onValidate callback', async () => {
      const { getByTestId } = render(
        <TextInputWithDropDown {...defaultProps} onValidate={undefined} />
      );

      await typeText(getByTestId, 'past');
      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });
      await act(async () => {
        fireEvent(getByTestId(inputId), 'endEditing');
      });

      expect(getByTestId(inputId).props.value).toEqual('Pasta');
    });
  });

  describe('renderLayout', () => {
    test('lets the parent place the field and the bubble', async () => {
      const { getByTestId } = render(<SlotHost {...defaultProps} />);

      await typeText(getByTestId, 'past');

      expect(within(getByTestId('Field')).getByTestId(inputId)).toBeTruthy();
      expect(within(getByTestId('Field')).queryByTestId(listId)).toBeNull();
      expect(within(getByTestId('Slot')).getByTestId(itemId('Pasta'))).toBeTruthy();
      expect(within(getByTestId('Slot')).getAllByTestId(listId)).toHaveLength(1);
    });

    test('anchors only the field, not the slotted bubble', async () => {
      const { getByTestId, UNSAFE_getAllByProps } = render(<SlotHost {...defaultProps} />);

      await typeText(getByTestId, 'past');

      const anchors = UNSAFE_getAllByProps({ nativeID: AUTOCOMPLETE_ANCHOR_ID }).filter(isHostNode);
      expect(anchors).toHaveLength(1);
      expect(within(anchors[0]!).getByTestId(inputId)).toBeTruthy();
      expect(within(anchors[0]!).queryByTestId(itemId('Pasta'))).toBeNull();
    });

    test('keeps the slotted suggestions in sync with the typed text', async () => {
      const { getByTestId, queryByTestId } = render(
        <SlotHost {...defaultProps} referenceTextArray={['Apple', 'Apricot', 'Banana']} />
      );

      await typeText(getByTestId, 'ap');
      expect(getByTestId(itemId('Apricot'))).toBeTruthy();

      await typeText(getByTestId, 'apr');
      expect(getByTestId(itemId('Apricot'))).toBeTruthy();
      expect(queryByTestId(itemId('Apple'))).toBeNull();
    });

    test('clears the slot when the dropdown hides', async () => {
      const { getByTestId, queryByTestId } = render(<SlotHost {...defaultProps} />);

      await typeText(getByTestId, 'past');
      await typeText(getByTestId, 'nonexistentitem');

      expect(queryByTestId(listId)).toBeNull();
    });

    test('routes a slotted pick to the latest onSelect prop', async () => {
      const staleOnSelect = jest.fn();
      const latestOnSelect = jest.fn();
      const { getByTestId, rerender } = render(
        <SlotHost {...defaultProps} onSelect={staleOnSelect} />
      );

      await typeText(getByTestId, 'past');
      rerender(<SlotHost {...defaultProps} onSelect={latestOnSelect} />);

      await act(async () => {
        fireEvent.press(getByTestId(itemId('Pasta')));
      });

      expect(staleOnSelect).not.toHaveBeenCalled();
      expect(latestOnSelect).toHaveBeenCalledWith('Pasta');
      expect(getByTestId(inputId).props.value).toEqual('Pasta');
    });
  });

  describe('external value changes', () => {
    test('syncs internal state when value prop changes externally', () => {
      const { getByTestId, rerender } = render(
        <TextInputWithDropDown {...defaultProps} value='Initial' />
      );

      rerender(<TextInputWithDropDown {...defaultProps} value='Updated Value' />);

      expect(getByTestId(inputId).props.value).toEqual('Updated Value');
    });

    test('handles value changing to undefined', () => {
      const { getByTestId, rerender } = render(
        <TextInputWithDropDown {...defaultProps} value='Initial' />
      );

      rerender(<TextInputWithDropDown {...defaultProps} value={undefined} />);

      expect(getByTestId(inputId).props.value).toEqual('');
    });
  });

  describe('filtering', () => {
    test('filters items case-insensitively', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await typeText(getByTestId, 'PAST');

      expect(getByTestId(itemId('Pasta'))).toBeTruthy();
      expect(queryByTestId(itemId('Salmon'))).toBeNull();
    });

    test('shows multiple matching items', async () => {
      const { getByTestId } = render(
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
      const { getByTestId, queryByTestId } = render(
        <TextInputWithDropDown {...defaultProps} referenceTextArray={[]} />
      );

      await typeText(getByTestId, 'test');

      expect(queryByTestId(listId)).toBeNull();
    });

    test('handles rapid text changes', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      await act(async () => {
        fireEvent.changeText(getByTestId(inputId), 'p');
        fireEvent.changeText(getByTestId(inputId), 'pa');
        fireEvent.changeText(getByTestId(inputId), 'past');
      });
      expect(getByTestId(itemId('Pasta'))).toBeTruthy();

      await typeText(getByTestId, 'xyz');
      expect(queryByTestId(listId)).toBeNull();
    });
  });
});
