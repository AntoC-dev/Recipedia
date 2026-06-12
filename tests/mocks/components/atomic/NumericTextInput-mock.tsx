import { TextInput } from 'react-native';
import React from 'react';
import { NumericTextInputProps } from '@components/atomic/NumericTextInput';
import { defaultValueNumber } from '@utils/Constants';

function getTextFromValue(val: number): string {
  if (val === defaultValueNumber) {
    return '';
  }
  const rounded = Math.round(val * 100) / 100;
  return rounded.toString();
}

export function NumericTextInputMock({
  testID,
  value,
  onChangeValue,
  keyboardType,
  style,
  onBlur,
}: NumericTextInputProps) {
  const handleChangeText = (text: string) => {
    if (!onChangeValue) return;
    const parsed = parseFloat(text);
    const finalValue = isNaN(parsed) ? defaultValueNumber : parsed;
    if (finalValue !== value) {
      onChangeValue(finalValue);
    }
  };

  return (
    <TextInput
      testID={testID}
      value={getTextFromValue(value)}
      keyboardType={keyboardType}
      onChangeText={handleChangeText}
      onBlur={onBlur}
      style={style}
    />
  );
}

export const numericTextInputMock = NumericTextInputMock;
