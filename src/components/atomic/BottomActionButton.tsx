import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';

export type BottomActionButtonProps = {
  testID: string;
  onPress: () => void | Promise<void>;
  label: string;
  icon?: string;
  disabled?: boolean;
};

export function BottomActionButton({
  testID,
  onPress,
  label,
  icon,
  disabled = false,
}: BottomActionButtonProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const testId = testID + '::BottomActionButton';
  return (
    <View
      testID={testId + '::Container'}
      style={[
        styles.container,
        { paddingBottom: insets.bottom + padding.small, backgroundColor: colors.background },
      ]}
    >
      <Button
        testID={testId}
        mode='contained'
        icon={icon}
        onPress={() => void onPress()}
        disabled={disabled}
      >
        {label}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: padding.small,
  },
});
