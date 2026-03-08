/**
 * CustomTextInput - Enhanced text input component
 *
 * A wrapper around React Native Paper's TextInput that provides enhanced functionality.
 * Features include the `displayValue` pattern to decouple the native input's displayed
 * value from the parent's controlled prop, preventing cursor-reset bugs caused by
 * validation re-renders interleaving with native text change events.
 *
 * Key Features:
 * - Cursor-position preservation during controlled re-renders (displayValue pattern)
 * - Full React Native Paper theme integration
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
import { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { getDatasetType } from '@utils/DatasetLoader';
import { padding } from '@styles/spacing';

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
  /** Placeholder text displayed when the input is empty */
  placeholder?: string;
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

/** Flag to disable the autocorrect and spell check for test purpose */
const disableAutoCorrect = getDatasetType() === 'test';

/**
 * CustomTextInput component with cursor-position-preserving editing behavior
 *
 * @param props - The component props
 * @returns JSX element representing the enhanced text input
 */
export function CustomTextInput({
  testID,
  editable = true,
  label,
  value,
  placeholder,
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
  const [displayValue, setDisplayValue] = useState(value ?? '');
  const prevExternalValueRef = useRef(value);

  if (value !== prevExternalValueRef.current) {
    prevExternalValueRef.current = value;
    setDisplayValue(value ?? '');
  }

  const { colors } = useTheme();

  function handleOnChangeText(text: string) {
    setDisplayValue(text);
    onChangeText?.(text);
  }

  return (
    <TextInput
      testID={testID + '::CustomTextInput'}
      label={label}
      value={displayValue}
      placeholder={placeholder}
      style={[style, editable ? undefined : { backgroundColor: colors.backdrop }]}
      contentStyle={[
        contentStyle,
        multiline
          ? {
              paddingTop: padding.medium,
              paddingBottom: padding.medium,
            }
          : undefined,
      ]}
      onFocus={onFocus}
      onChangeText={handleOnChangeText}
      onEndEditing={onEndEditing}
      mode={mode}
      dense={dense}
      multiline={multiline}
      editable={editable}
      keyboardType={keyboardType}
      onBlur={onBlur}
      onLayout={onLayout}
      error={error}
      right={right}
      returnKeyType={multiline ? 'default' : 'done'}
      autoCorrect={disableAutoCorrect ? false : autoCorrect}
      spellCheck={disableAutoCorrect ? false : spellCheck}
      accessible={false}
    />
  );
}

export default CustomTextInput;
