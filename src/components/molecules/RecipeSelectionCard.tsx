/**
 * RecipeSelectionCard - Selectable recipe card for bulk import
 *
 * A card component used in the bulk import discovery screen that displays
 * a discovered recipe with a thumbnail, title, and selection checkbox.
 * Supports toggling selection state via tap on the card or checkbox.
 *
 * Key Features:
 * - Recipe thumbnail with fallback handling
 * - Selection state with visual feedback (background color change)
 * - Checkbox for clear selection indication
 * - Separate callbacks for select/unselect actions
 *
 * @example
 * ```typescript
 * <RecipeSelectionCard
 *   testId="Recipe::0"
 *   recipe={{ url: 'https://...', title: 'Chicken Tikka', imageUrl: '...' }}
 *   isSelected={false}
 *   onSelected={() => addToSelection(recipe.url)}
 *   onUnselected={() => removeFromSelection(recipe.url)}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Checkbox, Icon, Text, useTheme } from 'react-native-paper';
import { CustomImage } from '@components/atomic/CustomImage';
import { padding } from '@styles/spacing';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';

/**
 * Props for the RecipeSelectionCard component
 */
export type RecipeSelectionCardProps = {
  /** Unique identifier for testing */
  testId: string;
  /** Recipe data to display */
  recipe: DiscoveredRecipe;
  /** Whether the recipe is currently selected */
  isSelected: boolean;
  /** Callback invoked when the recipe is selected */
  onSelected: () => void;
  /** Callback invoked when the recipe is unselected */
  onUnselected: () => void;
};

/**
 * RecipeSelectionCard component for recipe selection during bulk import
 *
 * Renders a selectable card with recipe thumbnail, title, and checkbox.
 * The card background changes color to indicate selection state.
 * Shows a "Previously seen" indicator for recipes that were discovered before.
 *
 * @param props - The component props
 * @returns JSX element representing the selectable recipe card
 */
export function RecipeSelectionCard({
  testId,
  recipe,
  isSelected,
  onSelected,
  onUnselected,
}: RecipeSelectionCardProps) {
  const { colors } = useTheme();

  const isPreviouslySeen = recipe.memoryStatus === 'seen';

  const handlePress = () => {
    if (isSelected) {
      onUnselected();
    } else {
      onSelected();
    }
  };

  const getBackgroundColor = () => {
    if (isSelected) {
      return colors.secondaryContainer;
    }
    if (isPreviouslySeen) {
      return colors.surfaceVariant;
    }
    return colors.surface;
  };

  return (
    <Card
      testID={testId}
      mode='outlined'
      style={[styles.card, { backgroundColor: getBackgroundColor() }]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={handlePress}
          testID={testId + '::Checkbox'}
        />

        <View style={styles.thumbnailWrapper}>
          <CustomImage
            uri={recipe.imageUrl}
            size={60}
            borderRadius={8}
            backgroundColor={colors.surfaceVariant}
            testID={testId + '::Thumbnail'}
          />
          {isPreviouslySeen && (
            <View style={[styles.seenBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Icon
                source='history'
                size={14}
                color={colors.onSurfaceVariant}
                testID={testId + '::SeenIndicator'}
              />
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text variant='titleMedium' numberOfLines={2} testID={testId + '::Title'}>
            {recipe.title}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: padding.small,
    marginHorizontal: padding.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: padding.small,
  },
  thumbnailWrapper: {
    marginHorizontal: padding.small,
  },
  textContainer: {
    flex: 1,
    paddingRight: padding.small,
  },
  seenBadge: {
    position: 'absolute',
    bottom: padding.verySmall,
    right: padding.verySmall,
    borderRadius: padding.small,
    padding: padding.verySmall,
  },
});

export default RecipeSelectionCard;
