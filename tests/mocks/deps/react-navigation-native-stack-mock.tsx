import React from 'react';
import { View } from 'react-native';

export function reactNavigationNativeStackMock() {
  const createNativeStackNavigator = () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Screen: ({
      component: Component,
      name,
    }: {
      component: React.ComponentType<any>;
      name: string;
    }) => <Component navigation={{}} route={{ name, params: {} }} />,
  });

  return { createNativeStackNavigator };
}
