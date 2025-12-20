import React from 'react';
import { Button, Text, View } from 'react-native';
import { MenuRecipeCardProps } from '@components/molecules/MenuRecipeCard';

export function menuRecipeCardMock({
  testId,
  menuItem,
  onToggleCooked,
  onRemove,
}: MenuRecipeCardProps) {
  return (
    <View testID={testId}>
      <Text testID={`${testId}::MenuItemData`}>{JSON.stringify(menuItem)}</Text>
      <Button testID={`${testId}::Checkbox`} title='Toggle Cooked' onPress={onToggleCooked} />
      <Button testID={`${testId}::RemoveButton`} title='Remove' onPress={onRemove} />
    </View>
  );
}
