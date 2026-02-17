import React from 'react';
import { Text } from 'react-native';

export function MockAppWrapper() {
  return <Text testID='app-wrapper'>App Content</Text>;
}

export function appWrapperMock() {
  return MockAppWrapper;
}
