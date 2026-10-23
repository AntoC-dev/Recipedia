/**
 * AutocompleteBubble - Speech-bubble suggestion list for autocomplete fields
 *
 * Bounded-height, virtualised list (Material Design 3 elevated surface) with a tail pointing
 * at the field it belongs to. Highlights the part of each suggestion matching the query.
 *
 * @example
 * ```typescript
 * <AutocompleteBubble
 *   testID="ingredient-input"
 *   items={['Basil', 'Pasta']}
 *   query="as"
 *   onSelect={item => setValue(item)}
 * />
 * ```
 */

import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Divider, Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import React from 'react';
import { padding } from '@styles/spacing';
import { scrollDecelerationRate } from '@utils/Constants';

/** Fixed height of a suggestion row (M3 menu item height) */
export const AUTOCOMPLETE_ROW_HEIGHT = 48;
/** Maximum number of suggestion rows visible before the list scrolls */
export const AUTOCOMPLETE_MAX_VISIBLE_ROWS = 4;
/** Distance between the anchored field's left edge and the bubble tail's left edge */
export const AUTOCOMPLETE_TAIL_INSET = padding.large;
/** Thickness of the divider between suggestion rows (M3 divider thickness) */
export const AUTOCOMPLETE_DIVIDER_THICKNESS = 1;
const TAIL_SIZE = 12;
const MENU_CORNER_RADIUS = 4;
const MENU_VERTICAL_PADDING = padding.small;

/** Suggestion text split around the first case-insensitive match of the query */
export type HighlightParts = { before: string; match: string; after: string };

/**
 * Splits a suggestion around the first case-insensitive occurrence of the query.
 *
 * @param text - The suggestion text
 * @param query - The text typed by the user
 * @returns The parts before, matching and after the query; `match` is empty when there is none
 */
export function splitHighlight(text: string, query: string): HighlightParts {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index < 0) {
    return { before: text, match: '', after: '' };
  }
  return {
    before: text.slice(0, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length),
  };
}

/**
 * Height of the autocomplete list for a number of suggestions, capped at the max visible rows,
 * including the dividers between visible rows.
 *
 * @param itemCount - Number of suggestions
 * @returns Height in pixels
 */
export function getAutocompleteListHeight(itemCount: number): number {
  const visibleRows = Math.min(itemCount, AUTOCOMPLETE_MAX_VISIBLE_ROWS);
  const dividers = Math.max(visibleRows - 1, 0);
  return visibleRows * AUTOCOMPLETE_ROW_HEIGHT + dividers * AUTOCOMPLETE_DIVIDER_THICKNESS;
}

/**
 * Total height the suggestion bubble takes under its field: the list height plus the space
 * reserved for the tail and the surface's vertical padding.
 *
 * @param itemCount - Number of suggestions
 * @returns Height in pixels
 */
export function getAutocompleteBubbleHeight(itemCount: number): number {
  return TAIL_SIZE / 2 + 2 * MENU_VERTICAL_PADDING + getAutocompleteListHeight(itemCount);
}

function SuggestionDivider() {
  return <Divider bold />;
}

/** Props for the AutocompleteBubble component */
export type AutocompleteBubbleProps = {
  /** Base test id; the list and rows derive their ids from it */
  testID: string;
  /** Suggestions to display */
  items: string[];
  /** Text typed by the user, highlighted in each suggestion */
  query: string;
  /** Called with the pressed suggestion */
  onSelect: (item: string) => void;
};

/**
 * Speech-bubble suggestion list: bounded-height FlashList with a tail pointing at the field.
 *
 * @param props - Test id, suggestions, current query, and select handler
 * @returns JSX element rendered in normal layout flow
 */
export function AutocompleteBubble({ testID, items, query, onSelect }: AutocompleteBubbleProps) {
  const { colors } = useTheme();
  const bubbleColor = colors.elevation.level2;
  return (
    <View testID={`${testID}::AutocompleteBubble`} style={styles.tailSpace}>
      <Surface elevation={2} style={[styles.surface, { backgroundColor: bubbleColor }]}>
        <View
          testID={`${testID}::AutocompleteTail`}
          style={[styles.tail, { backgroundColor: bubbleColor }]}
        />
        <View
          testID={`${testID}::AutocompleteViewport`}
          style={{ height: getAutocompleteListHeight(items.length) }}
        >
          <FlashList
            testID={`${testID}::AutocompleteList`}
            data={items}
            keyExtractor={(item, index) => `${index}::${item}`}
            keyboardShouldPersistTaps='handled'
            nestedScrollEnabled
            drawDistance={0}
            decelerationRate={scrollDecelerationRate}
            ItemSeparatorComponent={SuggestionDivider}
            renderItem={({ item }) => {
              const { before, match, after } = splitHighlight(item, query);
              return (
                <TouchableRipple
                  testID={`${testID}::AutocompleteItem::${item}`}
                  accessibilityRole='button'
                  accessibilityLabel={item}
                  onPress={() => onSelect(item)}
                  style={styles.row}
                >
                  <Text variant='labelLarge' numberOfLines={1} style={{ color: colors.onSurface }}>
                    {before}
                    {match ? (
                      <Text
                        testID={`${testID}::AutocompleteMatch::${item}`}
                        variant='labelLarge'
                        style={[styles.match, { color: colors.primary }]}
                      >
                        {match}
                      </Text>
                    ) : null}
                    {after}
                  </Text>
                </TouchableRipple>
              );
            }}
          />
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  tailSpace: {
    marginTop: TAIL_SIZE / 2,
  },
  surface: {
    borderRadius: MENU_CORNER_RADIUS,
    paddingVertical: MENU_VERTICAL_PADDING,
  },
  tail: {
    position: 'absolute',
    top: -TAIL_SIZE / 2,
    left: AUTOCOMPLETE_TAIL_INSET,
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    transform: [{ rotate: '45deg' }],
  },
  row: {
    height: AUTOCOMPLETE_ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: padding.medium,
  },
  match: {
    fontWeight: '700',
  },
});
