import { Button, Text, View } from 'react-native';
import React from 'react';
import { RoundButtonProps } from '@components/atomic/RoundButton';

export function roundButtonMock(roundButtonProps: RoundButtonProps) {
  return (
    <View>
      <Text testID={roundButtonProps.testID + '::RoundButton::Icon'}>{roundButtonProps.icon}</Text>
      {roundButtonProps.onPressFunction !== undefined ? (
        <Button
          testID={roundButtonProps.testID + '::RoundButton::OnPressFunction'}
          onPress={roundButtonProps.onPressFunction}
          title='Click on Text'
        />
      ) : null}
      <Text testID={roundButtonProps.testID + '::RoundButton::Label'}>
        {roundButtonProps.label}
      </Text>
      {roundButtonProps.style !== undefined && (
        <Text testID={roundButtonProps.testID + '::RoundButton::Style'}>
          {JSON.stringify(roundButtonProps.style)}
        </Text>
      )}
    </View>
  );
}
