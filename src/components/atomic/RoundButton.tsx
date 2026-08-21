/**
 * RoundButton - Circular floating action button with icon
 *
 * A customizable round button component built on React Native Paper's FAB.
 * Provides consistent circular button styling with icon support and multiple sizes.
 * Perfect for primary actions and floating action buttons throughout the app.
 *
 * @example
 * ```typescript
 * <RoundButton
 *   icon="plus"
 *   onPressFunction={() => createNewRecipe()}
 *   testID="add-recipe-fab"
 * />
 * ```
 */

import React from 'react';
import { IconName } from '@assets/Icons';
import { FAB, Text } from 'react-native-paper';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { padding, radius } from '@styles/spacing';

/**
 * Props for the RoundButton component
 */
export type RoundButtonProps = {
  /** Icon name from the app's icon set */
  icon: IconName;
  /** Function called when button is pressed */
  onPressFunction: () => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Optional text label rendered below the button */
  label?: string;
  /** Custom styles for the button container */
  style?: StyleProp<ViewStyle>;
};

/**
 * RoundButton component
 *
 * @param props - The component props
 * @returns JSX element representing a circular FAB button
 */
export function RoundButton({ icon, onPressFunction, testID, label, style }: RoundButtonProps) {
  const roundButtonTestId = testID + '::RoundButton';

  return (
    <View testID={roundButtonTestId + '::Container'} style={[styles.container, style]}>
      <FAB
        testID={roundButtonTestId}
        icon={icon}
        size={'medium'}
        mode={'elevated'}
        style={styles.fab}
        onPress={onPressFunction}
      />
      {label !== undefined && (
        <Text testID={roundButtonTestId + '::Label'} variant='titleMedium' style={styles.label}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignContent: 'center',
  },
  fab: {
    borderRadius: radius.full,
  },
  label: {
    textAlign: 'center',
    padding: padding.small,
  },
});
