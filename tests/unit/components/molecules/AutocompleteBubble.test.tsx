import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
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
  test('adds the tail space and the surface vertical padding to the list height', async () => {
    const { getByTestId } = await render(
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
    const surfacePadding = StyleSheet.flatten(getByTestId('surface').props.style)
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

  async function renderBubble(items: string[], query = '', onSelect = jest.fn()) {
    return render(
      <AutocompleteBubble
        testID='AutocompleteBubble'
        items={items}
        query={query}
        onSelect={onSelect}
      />
    );
  }

  test('keeps taps and nested scrolling working inside the form scroll view', async () => {
    const { getByTestId } = await renderBubble(['A', 'B']);
    const list = getByTestId(listId);

    expect(list.props.keyboardShouldPersistTaps).toBe('handled');
    expect(list.props.nestedScrollEnabled).toBe(true);
  });

  test('uses the app scroll deceleration rate', async () => {
    const { getByTestId } = await renderBubble(['A', 'B']);
    const list = getByTestId(listId);

    expect(list.props.decelerationRate).toBe(scrollDecelerationRate);
  });

  test('does not draw rows beyond the visible area', async () => {
    const { getByTestId } = await renderBubble(['A', 'B']);
    const list = getByTestId(listId);

    expect(list.props.drawDistance).toBe(0);
  });

  test('renders every row at the row height without a border', async () => {
    const { getByTestId } = await renderBubble(['A', 'B']);

    for (const item of ['A', 'B']) {
      const rowStyle = StyleSheet.flatten(getByTestId(itemId(item)).props.style);
      expect(rowStyle.height).toBe(AUTOCOMPLETE_ROW_HEIGHT);
      expect(rowStyle.borderTopWidth).toBeUndefined();
    }
  });

  test('exposes each row as a labelled button', async () => {
    const { getByTestId } = await renderBubble(['A', 'B']);

    const row = getByTestId(itemId('B'));
    expect(row.props.accessibilityRole).toBe('button');
    expect(row.props.accessibilityLabel).toBe('B');
  });

  test('renders a row for an empty suggestion without a highlight', async () => {
    const { getByTestId, queryByTestId } = await renderBubble(['', 'A'], 'A');

    expect(getByTestId(itemId(''))).toBeTruthy();
    expect(queryByTestId(matchId(''))).toBeNull();
    expect(getByTestId(matchId('A'))).toHaveTextContent('A');
  });

  test('renders every row of duplicated suggestions', async () => {
    const { getAllByTestId } = await renderBubble(['A', 'A']);

    expect(getAllByTestId(itemId('A'))).toHaveLength(2);
  });

  test('renders a bold divider between rows and none after the last', async () => {
    const { getAllByTestId } = await renderBubble(['A', 'B', 'C']);

    const dividers = getAllByTestId('divider');
    expect(dividers).toHaveLength(2);
    expect(dividers.every(divider => divider.props.bold === true)).toBe(true);
  });

  test('renders no divider for a single row', async () => {
    const { queryAllByTestId } = await renderBubble(['A']);

    expect(queryAllByTestId('divider')).toHaveLength(0);
  });

  test('renders one touchable row per suggestion in order', async () => {
    const { getAllByTestId } = await renderBubble(['A', 'B']);

    expect(getAllByTestId(itemId(''), { exact: false }).map(ripple => ripple.props.testID)).toEqual(
      [itemId('A'), itemId('B')]
    );
  });

  test('does not mount rows far outside the bounded viewport', async () => {
    const { getByTestId, queryByTestId } = await renderBubble(manyItems);

    expect(getByTestId(itemId('Tag 0'))).toBeTruthy();
    expect(queryByTestId(itemId('Tag 299'))).toBeNull();
  });

  test('bounds the list container to the capped height', async () => {
    const { getByTestId } = await renderBubble(manyItems);

    expect(StyleSheet.flatten(getByTestId(viewportId).props.style)).toEqual(
      expect.objectContaining({ height: getAutocompleteListHeight(AUTOCOMPLETE_MAX_VISIBLE_ROWS) })
    );
  });

  test('places the tail at the default inset', async () => {
    const { getByTestId } = await renderBubble(['A']);

    expect(StyleSheet.flatten(getByTestId(tailId).props.style).left).toBe(AUTOCOMPLETE_TAIL_INSET);
  });

  test('highlights the matching part of each suggestion', async () => {
    const { getByTestId, queryByTestId } = await renderBubble(['Pasta', 'Salmon'], 'as');

    expect(getByTestId(matchId('Pasta')).props.children).toBe('as');
    expect(queryByTestId(matchId('Salmon'))).toBeNull();
  });

  test('calls onSelect with the pressed suggestion', async () => {
    const onSelect = jest.fn();
    const { getByTestId } = await renderBubble(['A', 'B'], '', onSelect);

    await fireEvent.press(getByTestId(itemId('B')));

    expect(onSelect).toHaveBeenCalledWith('B');
  });
});
