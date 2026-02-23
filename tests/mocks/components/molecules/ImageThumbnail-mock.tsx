import React from 'react';
import { Button, Text, View } from 'react-native';
import { ImageThumbnailProps } from '@components/molecules/ImageThumbnail';

export function imageThumbnailMock({ uri, icon, testID, onIconPress }: ImageThumbnailProps) {
  const testId = testID + '::Thumbnail';
  return (
    <View testID={testID}>
      {uri !== undefined && <Text testID={testID + '::uri'}>{uri}</Text>}
      {icon !== undefined && onIconPress === undefined && (
        <Text testID={testId + '::Icon'}>{icon}</Text>
      )}
      {icon !== undefined && onIconPress !== undefined && (
        <Button testID={testId + '::IconButton'} onPress={onIconPress} title='icon' />
      )}
    </View>
  );
}
