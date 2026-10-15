/**
 * TextInputWithDropDown - Autocomplete text input with dropdown suggestions
 *
 * Text input with case-insensitive autocomplete. Suggestions render inline, under the field,
 * as a bounded, virtualised speech-bubble list (Material Design 3 elevated surface).
 *
 * Key Features:
 * - Hides the list on an exact match
 * - Optional `renderLayout` render prop so a parent can place the list elsewhere in its layout
 * - `onSelect` for an explicit pick, or `onChangeText` + `onValidate` otherwise
 *
 * @example
 * ```typescript
 * // Basic autocomplete for ingredients
 * <TextInputWithDropDown
 *   referenceTextArray={ingredientNames}
 *   value={selectedIngredient}
 *   label="Ingredient"
 *   onValidate={(ingredient) => addIngredient(ingredient)}
 *   testID="ingredient-input"
 * />
 *
 * // Parent renders the suggestion list under a whole table row
 * <TextInputWithDropDown
 *   referenceTextArray={ingredientNames}
 *   testID="ingredient-input"
 *   renderLayout={(field, dropdown) => (
 *     <>
 *       <Row><Cell>{field}</Cell><Cell>{quantity}</Cell></Row>
 *       {dropdown}
 *     </>
 *   )}
 * />
 * ```
 */

import { Keyboard, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Divider, Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import React, { useEffect, useRef, useState } from 'react';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { padding } from '@styles/spacing';
import { scrollDecelerationRate } from '@utils/Constants';

/** `nativeID` of the view wrapping the autocomplete field (only the field when `renderLayout` is used) */
export const AUTOCOMPLETE_ANCHOR_ID = 'AutocompleteAnchor';
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

/**
 * Props for the TextInputWithDropDown component
 */
export type TextInputWithDropDownType = {
  /** Array of reference strings to filter and display as suggestions */
  referenceTextArray: string[];
  /** Current value of the text input */
  value?: string;
  /** Label text displayed above the input */
  label?: string;
  /** Display mode: outlined or flat (default: 'outlined') */
  mode?: 'flat' | 'outlined';
  /** Whether to use dense styling (default: false) */
  dense?: boolean;
  /**
   * Live-commit callback fired on every keystroke. Use this to keep an
   * external store (e.g. react-hook-form) in sync with what the user is
   * currently typing, without waiting for blur. Optional — consumers that
   * only need a final "submit/select" event can rely on `onValidate`.
   */
  onChangeText?: (newText: string) => void;
  /**
   * Callback fired when the text is validated (submitted via end-editing or
   * selected from the dropdown). Use this for semantic commit operations
   * (e.g. adding to an array, fuzzy-matching against a DB).
   */
  onValidate?: (newText: string) => void;
  /**
   * Callback fired ONLY when an item is picked from the autocomplete dropdown.
   * When provided, the dropdown-select path calls this instead of the
   * `onChangeText` + `onValidate` pair — so the consumer can treat an explicit
   * selection differently from typed-then-blurred text (e.g. force a fresh DB
   * resolution rather than relying on a stale name-changed comparison).
   */
  onSelect?: (selectedText: string) => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Custom styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Custom styles for the text content */
  contentStyle?: StyleProp<TextStyle>;
  /** Custom styles applied directly to the inner TextInput surface */
  textInputStyle?: StyleProp<TextStyle>;
  /** Right element (icon or affix) to display inside the input */
  right?: React.ReactNode;
  /** Optional focus handler called when the inner input gains focus */
  onFocus?: () => void;
  /**
   * When provided, lays out the field and the suggestion bubble (null when hidden) so a
   * parent can place the bubble at another level, e.g. spanning a whole table row.
   * By default the bubble renders right under the field.
   */
  renderLayout?: (
    field: React.ReactElement,
    dropdown: React.ReactElement | null
  ) => React.ReactNode;
  /** Optional blur handler called when the inner input loses focus */
  onBlur?: () => void;
};

/**
 * TextInputWithDropDown component for autocomplete functionality
 *
 * Renders suggestions in an inline speech-bubble FlashList directly under the field,
 * or wherever `renderLayout` places it when the parent owns the placement.
 *
 * @param props - The component props
 * @returns JSX element representing an autocomplete text input with dropdown suggestions
 */
export function TextInputWithDropDown({
  onChangeText,
  onValidate,
  onSelect,
  right,
  testID,
  label,
  mode,
  dense,
  style,
  contentStyle,
  textInputStyle,
  referenceTextArray,
  value,
  onFocus,
  onBlur,
  renderLayout,
}: TextInputWithDropDownType) {
  const prevValueRef = useRef(value);

  const [textInput, setTextInput] = useState(value ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setTextInput(value ?? '');
    }
  }, [value]);

  const lowerTextInput = textInput.toLowerCase();
  const filteredItems = showDropdown
    ? referenceTextArray.filter(item => item.toLowerCase().includes(lowerTextInput))
    : [];

  const isExactMatch =
    filteredItems.length === 1 && filteredItems[0]!.toLowerCase() === lowerTextInput;

  const shouldShowDropdown = showDropdown && filteredItems.length > 0 && !isExactMatch;

  function handleFocus() {
    isSelectingRef.current = false;
    setShowDropdown(true);
    onFocus?.();
  }

  function handleChangeText(text: string) {
    setTextInput(text);
    setShowDropdown(true);
    onChangeText?.(text);
  }

  function handleSelect(text: string) {
    setTextInput(text);
    setShowDropdown(false);
    isSelectingRef.current = true;
    Keyboard.dismiss();
    // A dedicated `onSelect` path lets the consumer distinguish an explicit
    // dropdown pick from typed-then-blurred text. When present it owns the
    // commit entirely — we skip the `onChangeText` live-commit so the consumer
    // can run its own resolution against the still-previous value.
    if (onSelect) {
      onSelect(text);
      return;
    }
    onChangeText?.(text);
    onValidate?.(text);
  }

  function handleEndEditing(text: string) {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }
    onValidate?.(text);
  }

  const input = (
    <CustomTextInput
      testID={testID}
      label={label}
      value={textInput}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onEndEditing={handleEndEditing}
      onBlur={onBlur}
      mode={mode}
      dense={dense}
      style={textInputStyle}
      contentStyle={contentStyle}
      right={right}
      autoCorrect={false}
      spellCheck={false}
    />
  );

  const dropdown = shouldShowDropdown ? (
    <AutocompleteBubble
      testID={testID}
      items={filteredItems}
      query={textInput}
      onSelect={handleSelect}
    />
  ) : null;

  if (renderLayout) {
    return renderLayout(
      <View nativeID={AUTOCOMPLETE_ANCHOR_ID} style={style} accessible={false}>
        {input}
      </View>,
      dropdown
    );
  }

  return (
    <View nativeID={AUTOCOMPLETE_ANCHOR_ID} style={style} accessible={false}>
      {input}
      {dropdown}
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

export default TextInputWithDropDown;
