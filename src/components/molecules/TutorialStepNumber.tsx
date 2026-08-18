import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useCopilot } from 'react-native-copilot';
import { radius } from '@styles/spacing';

/**
 * Custom step number component for the tutorial overlay
 *
 * Uses currentStep.order directly instead of the library's currentStepNumber
 * which is incorrectly calculated based on registered steps rather than actual order.
 */
export function TutorialStepNumber() {
  const { colors } = useTheme();
  const { currentStep } = useCopilot();

  if (!currentStep) {
    return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
      <Text variant='titleSmall' style={{ color: colors.onPrimaryContainer }}>
        {currentStep.order}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    aspectRatio: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
