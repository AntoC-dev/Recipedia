import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

const Slider = ({ value, testID, onValueChange, tapToSeek }: any) => (
  <TouchableOpacity testID={testID} onPress={() => onValueChange(value + 1)}>
    <Text testID={testID + '::Text'}>{value}</Text>
    <Text testID={testID + '::TapToSeek'}>{String(!!tapToSeek)}</Text>
  </TouchableOpacity>
);

export default Slider;
