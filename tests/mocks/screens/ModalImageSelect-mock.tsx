import React from 'react';
import { Button, Text, View } from 'react-native';
import { ModalImageSelectProps } from '@screens/ModalImageSelect';

export function modalImageSelectMock({
  arrImg,
  onSelectFunction,
  onDismissFunction,
  onImagesUpdated,
  autoSelect,
}: ModalImageSelectProps) {
  return (
    <View testID='ModalImageSelect'>
      <Text testID='ModalImageSelect::Images'>{JSON.stringify(arrImg)}</Text>
      <Text testID='ModalImageSelect::AutoSelect'>{String(autoSelect)}</Text>
      <Button
        testID='ModalImageSelect::Select'
        onPress={() => onSelectFunction(arrImg[0] || 'mock-image-uri')}
        title='Select'
      />
      <Button testID='ModalImageSelect::Dismiss' onPress={onDismissFunction} title='Dismiss' />
      <Button
        testID='ModalImageSelect::AddImage'
        onPress={() => onImagesUpdated('new-mock-image-uri')}
        title='Add Image'
      />
    </View>
  );
}
