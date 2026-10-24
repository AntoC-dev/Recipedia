/**
 * TextInputWithDropDown - Autocomplete text input with dropdown suggestions
 *
 * Text input with case-insensitive autocomplete. Suggestions render inline, under the field,
 * in an `AutocompleteBubble`.
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

import { Keyboard, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { AutocompleteBubble } from '@components/molecules/AutocompleteBubble';

/** `nativeID` of the view wrapping the autocomplete field (only the field when `renderLayout` is used) */
export const AUTOCOMPLETE_ANCHOR_ID = 'AutocompleteAnchor';

/**
 * Suggestions to display for the typed text: case-insensitive substring matches, or none when
 * the only match equals the text (nothing left to complete).
 *
 * @param referenceTextArray - Every candidate suggestion
 * @param text - The text typed by the user
 * @returns The suggestions to show, in reference order; empty when the list should be hidden
 */
export function filterSuggestions(referenceTextArray: string[], text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches = referenceTextArray.filter(item => item.toLowerCase().includes(lowerText));
  const isExactMatch = matches.length === 1 && matches[0]!.toLowerCase() === lowerText;
  return isExactMatch ? [] : matches;
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
 * Renders suggestions in an `AutocompleteBubble` directly under the field,
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

  const filteredItems = showDropdown ? filterSuggestions(referenceTextArray, textInput) : [];
  const shouldShowDropdown = filteredItems.length > 0;

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

export default TextInputWithDropDown;
