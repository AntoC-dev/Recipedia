import { Button, Text, View } from 'react-native';
import React from 'react';
import { SettingsItem, SettingsItemCardProps } from '@components/molecules/SettingsItemCard';

export function settingsItemCardMock<T extends SettingsItem>({
  type,
  testIdPrefix,
  item,
  onEdit,
  onDelete,
}: SettingsItemCardProps<T>) {
  const testId = testIdPrefix + `::SettingsItemCard`;
  return (
    <View>
      <Text testID={testId + '::Type'}>{type}</Text>
      <Text testID={testId + '::Item'}>{JSON.stringify(item)}</Text>
      <Button testID={testId + '::OnEdit'} onPress={() => onEdit(item)} title='On Edit' />
      <Button testID={testId + '::OnDelete'} onPress={() => onDelete(item)} title='On Delete' />
    </View>
  );
}
