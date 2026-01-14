import React from 'react';
import { Text, View } from 'react-native';
import { AdBannerProps } from '@components/organisms/AdBanner';

export function adBannerMock(props: AdBannerProps) {
  return (
    <View testID={props.testId}>
      <Text testID={`${props.testId}::Placement`}>{props.placement}</Text>
    </View>
  );
}
