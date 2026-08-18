import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
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
        styles.button,
        { backgroundColor: buttonColor || colors.primary, borderRadius: roundness },
        style,
      ]}
      activeOpacity={0.8}
    >
      <Text
        testID={testID + '::Text'}
        variant='labelLarge'
        style={[styles.text, { color: textColor || colors.onPrimary }]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: padding.large,
    paddingVertical: padding.small,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
