import React from 'react';
import { Button, Text, View } from 'react-native';
import { UrlRecipeImportProps } from '@components/organisms/UrlRecipeImport';

export function urlRecipeImportMock({
  testId,
  isVisible,
  initialUrl,
  onClose,
}: UrlRecipeImportProps) {
  const mockTestId = testId + '::UrlRecipeImport';
  return (
    <View testID={mockTestId}>
      <Text testID={mockTestId + '::IsVisible'}>{String(isVisible)}</Text>
      <Text testID={mockTestId + '::InitialUrl'}>{initialUrl}</Text>
      <Button testID={mockTestId + '::OnClose'} onPress={onClose} title='Close' />
    </View>
  );
}
