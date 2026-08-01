import React from 'react';
import { Button, Text, View } from 'react-native';
import { SearchSuggestionItemProps } from '@components/molecules/SearchSuggestionItem';

export function searchSuggestionItemMock({ testId, title, onSelect }: SearchSuggestionItemProps) {
  return (
    <View testID={testId}>
      <Text testID={testId + '::Title'}>{title}</Text>
      <Button testID={testId + '::Select'} onPress={onSelect} title='Select suggestion' />
    </View>
  );
}
