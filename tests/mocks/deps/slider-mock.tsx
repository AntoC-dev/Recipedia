import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

const Slider = ({ value, testID, onValueChange }: any) => (
  <TouchableOpacity testID={testID} onPress={() => onValueChange(value + 1)}>
    <Text testID={testID + '::Text'}>{value}</Text>
  </TouchableOpacity>
);

export default Slider;
