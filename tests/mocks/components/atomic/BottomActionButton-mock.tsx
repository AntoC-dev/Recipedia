import React from 'react';
import { Button, Text, View } from 'react-native';
import { BottomActionButtonProps } from '@components/atomic/BottomActionButton';

export function bottomActionButtonMock({
  testID,
  onPress,
  label,
  disabled = false,
}: BottomActionButtonProps) {
  const id = testID + '::BottomActionButton';
  return (
    <View testID={id}>
      <Text testID={`${id}::Label`}>{label}</Text>
      <Text testID={`${id}::Disabled`}>{String(disabled)}</Text>
      <Button testID={`${id}::onPress`} onPress={onPress} title='Import' />
    </View>
  );
}
