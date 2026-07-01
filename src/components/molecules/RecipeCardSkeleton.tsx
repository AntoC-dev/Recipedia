/**
 * RecipeCardSkeleton - Loading placeholder for RecipeSelectionCard
 *
 * A minimal skeleton component that shows a pulsing placeholder
 * while recipes are being loaded.
 *
 * @module components/molecules/RecipeCardSkeleton
 */

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';
import { usePulseOpacity } from '@hooks/usePulseOpacity';

const AnimatedCard = Animated.View;

export type RecipeCardSkeletonProps = {
  testID: string;
};

export function RecipeCardSkeleton({ testID }: RecipeCardSkeletonProps) {
  const { colors } = useTheme();
  const opacity = usePulseOpacity();

  return (
    <AnimatedCard
      testID={testID}
      style={[styles.card, { backgroundColor: colors.surfaceVariant, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    height: padding.veryLarge * 4,
    marginVertical: padding.small,
    marginHorizontal: padding.medium,
    borderRadius: padding.medium,
  },
});

export default RecipeCardSkeleton;
