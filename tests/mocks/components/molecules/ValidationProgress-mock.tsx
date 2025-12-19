import React from 'react';
import { View, Text } from 'react-native';

interface ValidationProgressProps {
  testID: string;
  type: string;
}

export function ValidationProgress({ testID, type }: ValidationProgressProps) {
  return (
    <View testID={`${testID}::${type}Validation`}>
      <Text>{type}</Text>
    </View>
  );
}
