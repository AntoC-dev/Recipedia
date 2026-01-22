/**
 * TagButton - Interactive chip-style tag button with icon support
 *
 * A customizable chip component built on React Native Paper's Chip with support
 * for both left and right icons. Perfect for displaying tags, categories, filters,
 * and other label-like interactive elements with consistent Material Design styling.
 *
 * Key Features:
 * - Left icon support with automatic theming
 * - Right icon (close) support for removable tags
 * - Theme-aware colors and typography
 * - Consistent spacing and border radius
 * - Interactive press and close handlers
 * - Material Design 3 integration
 *
 * @example
 * ```typescript
 * // Simple tag
 * <TagButton
 *   text="Vegetarian"
 *   onPressFunction={() => filterByTag('vegetarian')}
 *   testID="vegetarian-tag"
 * />
 *
 * // Tag with left icon
 * <TagButton
 *   text="Breakfast"
 *   leftIcon="coffee"
 *   onPressFunction={() => selectCategory('breakfast')}
 *   testID="breakfast-category"
 * />
 *
 * // Removable tag with close icon
 * <TagButton
 *   text="Gluten-Free"
 *   rightIcon="close"
 *   onPressFunction={() => removeTag('gluten-free')}
 *   testID="gluten-free-tag"
 * />
 * ```
 */

import React from 'react';
import { IconName } from '@assets/Icons';
import { Chip, Icon, MD3Theme, useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';

/**
 * Props for the TagButton component
 */
export type TagButtonProps = {
  /** Text displayed on the tag */
  text: string;
  /** Optional icon displayed on the left side */
  leftIcon?: IconName;
  /** Optional icon displayed on the right side (typically close) */
  rightIcon?: IconName;
  /** Function called when tag is pressed or close icon is pressed */
  onPressFunction?: () => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
};

/**
 * TagButton component
 *
 * @param props - The component props
 * @returns JSX element representing an interactive chip-style tag button
 */
export function TagButton(props: TagButtonProps) {
  const { colors, fonts }: MD3Theme = useTheme();

  // Create custom icon functions with specific color
  // The Chip component automatically passes the size parameter to our icon function
  // We use that size and override only the color
  const leftIconComponent = props.leftIcon
    ? ({ size }: { size: number }) => (
        <Icon source={props.leftIcon} size={size} color={colors.onSecondaryContainer} />
      )
    : undefined;

  return (
    <Chip
      testID={props.testID + '::Chip'}
      style={{
        backgroundColor: colors.secondaryContainer,
        borderRadius: 20,
        margin: padding.verySmall,
      }}
      textStyle={[fonts.bodySmall, { color: colors.onSecondaryContainer }]}
      mode={'outlined'}
      selectedColor={colors.secondary}
      icon={leftIconComponent}
      closeIcon={props.rightIcon}
      onClose={props.rightIcon ? props.onPressFunction : undefined}
      onPress={props.onPressFunction}
    >
      {props.text}
    </Chip>
  );
}

export default TagButton;
