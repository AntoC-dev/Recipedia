import React from 'react';
import { Button, Text, View } from 'react-native';
import { AdBannerProps } from '@components/organisms/AdBanner';

export function adBannerMock(props: AdBannerProps) {
  return (
    <View testID={`${props.testId}::AdBanner`}>
      <Text testID={`${props.testId}::Placement`}>{props.placement}</Text>
      {props.onHeightChange && (
        <Button onPress={() => props.onHeightChange!(0)} title='onHeightChange' />
      )}
    </View>
  );
}
