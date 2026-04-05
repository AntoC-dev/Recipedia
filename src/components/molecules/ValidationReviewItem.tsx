/**
 * ValidationReviewItem - Card component for a single validation item
 *
 * Displays an item (tag or ingredient) needing validation during bulk import.
 * Shows pending state with action chips or resolved/skipped state with undo option.
 *
 * @module components/molecules/ValidationReviewItem
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { ingredientTableElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { ValidationItemStatus, ValidationResolution } from '@customTypes/ValidationTypes';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { Icons } from '@assets/Icons';

export type ValidationReviewItemProps = {
  testID: string;
  itemType: 'Tag' | 'Ingredient';
  itemName: string;
  suggestedMatch?: tagTableElement | ingredientTableElement;
  status: ValidationItemStatus;
  resolution?: ValidationResolution;
  onUseSuggested: () => void;
  onAddNew: () => void;
  onPickFromDatabase: () => void;
  onSkip: () => void;
  onUndo: () => void;
};

const STATUS_ICON_SIZE = 20;

/**
 * ValidationReviewItem component
 *
 * Renders a card for a single tag or ingredient during bulk import validation.
 * In pending state, shows action chips for resolution. In resolved/skipped state,
 * shows the result with an undo option.
 *
 * @param props - Component props
 * @returns JSX element representing a validation review card
 */
export function ValidationReviewItem({
  testID,
  itemName,
  suggestedMatch,
  status,
  resolution,
  onUseSuggested,
  onAddNew,
  onPickFromDatabase,
  onSkip,
  onUndo,
}: ValidationReviewItemProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  if (status === 'pending') {
    return (
      <Card style={styles.card} testID={testID}>
        <Card.Content>
          <Text variant='titleMedium' testID={`${testID}::Name`}>
            {itemName}
          </Text>
          {suggestedMatch && (
            <Text
              variant='bodySmall'
              style={{ color: colors.onSurfaceVariant }}
              testID={`${testID}::SuggestedMatch`}
            >
              {t('bulkImport.validation.similarTo', { name: suggestedMatch.name })}
            </Text>
          )}
          <View style={styles.chipArea}>
            {suggestedMatch && (
              <Chip
                mode='flat'
                compact={false}
                icon={Icons.checkIcon}
                onPress={onUseSuggested}
                style={styles.suggestionChip}
                testID={`${testID}::UseSuggestedChip`}
              >
                {t('bulkImport.validation.useSuggested', { name: suggestedMatch.name })}
              </Chip>
            )}
            <View style={styles.secondaryRow}>
              <Chip
                compact={true}
                icon={Icons.plusIcon}
                mode='outlined'
                style={styles.secondaryChip}
                onPress={onAddNew}
                testID={`${testID}::AddNewChip`}
              >
                {t('bulkImport.validation.addNew')}
              </Chip>
              <Chip
                compact={true}
                icon={Icons.searchIcon}
                mode='outlined'
                style={styles.secondaryChip}
                onPress={onPickFromDatabase}
                testID={`${testID}::PickChip`}
              >
                {t('bulkImport.validation.pick')}
              </Chip>
              <Chip
                compact={true}
                icon='close'
                mode='outlined'
                style={[styles.secondaryChip, styles.skipChip]}
                onPress={onSkip}
                testID={`${testID}::SkipChip`}
              >
                {t('bulkImport.validation.skip')}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const isResolved = status === 'resolved';

  return (
    <Card style={[styles.card, { opacity: 0.6 }]} testID={testID}>
      <Card.Content style={styles.resolvedContent}>
        <Icon
          source={isResolved ? 'check-circle' : 'close-circle'}
          size={STATUS_ICON_SIZE}
          color={isResolved ? colors.primary : colors.onSurfaceVariant}
        />
        <View style={styles.resolvedTextContainer}>
          <Text variant='titleMedium' testID={`${testID}::Name`}>
            {itemName}
          </Text>
          <Text
            variant='bodySmall'
            style={{ color: colors.onSurfaceVariant }}
            testID={`${testID}::StatusText`}
          >
            {isResolved && resolution
              ? t('bulkImport.validation.mappedTo', { name: resolution.resolvedItem.name })
              : t('bulkImport.validation.skipped')}
          </Text>
        </View>
        <IconButton
          icon={Icons.undo}
          size={STATUS_ICON_SIZE}
          onPress={onUndo}
          testID={`${testID}::UndoButton`}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: padding.small,
  },
  chipArea: {
    marginTop: padding.small,
  },
  suggestionChip: {
    width: '100%',
    marginBottom: padding.small,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: padding.small,
  },
  secondaryChip: {
    flex: 1,
  },
  skipChip: {
    opacity: 0.7,
  },
  resolvedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.small,
  },
  resolvedTextContainer: {
    flex: 1,
  },
});

export default ValidationReviewItem;
