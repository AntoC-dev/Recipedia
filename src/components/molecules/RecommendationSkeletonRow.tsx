/**
 * RecommendationSkeletonRow - Animated skeleton placeholder for a recipe recommendation section
 *
 * Displays a pulsing skeleton mimicking a recommendation row (title + carousel cards)
 * while the actual recommendations are being computed.
 *
 * @example
 * ```typescript
 * {isLoading && [0, 1, 2].map(i => <RecommendationSkeletonRow key={i} />)}
 * ```
 */

import React from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { padding, screenWidth } from '@styles/spacing';
import { usePulseOpacity } from '@hooks/usePulseOpacity';

/**
 * RecommendationSkeletonRow component — animated placeholder for one recommendation carousel.
 *
 * @returns JSX element representing a pulsing skeleton row
 */
export function RecommendationSkeletonRow() {
  const { colors } = useTheme();
  const opacity = usePulseOpacity();

  return (
    <Animated.View style={{ opacity }}>
      <View style={[styles.titlePlaceholder, { backgroundColor: colors.surfaceVariant }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surfaceVariant }]} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  titlePlaceholder: {
    height: '10%',
    width: '50%',
    margin: padding.medium,
  },
  card: {
    width: screenWidth * 0.35,
    height: screenWidth * 0.435,
    marginHorizontal: padding.medium,
  },
});
