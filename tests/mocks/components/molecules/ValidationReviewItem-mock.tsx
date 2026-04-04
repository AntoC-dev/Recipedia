import React from 'react';
import { Button, Text, View } from 'react-native';
import { ValidationReviewItemProps } from '@components/molecules/ValidationReviewItem';

export function validationReviewItemMock({
  testID,
  itemType,
  itemName,
  suggestedMatch,
  status,
  resolution,
  onUseSuggested,
  onAddNew,
  onPickFromDatabase,
  onSkip,
  onUndo,
}: ValidationReviewItemProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::ItemType`}>{itemType}</Text>
      <Text testID={`${testID}::ItemName`}>{itemName}</Text>
      <Text testID={`${testID}::Status`}>{status}</Text>
      {suggestedMatch && <Text testID={`${testID}::SuggestedMatch`}>{suggestedMatch.name}</Text>}
      {resolution && <Text testID={`${testID}::Resolution`}>{JSON.stringify(resolution)}</Text>}
      <Button testID={`${testID}::onUseSuggested`} onPress={onUseSuggested} title='Use Suggested' />
      <Button testID={`${testID}::onAddNew`} onPress={onAddNew} title='Add New' />
      <Button testID={`${testID}::onPickFromDatabase`} onPress={onPickFromDatabase} title='Pick' />
      <Button testID={`${testID}::onSkip`} onPress={onSkip} title='Skip' />
      <Button testID={`${testID}::onUndo`} onPress={onUndo} title='Undo' />
    </View>
  );
}
