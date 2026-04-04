import React from 'react';
import { Button, Text, View } from 'react-native';
import { DatabasePickerDialogProps } from '@components/dialogs/DatabasePickerDialog';

export function DatabasePickerDialog<T extends { name: string }>({
  testId,
  isVisible,
  title,
  items,
  onSelect,
  onDismiss,
}: DatabasePickerDialogProps<T>) {
  const mockTestId = `${testId}::DatabasePickerDialog::Mock`;

  return (
    <View testID={mockTestId}>
      <Text testID={`${mockTestId}::isVisible`}>{String(isVisible)}</Text>
      <Text testID={`${mockTestId}::title`}>{title}</Text>
      <Button testID={`${mockTestId}::onDismiss`} title='onDismiss' onPress={onDismiss} />
      {items.map((item, index) => (
        <Button
          key={index}
          testID={`${mockTestId}::item::${item.name}`}
          title={item.name}
          onPress={() => onSelect(item)}
        />
      ))}
    </View>
  );
}

export default DatabasePickerDialog;
