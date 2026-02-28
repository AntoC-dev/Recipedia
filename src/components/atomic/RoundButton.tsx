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
 *   size="large"
 *   onPressFunction={() => createNewRecipe()}
 *   testID="add-recipe-fab"
 * />
 * ```
 */

import React from 'react';
import { IconName } from '@assets/Icons';
import { FAB, Text } from 'react-native-paper';
import { StyleProp, View, ViewStyle } from 'react-native';
import { padding } from '@styles/spacing';

/**
 * Props for the RoundButton component
 */
export type RoundButtonProps = {
  /** Icon name from the app's icon set */
  icon: IconName;
  /** Size of the button */
  size: 'small' | 'medium' | 'large';
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
    <View
      style={[
        {
          alignItems: 'center',
          alignContent: 'center',
        },
        style,
      ]}
    >
      <FAB
        testID={roundButtonTestId}
        icon={icon}
        size={'medium'}
        mode={'elevated'}
        style={{ borderRadius: 999 }}
        onPress={onPressFunction}
      />
      {label !== undefined && (
        <Text
          testID={roundButtonTestId + '::Label'}
          variant='titleMedium'
          style={{
            textAlign: 'center',
            padding: padding.small,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export default RoundButton;
