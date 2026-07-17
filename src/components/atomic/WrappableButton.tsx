import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';

export type WrappableButtonProps = {
  onPress: () => void;
  children: string;
  testID?: string;
  buttonColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function WrappableButton({
  onPress,
  children,
  testID,
  buttonColor,
  textColor,
  style,
}: WrappableButtonProps) {
  const { colors, roundness } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={[
        {
          backgroundColor: buttonColor || colors.primary,
          borderRadius: roundness,
          paddingHorizontal: padding.large,
          paddingVertical: padding.small,
          minHeight: 40,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      <Text
        testID={testID + '::Text'}
        variant='labelLarge'
        style={{
          color: textColor || colors.onPrimary,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
