/**
 * RecipeParsingProgress - Progress display for recipe parsing
 *
 * Displays a centered spinner, progress counter, current recipe title,
 * progress bar, and failed recipe count during the parsing phase.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { ParsingProgress } from '@customTypes/BulkImportTypes';
import { padding } from '@styles/spacing';

export type RecipeParsingProgressProps = {
  progress: ParsingProgress | null;
  selectedCount: number;
  testID: string;
};

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
        <Text variant='bodySmall' style={[styles.failedText, { color: colors.error }]}>
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
