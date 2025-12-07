/**
 * NumericTextInput - Specialized text input for numeric values with proper float handling
 *
 * A wrapper around React Native Paper's TextInput optimized for numeric input.
 * Solves the common React Native float input bug where partial decimals (e.g., "2.")
 * are lost during typing by maintaining local state for raw text and parsing only on blur.
 *
 * Key Features:
 * - Preserves partial decimal input ("2." stays "2." until blur)
 * - Type-safe numeric value handling
 * - Support for React Native Paper props (dense, right/Affix)
 * - Immediate editing (no tap-to-edit behavior)
 * - Graceful handling of invalid input
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

import React, { useEffect, useState } from 'react';
import { Keyboard, StyleProp, TextStyle } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import { defaultValueNumber } from '@utils/Constants';

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
  keyboardType?: 'numeric' | 'number-pad' | 'decimal-pad';
  editable?: boolean;
};

function formatNumberForDisplay(num: number): string {
  if (num === defaultValueNumber) {
    return '';
  }
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString();
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
  keyboardType = 'numeric',
  editable = true,
}: NumericTextInputProps) {
  const getTextFromValue = (val: number) => {
    return formatNumberForDisplay(val);
  };

  const [rawText, setRawText] = useState(getTextFromValue(value));
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    setRawText(formatNumberForDisplay(value));
  }, [value]);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (isFocused) {
        const normalizedText = rawText.replace(',', '.');
        const parsed = parseFloat(normalizedText);
        const finalValue = isNaN(parsed) ? defaultValueNumber : parsed;

        setRawText(getTextFromValue(finalValue));
        if (finalValue !== value) {
          onChangeValue?.(finalValue);
        }
        setIsFocused(false);
      }
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, [isFocused, rawText, value, onChangeValue]);

  function handleBlur() {
    const normalizedText = rawText.replace(',', '.');
    const parsed = parseFloat(normalizedText);
    const finalValue = isNaN(parsed) ? defaultValueNumber : parsed;

    setRawText(getTextFromValue(finalValue));
    if (finalValue !== value) {
      onChangeValue?.(finalValue);
    }
    setIsFocused(false);
  }

  function handleChangeText(text: string) {
    setRawText(text);
  }

  function handleFocus() {
    setIsFocused(true);
  }

  const inputStyle: StyleProp<TextStyle> = [
    style,
    editable ? {} : { backgroundColor: colors.backdrop },
  ];

  return (
    <TextInput
      testID={testID}
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
      right={right}
    />
  );
}

export default NumericTextInput;
