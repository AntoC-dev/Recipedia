/**
 * NumericTextInput - Specialized text input for numeric values with proper float handling
 *
 * A wrapper around React Native Paper's TextInput optimized for numeric input.
 * Solves the common React Native float input bug where partial decimals (e.g., "2.")
 * are lost during typing by maintaining a local display buffer while still
 * live-committing each parsed value to the parent on every keystroke.
 *
 * Key Features:
 * - Preserves partial decimal input ("2." stays "2." in the display buffer)
 * - Live-commit semantics: the parsed numeric value is pushed to the parent on
 *   every keystroke via `onChangeValue`; blur is no longer required to flush.
 * - Type-safe numeric value handling
 * - Support for React Native Paper props (dense, right/Affix)
 * - Immediate editing (no tap-to-edit behavior)
 * - Graceful handling of invalid input (falls back to `defaultValueNumber`)
 *
 * @example
 * ```typescript
 * <NumericTextInput
 *   testID="portion-weight"
 *   label="Weight"
 *   value={weight}
 *   onChangeValue={setWeight}
 *   right={<TextInput.Affix text="g" />}
 *   dense
 * />
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { defaultValueNumber } from '@utils/Constants';
import { parseQuantity } from '@utils/Quantity';

export type NumericTextInputProps = {
  testID: string;
  value: number;
  onChangeValue?: (value: number) => void;
  label?: string;
  dense?: boolean;
  right?: React.ReactNode;
  mode?: 'flat' | 'outlined';
  style?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<TextStyle>;
  textInputStyle?: StyleProp<TextStyle>;
  underlineColor?: string;
  keyboardType?: 'numeric' | 'number-pad' | 'decimal-pad';
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

function formatNumberForDisplay(num: number): string {
  if (num === defaultValueNumber) {
    return '';
  }
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString();
}

/**
 * Parses a raw display string into the numeric value committed to the parent.
 *
 * Returns `defaultValueNumber` when the input is empty or fails to parse so
 * the schema's "not set" branch still triggers. Used on every keystroke to
 * keep the parent in sync without waiting for blur.
 */
function parseDisplayToValue(raw: string): number {
  const normalized = parseQuantity(raw);
  return normalized ? Number(normalized) : defaultValueNumber;
}

export function NumericTextInput({
  testID,
  value,
  onChangeValue,
  label,
  dense = false,
  right,
  mode = 'outlined',
  style,
  contentStyle,
  textInputStyle,
  underlineColor,
  keyboardType = 'numeric',
  editable = true,
  onFocus,
  onBlur,
}: NumericTextInputProps) {
  const [rawText, setRawText] = useState(formatNumberForDisplay(value));
  const [isFocused, setIsFocused] = useState(false);
  const lastCommittedValueRef = useRef(value);
  const { colors } = useTheme();

  useEffect(() => {
    lastCommittedValueRef.current = value;
    if (isFocused) return;
    setRawText(formatNumberForDisplay(value));
  }, [value, isFocused]);

  function handleChangeText(text: string) {
    setRawText(text);
    // Defer the "unset" commit to blur only when the buffer is empty or
    // unparseable. Gating on `parseQuantity(...) === ''` (rather than on the
    // parsed value equalling `defaultValueNumber`) keeps a genuinely typed
    // `-1` from being mistaken for "not set" — it parses to a real number and
    // live-commits like any other value. Live-committing the unset sentinel on
    // every transient empty buffer mid-retype would flash a missing-field
    // inline error between keystrokes, so that case still waits for blur.
    const normalized = parseQuantity(text);
    if (normalized === '') return;
    const parsed = Number(normalized);
    if (parsed !== lastCommittedValueRef.current) {
      lastCommittedValueRef.current = parsed;
      onChangeValue?.(parsed);
    }
  }

  function handleFocus() {
    setIsFocused(true);
    onFocus?.();
  }

  function handleBlur() {
    setIsFocused(false);
    // Flush the deferred value on blur: a field left empty / invalid commits
    // `defaultValueNumber` here (the only place the unset transition lands).
    const finalValue = parseDisplayToValue(rawText);
    if (finalValue !== lastCommittedValueRef.current) {
      lastCommittedValueRef.current = finalValue;
      onChangeValue?.(finalValue);
    }
    setRawText(formatNumberForDisplay(finalValue));
    onBlur?.();
  }

  const inputStyle: StyleProp<TextStyle> = [
    editable ? {} : { backgroundColor: colors.backdrop },
    textInputStyle,
  ];

  return (
    <View style={style} pointerEvents={'box-none'} accessible={false}>
      <TextInput
        testID={testID}
        nativeID={testID}
        label={label}
        value={rawText}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        mode={mode}
        dense={dense}
        keyboardType={keyboardType}
        editable={editable}
        style={inputStyle}
        contentStyle={contentStyle}
        underlineColor={underlineColor}
        right={right}
      />
    </View>
  );
}

export default NumericTextInput;
