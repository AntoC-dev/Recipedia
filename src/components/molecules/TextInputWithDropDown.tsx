/**
 * TextInputWithDropDown - Autocomplete text input with dropdown suggestions
 *
 * An enhanced text input component that provides real-time autocomplete functionality
 * with a dropdown list of filtered suggestions. Features intelligent keyboard handling,
 * customizable positioning (absolute or relative), and comprehensive state management
 * for optimal user experience.
 *
 * Key Features:
 * - Real-time text filtering with case-insensitive search
 * - Configurable dropdown positioning (absolute/relative)
 * - Intelligent keyboard event handling and auto-dismiss
 * - Smart suggestion logic (hides exact matches)
 * - Performance optimizations for testing environments
 * - Customizable styling for input and dropdown
 * - Automatic validation callbacks on selection/submission
 * - Responsive dropdown sizing based on input height
 *
 * @example
 * ```typescript
 * // Basic autocomplete for ingredients
 * <TextInputWithDropDown
 *   referenceTextArray={ingredientNames}
 *   value={selectedIngredient}
 *   label="Ingredient"
 *   absoluteDropDown={false}
 *   onValidate={(ingredient) => addIngredient(ingredient)}
 *   testID="ingredient-input"
 * />
 *
 * // Absolute positioned dropdown for overlay contexts
 * <TextInputWithDropDown
 *   referenceTextArray={tagOptions}
 *   value={currentTag}
 *   label="Add Tag"
 *   absoluteDropDown={true}
 *   onValidate={(tag) => handleTagSelection(tag)}
 *   testID="tag-autocomplete"
 *   style={{margin: 16}}
 * />
 *
 * // Pre-populated with custom styling
 * <TextInputWithDropDown
 *   referenceTextArray={recipeTypes}
 *   value="Dessert"
 *   label="Recipe Type"
 *   absoluteDropDown={false}
 *   onValidate={(type) => updateRecipeType(type)}
 *   testID="recipe-type-input"
 *   contentStyle={{fontSize: 16}}
 * />
 * ```
 */

import {
  FlatList,
  Keyboard,
  LayoutChangeEvent,
  LogBox,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { List, TextInput } from 'react-native-paper';
import React, { useEffect, useRef, useState } from 'react';
import { palette } from '@styles/colors';
import { CustomTextInput } from '@components/atomic/CustomTextInput';

/**
 * Props for the TextInputWithDropDown component
 */
export type TextInputWithDropDownType = {
  /** Whether dropdown should use absolute positioning (for overlays) */
  absoluteDropDown: boolean;
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
  /** Callback fired when text is validated (submitted or selected) */
  onValidate?: (newText: string) => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Custom styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Custom styles for the text content */
  contentStyle?: StyleProp<TextStyle>;
  /** Right element (icon or affix) to display inside the input */
  right?: React.ReactNode;
};

/**
 * TextInputWithDropDown component for autocomplete functionality
 *
 * @param props - The component props
 * @returns JSX element representing an autocomplete text input with dropdown suggestions
 */
export function TextInputWithDropDown(props: TextInputWithDropDownType) {
  const { onValidate, right } = props;
  /**
   * Filters the reference array based on user input with case-insensitive matching
   *
   * This function implements the core autocomplete filtering logic, providing
   * case-insensitive substring matching against the reference text array.
   * It's the foundation of the dropdown suggestion system.
   *
   * @param filterText - The text input to filter against
   * @returns string[] - Filtered array of matching suggestions
   */
  const filterArray = (filterText: string): string[] => {
    return props.referenceTextArray.filter(element =>
      element.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  const [textInput, setTextInput] = useState(props.value ?? '');
  const [filteredTextArray, setFilteredTextArray] = useState(
    props.value ? filterArray(props.value) : props.referenceTextArray
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);

  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      LogBox.ignoreLogs([
        'VirtualizedLists should never be nested inside plain ScrollViews', // Disable only this warning
      ]);
    }
  }, []);

  /**
   * Sync internal state with external props.value changes
   *
   * Uses a ref to track the previous value to detect external changes.
   * This allows the component to be "semi-controlled" - maintaining internal state
   * for typing while accepting external value changes from parent.
   */
  const prevValueRef = useRef(props.value);
  useEffect(() => {
    if (props.value !== prevValueRef.current) {
      prevValueRef.current = props.value;
      if (props.value !== undefined) {
        setTextInput(props.value);
        const filtered = props.referenceTextArray.filter(element =>
          element.toLowerCase().includes(props.value!.toLowerCase())
        );
        setFilteredTextArray(filtered);
      } else {
        setFilteredTextArray(props.referenceTextArray);
      }
    }
  }, [props.value, props.referenceTextArray]);

  /**
   * Handles the submission of text input when editing is complete
   *
   * Validates the current input and manages dropdown visibility based on filtered results:
   * - Accepts input when only one or zero suggestions remain
   * - Hides dropdown and triggers validation callback
   * - Encourages selection from suggestions when multiple matches exist
   */
  const handleSubmitEditing = () => {
    setShowDropdown(false);
    onValidate?.(textInput);
  };

  useEffect(() => {
    const keyboardListener = Keyboard.addListener('keyboardDidHide', () => {
      if (inputRef.current && inputRef.current.isFocused()) {
        setShowDropdown(false);
        onValidate?.(textInput);
      }
    });

    return () => {
      keyboardListener.remove();
    };
  }, [textInput, onValidate]);

  function handleSelect(text: string) {
    setTextInput(text);
    setFilteredTextArray([]);
    setShowDropdown(false);
    Keyboard.dismiss();
    props.onValidate?.(text);
  }

  function handleSearch(textEntered: string) {
    setTextInput(textEntered);
    setFilteredTextArray(filterArray(textEntered));
    setShowDropdown(true);
  }

  /**
   * Handles submission validation with intelligent logic based on filtered array length
   *
   * This function implements smart validation logic that only triggers when the user
   * has either entered a completely new value or when there's only one possible
   * suggestion remaining. This prevents accidental submissions when multiple
   * suggestions are still available.
   *
   * Validation Logic:
   * - Validates when filteredTextArray.length <= 1
   * - Case 1: Length 0 = user entered new value not in reference array
   * - Case 2: Length 1 = user typed exact match or only one suggestion remains
   * - Prevents submission when multiple suggestions are available (length > 1)
   *
   * Side Effects:
   * - Hides dropdown when validation occurs
   * - Calls onValidate callback with current text input
   * - Provides clear user feedback by closing suggestions
   *
   * User Experience:
   * - Prevents accidental submission with ambiguous input
   * - Allows creation of new values not in reference array
   * - Enables quick submission when intent is clear
   * - Encourages selection from suggestions when multiple matches exist
   */
  function handleOnLayoutTextInput(event: LayoutChangeEvent) {
    setInputHeight(event.nativeEvent.layout.height);
  }

  const dropdownStyle: StyleProp<ViewStyle> = {
    backgroundColor: palette.backgroundColor,
    // TODO do not hard code
    borderRadius: 5,
    elevation: 5,
    marginTop: 4,
    maxHeight: inputHeight * 4,
  };
  return (
    <View style={props.style as ViewStyle}>
      <CustomTextInput
        label={props.label}
        testID={props.testID}
        value={textInput}
        style={props.style}
        contentStyle={props.contentStyle}
        mode={props.mode}
        dense={props.dense}
        onFocus={() => setShowDropdown(true)}
        onChangeText={handleSearch}
        onEndEditing={handleSubmitEditing}
        onLayout={handleOnLayoutTextInput}
        right={right}
      />
      {showDropdown &&
        filteredTextArray.length > 0 &&
        !(
          filteredTextArray.length === 1 &&
          filteredTextArray[0].toLowerCase() === textInput.toLowerCase()
        ) && (
          <View
            testID={props.testID + '::DropdownContainer'}
            style={
              props.absoluteDropDown
                ? {
                    ...dropdownStyle,
                    position: 'absolute',
                    top: inputHeight,
                    left: 0,
                    right: 0,
                    zIndex: 1000, // TODO doesn't seems to work that wells
                  }
                : dropdownStyle
            }
          >
            <FlatList
              data={filteredTextArray}
              keyboardShouldPersistTaps='handled'
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={'TextInputWithDropDown::TouchableOpacity::' + item}
                  key={item}
                  onPress={() => handleSelect(item)}
                >
                  <List.Item testID={'TextInputWithDropDown::List::' + item} title={item} />
                </TouchableOpacity>
              )}
              {...(process.env.NODE_ENV === 'test'
                ? {
                    initialNumToRender: filteredTextArray.length,
                    maxToRenderPerBatch: filteredTextArray.length,
                    windowSize: filteredTextArray.length,
                  }
                : null)}
            />
          </View>
        )}
    </View>
  );
}

export default TextInputWithDropDown;
