/**
 * RecipeSelectionCard - Selectable recipe card for bulk import
 *
 * A card component used in the bulk import discovery screen that displays
 * a discovered recipe with a thumbnail, title, and selection checkbox.
 * Supports toggling selection state via tap on the card or checkbox, and
 * flagging a recipe to be permanently hidden from future discovery runs.
 *
 * Key Features:
 * - Recipe thumbnail with fallback handling
 * - Selection state with visual feedback (background color change)
 * - Checkbox for clear selection indication
 * - "Never show again" action, with an in-place dimmed/struck state and an
 *   Undo affordance until the user confirms with Continue
 *
 * @example
 * ```typescript
 * <RecipeSelectionCard
 *   testId="Recipe::0"
 *   recipe={{ url: 'https://...', title: 'Chicken Tikka', imageUrl: '...' }}
 *   isSelected={false}
 *   isDismissed={false}
 *   onSelected={() => addToSelection(recipe.url)}
 *   onUnselected={() => removeFromSelection(recipe.url)}
 *   onDismiss={() => flagHidden(recipe.url)}
 *   onRestore={() => unflagHidden(recipe.url)}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Icon, Text, useTheme } from 'react-native-paper';
import { CustomImage } from '@components/atomic/CustomImage';
import { padding, radius } from '@styles/spacing';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';
import { Icons } from '@assets/Icons';
import { useI18n } from '@utils/i18n';

const ROW_MIN_HEIGHT = 112;
const THUMBNAIL_WIDTH = 96;
const SEEN_ICON_SIZE = 16;

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
  /** Whether the recipe is flagged to be hidden (pending until Continue) */
  isDismissed: boolean;
  /** Callback invoked when the recipe is selected */
  onSelected: () => void;
  /** Callback invoked when the recipe is unselected */
  onUnselected: () => void;
  /** Callback invoked when the recipe is flagged to be hidden */
  onDismiss: () => void;
  /** Callback invoked when a pending dismissal is undone */
  onRestore: () => void;
};

/**
 * RecipeSelectionCard component for recipe selection during bulk import
 *
 * Renders a selectable card with recipe thumbnail, title, and checkbox.
 * The card background changes color to indicate selection state, shows a
 * "Previously seen" indicator for recipes discovered before, and dims with a
 * strikethrough title while flagged to be hidden.
 *
 * @param props - The component props
 * @returns JSX element representing the selectable recipe card
 */
export function RecipeSelectionCard({
  testId,
  recipe,
  isSelected,
  isDismissed,
  onSelected,
  onUnselected,
  onDismiss,
  onRestore,
}: RecipeSelectionCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const isPreviouslySeen = recipe.memoryStatus === 'seen';

  const handlePress = () => {
    if (isDismissed) {
      return;
    }
    if (isSelected) {
      onUnselected();
    } else {
      onSelected();
    }
  };

  const getBackgroundColor = () => {
    if (isDismissed) {
      return colors.surfaceVariant;
    }
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
      accessible={false}
      testID={testId}
      mode='outlined'
      style={[styles.card, { backgroundColor: getBackgroundColor() }]}
      onPress={handlePress}
    >
      <View style={styles.row}>
        <View style={[styles.checkboxColumn, isDismissed && styles.dimmed]}>
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={handlePress}
            disabled={isDismissed}
            testID={testId + '::Checkbox'}
          />
        </View>

        <View style={[styles.imageColumn, isDismissed && styles.dimmed]}>
          <CustomImage
            uri={recipe.imageUrl}
            contentFit='cover'
            borderRadius={radius.medium}
            testID={testId + '::Thumbnail'}
          />
          {isPreviouslySeen && (
            <View
              style={[styles.seenBadge, { backgroundColor: colors.surfaceVariant }]}
              testID={testId + '::SeenIndicator'}
            >
              <Icon source={Icons.history} size={SEEN_ICON_SIZE} color={colors.onSurfaceVariant} />
            </View>
          )}
        </View>

        <View style={styles.textColumn}>
          <Text
            variant='titleMedium'
            numberOfLines={3}
            testID={testId + '::Title'}
            style={isDismissed && styles.dismissedTitle}
          >
            {recipe.title}
          </Text>

          <View style={styles.actionRow}>
            {isDismissed ? (
              <Button
                mode='text'
                compact
                icon={Icons.undo}
                onPress={onRestore}
                accessibilityLabel={t('bulkImport.selection.restoreAccessibility')}
                testID={testId + '::RestoreButton'}
              >
                {t('bulkImport.selection.undo')}
              </Button>
            ) : (
              <Button
                mode='text'
                compact
                icon={Icons.eyeOff}
                onPress={onDismiss}
                textColor={colors.onSurfaceVariant}
                accessibilityLabel={t('bulkImport.selection.dismissAccessibility')}
                testID={testId + '::DismissButton'}
              >
                {t('bulkImport.selection.dismiss')}
              </Button>
            )}
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: ROW_MIN_HEIGHT,
    paddingVertical: padding.small,
    paddingLeft: padding.verySmall,
  },
  checkboxColumn: {
    justifyContent: 'center',
  },
  imageColumn: {
    width: THUMBNAIL_WIDTH,
    marginHorizontal: padding.small,
  },
  seenBadge: {
    position: 'absolute',
    top: padding.verySmall,
    right: padding.verySmall,
    borderRadius: radius.full,
    padding: padding.verySmall,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: padding.medium,
  },
  dismissedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  dimmed: {
    opacity: 0.4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default RecipeSelectionCard;
