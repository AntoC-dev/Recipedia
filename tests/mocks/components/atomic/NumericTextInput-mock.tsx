import {TextInput} from 'react-native';
import React from 'react';
import {NumericTextInputProps} from '@components/atomic/NumericTextInput';
import {defaultValueNumber} from '@utils/Constants';

export function numericTextInputMock({
  testID,
  value,
  onChangeValue,
  keyboardType,
  mode,
  label,
  dense,
  right,
  style,
}: NumericTextInputProps) {
  const getTextFromValue = (val: number) => {
      if (val === defaultValueNumber) {
          return '';
      }
      const rounded = Math.round(val * 100) / 100;
      return rounded.toString();
  };

  const [currentText, setCurrentText] = React.useState(getTextFromValue(value));

  const handleChangeText = (text: string) => {
    setCurrentText(text);
  };

  const handleBlur = () => {
    if (onChangeValue) {
      const parsed = parseFloat(currentText);
      const finalValue = isNaN(parsed) ? defaultValueNumber : parsed;

      if (finalValue !== value) {
        onChangeValue(finalValue);
      }
    }
  };

  const displayValue = getTextFromValue(value);

  return (
    <TextInput
      testID={testID}
      value={displayValue}
      keyboardType={keyboardType}
      onChangeText={handleChangeText}
      onBlur={handleBlur}
      style={style}
    />
  );
}
