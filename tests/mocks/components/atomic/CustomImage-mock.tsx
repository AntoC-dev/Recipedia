import React from 'react';
import { Button, Text, View } from 'react-native';
import { CustomImageProps } from '@components/atomic/CustomImage';

export const customImageMock = () => ({
  CustomImage: function CustomImage({
    testID,
    uri,
    contentFit,
    backgroundColor,
    size,
    circular,
    borderRadius,
    onLoadSuccess,
    onLoadError,
    priority,
  }: CustomImageProps) {
    return (
      <View testID={testID}>
        <Text testID={testID + '::Uri'}>{uri}</Text>
        <Text testID={testID + '::ContentFit'}>{contentFit}</Text>
        <Text testID={testID + '::BackgroundColor'}>{backgroundColor}</Text>
        <Text testID={testID + '::Size'}>{size?.toString()}</Text>
        <Text testID={testID + '::Circular'}>{circular?.toString()}</Text>
        <Text testID={testID + '::BorderRadius'}>{borderRadius?.toString()}</Text>
        <Text testID={testID + '::Priority'}>{priority}</Text>
        {onLoadSuccess !== undefined && (
          <Button
            testID={testID + '::OnLoadSuccess'}
            onPress={onLoadSuccess}
            title='Load success'
          />
        )}
        {onLoadError !== undefined && (
          <Button testID={testID + '::OnLoadError'} onPress={onLoadError} title='Load error' />
        )}
      </View>
    );
  },
});
