import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputEndEditingEventData,
  TextStyle,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { CustomTextInputProps } from '@components/atomic/CustomTextInput';

export function CustomTextInputMock({
  testID,
  editable = true,
  label,
  value,
  multiline = false,
  style,
  error,
  onFocus,
  onChangeText,
  onEndEditing,
  onBlur,
  onLayout,
}: CustomTextInputProps) {
  const [displayValue, setDisplayValue] = useState(value ?? '');
  const prevValueRef = useRef(value);

  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    setDisplayValue(value ?? '');
  }

  function handleChangeText(text: string) {
    setDisplayValue(text);
    onChangeText?.(text);
  }

  function handleEndEditing(e: NativeSyntheticEvent<TextInputEndEditingEventData>) {
    const text = e?.nativeEvent?.text ?? displayValue;
    onEndEditing?.(text);
  }

  return (
    <>
      <TextInput
        testID={testID + '::CustomTextInput'}
        style={style as TextStyle}
        editable={editable}
        value={displayValue}
        multiline={multiline}
        onFocus={onFocus}
        onChangeText={handleChangeText}
        onEndEditing={handleEndEditing}
        onBlur={onBlur}
        onLayout={onLayout}
      >
        {label}
      </TextInput>
      {error !== undefined && <Text testID={testID + '::error'}>{String(error)}</Text>}
    </>
  );
}
