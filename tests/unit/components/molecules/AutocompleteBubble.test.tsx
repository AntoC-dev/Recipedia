import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';
import { Divider, Surface, TouchableRipple } from 'react-native-paper';
import {
  AUTOCOMPLETE_DIVIDER_THICKNESS,
  AUTOCOMPLETE_MAX_VISIBLE_ROWS,
  AUTOCOMPLETE_ROW_HEIGHT,
  AUTOCOMPLETE_TAIL_INSET,
  AutocompleteBubble,
  getAutocompleteBubbleHeight,
  getAutocompleteListHeight,
  splitHighlight,
} from '@components/molecules/AutocompleteBubble';
import { scrollDecelerationRate } from '@utils/Constants';

const listId = 'AutocompleteBubble::AutocompleteList';
const tailId = 'AutocompleteBubble::AutocompleteTail';
const viewportId = 'AutocompleteBubble::AutocompleteViewport';
const itemId = (item: string) => `AutocompleteBubble::AutocompleteItem::${item}`;
const matchId = (item: string) => `AutocompleteBubble::AutocompleteMatch::${item}`;

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
        testID='AutocompleteBubble'
        items={['A', 'B', 'C', 'D', 'E']}
        query=''
        onSelect={jest.fn()}
      />
    );
    const tailSpace = StyleSheet.flatten(
      getByTestId('AutocompleteBubble::AutocompleteBubble').props.style
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

  function renderBubble(items: string[], query = '', onSelect = jest.fn()) {
    return render(
      <AutocompleteBubble
        testID='AutocompleteBubble'
        items={items}
        query={query}
        onSelect={onSelect}
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
    const { getByTestId } = renderBubble(['A', 'B'], '', onSelect);

    fireEvent.press(getByTestId(itemId('B')));

    expect(onSelect).toHaveBeenCalledWith('B');
  });
});
