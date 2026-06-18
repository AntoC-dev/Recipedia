/**
 * TextInputWithDropDown - Autocomplete text input with dropdown suggestions
 *
 * An enhanced text input component that provides real-time autocomplete functionality
 * with a dropdown list of filtered suggestions. Uses Portal for proper overlay rendering
 * that works in any container context (tables, nested views, ScrollViews, etc.).
 *
 * Key Features:
 * - Real-time text filtering with case-insensitive search
 * - Material Design styling using react-native-paper List.Item
 * - Portal-based dropdown (renders outside view hierarchy, no layout issues)
 * - Automatic repositioning when keyboard shows/hides
 * - Smart suggestion logic (hides exact matches)
 * - Customizable styling for input
 * - Automatic validation callbacks on selection/submission
 * - Support for right icons via CustomTextInput
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
 * // With right icon (e.g., for note editing)
 * <TextInputWithDropDown
 *   referenceTextArray={ingredientNames}
 *   value={currentIngredient}
 *   label="Ingredient"
 *   dense
 *   mode="flat"
 *   onValidate={(name) => updateIngredient(name)}
 *   testID="ingredient-input"
 *   right={<TextInput.Icon icon="comment" onPress={openNote} />}
 * />
 * ```
 */

import {
  Keyboard,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { List, Portal, useTheme } from 'react-native-paper';
import React, { useEffect, useRef, useState } from 'react';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { padding, screenHeight } from '@styles/spacing';

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
  /** Whether the input is editable (default: true) */
  editable?: boolean;
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
  /** Force hide the dropdown (e.g., during scroll) */
  hideDropdown?: boolean;
  /** Optional focus handler called when the inner input gains focus */
  onFocus?: () => void;
  /** Optional blur handler called when the inner input loses focus */
  onBlur?: () => void;
};

/**
 * TextInputWithDropDown component for autocomplete functionality
 *
 * Uses Portal for proper dropdown overlay positioning outside the view hierarchy,
 * combined with react-native-paper components for Material Design styling.
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
  hideDropdown,
  onFocus,
  onBlur,
}: TextInputWithDropDownType) {
  const { colors } = useTheme();
  const containerRef = useRef<View>(null);
  const prevValueRef = useRef(value);

  const [textInput, setTextInput] = useState(value ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });
  const isSelectingRef = useRef(false);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setTextInput(value ?? '');
    }
  }, [value]);

  // Re-measure position when keyboard shows/hides (after KeyboardAvoidingView animation)
  useEffect(() => {
    if (!showDropdown) {
      return;
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(measurePosition, 150);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(measurePosition, 150);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [showDropdown]);

  // Re-measure position when dropdown becomes visible again after being hidden
  const prevHideDropdownRef = useRef(hideDropdown);
  useEffect(() => {
    if (prevHideDropdownRef.current && !hideDropdown && showDropdown) {
      measurePosition();
    }
    prevHideDropdownRef.current = hideDropdown;
  }, [hideDropdown, showDropdown]);

  function measurePosition() {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setDropdownLayout({ top: y + height, left: x, width });
      }
    });
  }

  const filteredItems = showDropdown
    ? referenceTextArray.filter(item => item.toLowerCase().includes(textInput.toLowerCase()))
    : [];

  const isExactMatch =
    filteredItems.length === 1 && filteredItems[0].toLowerCase() === textInput.toLowerCase();

  const shouldShowDropdown =
    showDropdown && !hideDropdown && filteredItems.length > 0 && !isExactMatch;

  function handleFocus() {
    measurePosition();
    setShowDropdown(true);
    onFocus?.();
  }

  function handleChangeText(text: string) {
    setTextInput(text);
    measurePosition();
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

  function handleLayout() {
    if (showDropdown) {
      measurePosition();
    }
  }

  return (
    <View
      ref={containerRef}
      style={style}
      collapsable={false}
      onLayout={handleLayout}
      accessible={false}
    >
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
      {shouldShowDropdown && (
        <Portal>
          <ScrollView
            testID={`${testID}::AutocompleteList`}
            keyboardShouldPersistTaps='handled'
            style={[
              styles.dropdown,
              {
                top: dropdownLayout.top,
                left: dropdownLayout.left,
                width: dropdownLayout.width,
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {filteredItems.map(item => (
              <List.Item
                key={item}
                testID={`${testID}::AutocompleteItem::${item}`}
                title={item}
                titleStyle={{ color: colors.onSurfaceVariant }}
                style={{ backgroundColor: colors.surfaceVariant }}
                onPress={() => handleSelect(item)}
              />
            ))}
          </ScrollView>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    maxHeight: screenHeight * 0.33,
    borderRadius: padding.verySmall,
    elevation: padding.small,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: padding.verySmall,
  },
});

export default TextInputWithDropDown;
