import React from 'react';
import { Button, Text, View } from 'react-native';
import { SettingsItemListProps } from '@components/organisms/SettingsItemList';
import { SettingsItem } from '@components/molecules/SettingsItemCard';

export function settingsItemListMock<T extends SettingsItem>({
  testIdPrefix,
  onEdit,
  onDelete,
  type,
  items,
}: SettingsItemListProps<T>) {
  const dialogTestID = testIdPrefix + `::SettingsItemList`;
  return (
    <View>
      <Text testID={dialogTestID + '::Type'}>{type}</Text>
      <Text testID={dialogTestID + '::Items'}>{JSON.stringify(items)}</Text>
      <Button testID={dialogTestID + '::OnEdit'} onPress={() => onEdit(items[0]!)} title='Edit' />
      <Button
        testID={dialogTestID + '::OnDelete'}
        onPress={() => onDelete(items[0]!)}
        title='Delete'
      />
    </View>
  );
}
