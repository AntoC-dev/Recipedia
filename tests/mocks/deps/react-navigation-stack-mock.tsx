import React from 'react';
import { View } from 'react-native';

export function reactNavigationStackMock() {
  const createStackNavigator = () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Screen: ({
      component: Component,
      name,
    }: {
      component: React.ComponentType<any>;
      name: string;
    }) => <Component navigation={{}} route={{ name, params: {} }} />,
  });

  return {
    createStackNavigator,
    CardStyleInterpolators: {
      forHorizontalIOS: jest.fn(),
      forVerticalIOS: jest.fn(),
      forModalPresentationIOS: jest.fn(),
      forFadeFromBottomAndroid: jest.fn(),
      forRevealFromBottomAndroid: jest.fn(),
    },
    HeaderStyleInterpolators: {
      forUIKit: jest.fn(),
      forFade: jest.fn(),
      forStatic: jest.fn(),
    },
    TransitionPresets: {
      SlideFromRightIOS: {},
      ModalSlideFromBottomIOS: {},
      ModalPresentationIOS: {},
      FadeFromBottomAndroid: {},
      RevealFromBottomAndroid: {},
      ScaleFromCenterAndroid: {},
      DefaultTransition: {},
      ModalTransition: {},
    },
    TransitionSpecs: {
      TransitionIOSSpec: {},
      FadeInFromBottomAndroidSpec: {},
      FadeOutToBottomAndroidSpec: {},
      RevealFromBottomAndroidSpec: {},
    },
  };
}
