/**
 * CustomTextInput - Enhanced text input component
 *
 * A wrapper around React Native Paper's TextInput that provides enhanced functionality.
 * Features include automatic height adjustment for multiline inputs and proper theme integration.
 * Designed to provide a consistent and accessible input experience throughout the app.
 *
 * Key Features:
 * - Automatic height adjustment for multiline text
 * - Full React Native Paper theme integration
 * - Comprehensive keyboard type support
 * - Enhanced accessibility with proper test IDs
 * - Visual feedback for non-editable states
 * - Compatible with accessibility tools like Maestro
 *
 * @example
 * ```typescript
 * <CustomTextInput
 *   testID="recipe-title"
 *   label="Recipe Title"
 *   value={title}
 *   onChangeText={setTitle}
 *   onEndEditing={() => console.log('Editing finished')}
 * />
 *
 * // Multiline example
 * <CustomTextInput
 *   testID="recipe-description"
 *   label="Description"
 *   value={description}
 *   multiline={true}
 *   onChangeText={setDescription}
 * />
 * ```
 */

import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  StyleProp,
  TextInputContentSizeChangeEventData,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { screenHeight } from '@styles/spacing';

/**
 * Props for the CustomTextInput component
 */
export type CustomTextInputProps = {
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Whether the input can be edited (default: true) */
  editable?: boolean;
  /** Optional label displayed above the input */
  label?: string;
  /** Current text value */
  value?: string;
  /** Whether the input supports multiple lines (default: false) */
  multiline?: boolean;
  /** Type of keyboard to display (default: 'default') */
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad' | 'numeric' | 'url';
  /** Display mode: outlined or flat (default: 'outlined') */
  mode?: 'flat' | 'outlined';
  /** Whether to use dense styling (default: false) */
  dense?: boolean;
  /** Whether the input has an error (displays error styling) */
  error?: boolean;
  /** Custom styles for the container view */
  style?: StyleProp<ViewStyle>;
  /** Custom styles for the text content */
  contentStyle?: StyleProp<TextStyle>;
  /** Callback fired when input gains focus */
  onFocus?: () => void;
  /** Callback fired when text changes */
  onChangeText?: (text: string) => void;
  /** Callback fired when editing ends */
  onEndEditing?: () => void;
  /** Callback fired when input loses focus */
  onBlur?: () => void;
  /** Callback fired when component layout changes */
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Right element (icon or affix) to display inside the input */
  right?: React.ReactNode;
  /** Whether to enable auto-correct (default: true) */
  autoCorrect?: boolean;
  /** Whether to enable spell check (default: true) */
  spellCheck?: boolean;
};

/**
 * CustomTextInput component with enhanced editing behavior
 *
 * @param props - The component props
 * @returns JSX element representing the enhanced text input
 */
export function CustomTextInput({
  testID,
  editable = true,
  label,
  value,
  multiline = false,
  keyboardType = 'default',
  mode = 'outlined',
  dense = false,
  error = false,
  style,
  contentStyle,
  onFocus,
  onChangeText,
  onEndEditing,
  onBlur,
  onLayout,
  right,
  autoCorrect,
  spellCheck,
}: CustomTextInputProps) {
  const [inputHeight, setInputHeight] = useState(screenHeight * 0.08);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null);

  function handleOnFocus() {
    onFocus?.();
  }

  function handleOnChangeText(text: string) {
    onChangeText?.(text);
  }

  function handleOnEndEditing() {
    onEndEditing?.();
  }

  function handleOnBlur() {
    onBlur?.();
  }

  function handleOnLayout(event: LayoutChangeEvent) {
    onLayout?.(event);
  }

  function handleOnContentSizeChange({
    nativeEvent: { contentSize },
  }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) {
    if (multiline) {
      const h = contentSize.height;
      if (inputHeight !== h) {
        setInputHeight(h);
      }
    }
  }

  const { colors } = useTheme();

  const inputStyle = [
    style as TextStyle,
    { height: inputHeight },
    editable ? {} : { backgroundColor: colors.backdrop },
  ];
  return (
    <View style={style} pointerEvents={'box-none'} accessible={false}>
      <TextInput
        testID={testID + '::CustomTextInput'}
        ref={inputRef}
        label={label}
        value={value ?? ''}
        style={inputStyle}
        contentStyle={contentStyle}
        onFocus={handleOnFocus}
        onChangeText={handleOnChangeText}
        onEndEditing={handleOnEndEditing}
        mode={mode}
        dense={dense}
        multiline={multiline}
        editable={editable}
        keyboardType={keyboardType}
        onBlur={handleOnBlur}
        onLayout={handleOnLayout}
        onContentSizeChange={handleOnContentSizeChange}
        error={error}
        right={right}
        returnKeyType={multiline ? 'default' : 'done'}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
      />
    </View>
  );
}

export default CustomTextInput;
