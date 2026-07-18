import { Button, Text, View } from 'react-native';
import React from 'react';
import { TagButtonProps } from '@components/atomic/TagButton';

export function tagButtonMock(tagButtonProps: TagButtonProps) {
  return (
    <View>
      <Text testID='TagButton::Text'>{JSON.stringify(tagButtonProps.text)}</Text>
      <Text testID='TagButton::LeftIcon'>{JSON.stringify(tagButtonProps.leftIcon)}</Text>
      <Text testID='TagButton::RightIcon'>{JSON.stringify(tagButtonProps.rightIcon)}</Text>
      {tagButtonProps.onPressFunction !== undefined ? (
        <Button
          testID='TagButton::OnPressFunction'
          onPress={tagButtonProps.onPressFunction}
          title='Click on Text'
        />
      ) : null}
    </View>
  );
}
