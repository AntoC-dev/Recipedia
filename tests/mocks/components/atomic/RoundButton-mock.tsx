import { Button, Text, View } from 'react-native';
import React from 'react';
import { RoundButtonProps } from '@components/atomic/RoundButton';

export function roundButtonMock(roundButtonProps: RoundButtonProps) {
  return (
    <View>
      <Text testID={roundButtonProps.testID + '::RoundButton::Icon'}>{roundButtonProps.icon}</Text>
      <Text testID={roundButtonProps.testID + '::RoundButton::Size'}>{roundButtonProps.size}</Text>
      {roundButtonProps.onPressFunction !== undefined ? (
        <Button
          testID={roundButtonProps.testID + '::RoundButton::OnPressFunction'}
          onPress={roundButtonProps.onPressFunction}
          title='Click on Text'
        />
      ) : null}
      {roundButtonProps.label !== undefined && (
        <Text testID={roundButtonProps.testID + '::RoundButton::Label'}>
          {roundButtonProps.label}
        </Text>
      )}
    </View>
  );
}
