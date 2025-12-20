/**
 * RecipeParsingProgress - Progress display for recipe parsing
 *
 * Displays a centered spinner, progress counter, current recipe title,
 * progress bar, and failed recipe count during the parsing phase.
 * Includes a "Continue Anyway" button when some recipes have been parsed.
 *
 * @module components/molecules/RecipeParsingProgress
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { ParsingProgress } from '@customTypes/BulkImportTypes';
import { padding } from '@styles/spacing';

/**
 * Props for the RecipeParsingProgress component
 */
export type RecipeParsingProgressProps = {
  /** Current parsing progress state */
  progress: ParsingProgress | null;
  /** Total number of selected recipes */
  selectedCount: number;
  /** Test ID for testing */
  testID: string;
};

/**
 * RecipeParsingProgress component for displaying parsing progress
 *
 * Shows a spinner, progress bar, and current recipe being parsed.
 * Displays failure count when some recipes fail to parse.
 *
 * @param props - Component props
 * @returns JSX element representing the parsing progress display
 */
export function RecipeParsingProgress({
  progress,
  selectedCount,
  testID,
}: RecipeParsingProgressProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const progressValue = progress ? progress.current / progress.total : 0;
  const failedCount = progress?.failedRecipes?.length ?? 0;

  return (
    <View style={styles.parsingOverlay}>
      <ActivityIndicator size='large' style={styles.spinner} />
      <Text variant='headlineSmall' style={styles.parsingTitle}>
        {t('bulkImport.selection.parsingRecipes')}
      </Text>
      <Text variant='bodyLarge' style={styles.parsingProgress}>
        {progress?.current ?? 0} / {progress?.total ?? selectedCount}
      </Text>
      {progress?.currentRecipeTitle && (
        <Text
          variant='bodyMedium'
          style={[styles.parsingCurrentTitle, { color: colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {progress.currentRecipeTitle}
        </Text>
      )}
      <ProgressBar
        progress={progressValue}
        style={styles.progressBar}
        testID={testID + '::ParsingProgressBar'}
      />
      {failedCount > 0 && (
        <Text
          variant='bodySmall'
          style={[styles.failedText, { color: colors.error }]}
          testID={testID + '::FailedCount'}
        >
          {t('bulkImport.selection.failedRecipes', { count: failedCount })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  parsingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: padding.medium,
  },
  spinner: {
    marginBottom: padding.veryLarge,
  },
  parsingTitle: {
    textAlign: 'center',
    marginBottom: padding.small,
  },
  parsingProgress: {
    textAlign: 'center',
    marginBottom: padding.small,
  },
  parsingCurrentTitle: {
    textAlign: 'center',
    marginBottom: padding.large,
  },
  progressBar: {
    width: '100%',
    height: padding.small,
    borderRadius: padding.verySmall,
  },
  failedText: {
    textAlign: 'center',
    marginTop: padding.large,
  },
});

export default RecipeParsingProgress;
