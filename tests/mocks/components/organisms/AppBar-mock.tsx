import React from 'react';
import { Button, Text, View } from 'react-native';
import { AppBarProps } from '@components/organisms/AppBar';

export function appBarMock({
  onGoBack,
  title,
  testID,
  isEditing = false,
  onCancel,
  onDelete,
  onEdit,
  onValidate,
}: AppBarProps) {
  const testId = testID + '::AppBar';
  return (
    <View testID={testId}>
      {isEditing ? (
        <Button testID={testId + '::Cancel'} onPress={() => onCancel?.()} title='Cancel' />
      ) : (
        <Button testID={testId + '::BackButton'} onPress={onGoBack} title='Back' />
      )}
      {title && (
        <View>
          <Text testID={testId + '::Title'}>{title}</Text>
        </View>
      )}
      {onDelete && <Button testID={testId + '::Delete'} onPress={onDelete} title='Delete' />}
      {onEdit && <Button testID={testId + '::Edit'} onPress={onEdit} title='Edit' />}
      {isEditing && onValidate && (
        <Button testID={testId + '::Validate'} onPress={onValidate} title='Validate' />
      )}
    </View>
  );
}
