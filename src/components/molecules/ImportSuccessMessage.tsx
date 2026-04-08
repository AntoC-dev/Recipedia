/**
 * ImportSuccessMessage - Success message after import completion
 *
 * Shows the number of imported recipes and a finish button.
 * When recipes were skipped during import, also shows the skipped list
 * with copyable source URLs so the user can add them manually.
 *
 * @module components/molecules/ImportSuccessMessage
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, Text, useTheme } from 'react-native-paper';
import { SkippedRecipeInfo } from '@customTypes/BulkImportTypes';
import { SkippedRecipesList } from '@components/molecules/SkippedRecipesList';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { Icons } from '@assets/Icons';

/**
 * Props for the ImportSuccessMessage component
 */
export type ImportSuccessMessageProps = {
  /** Number of recipes successfully imported */
  importedCount: number;
  /** Recipes that were skipped due to missing ingredients; shown as a copyable list when non-empty */
  skippedRecipes?: SkippedRecipeInfo[];
  /** Called when the user taps the Finish button */
  onFinish: () => void;
  /** Test ID prefix for component testing */
  testID: string;
};

/**
 * Renders the post-import success screen with imported count and optional skipped recipes list
 *
 * @param props - See {@link ImportSuccessMessageProps}
 */
export function ImportSuccessMessage({
  importedCount,
  skippedRecipes = [],
  onFinish,
  testID,
}: ImportSuccessMessageProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const hasSkipped = skippedRecipes.length > 0;
  const skippedCount = skippedRecipes.length;
  const sectionTitle =
    skippedCount === 1
      ? t('bulkImport.validation.skippedSectionTitle', { count: skippedCount })
      : t('bulkImport.validation.skippedSectionTitlePlural', { count: skippedCount });

  return (
    <View style={styles.root}>
      <SkippedRecipesList
        skippedRecipes={skippedRecipes}
        testID={`${testID}::SkippedList`}
        scrollEnabled={hasSkipped}
        contentContainerStyle={hasSkipped ? undefined : styles.centeredContent}
        ListHeaderComponent={
          <>
            <View style={[styles.successSection, !hasSkipped && styles.successSectionCentered]}>
              <View style={styles.titleRow}>
                <Icon source={Icons.checkWithCircle} size={35} color={colors.primary} />
                <Text variant='headlineMedium' style={[styles.title, { color: colors.primary }]}>
                  {t('bulkImport.validation.importComplete')}
                </Text>
              </View>
              <Text variant='bodyLarge'>
                {importedCount === 1
                  ? t('bulkImport.validation.recipesImported', { count: importedCount })
                  : t('bulkImport.validation.recipesImportedPlural', { count: importedCount })}
              </Text>
            </View>
            {hasSkipped && (
              <>
                <Divider style={styles.divider} />
                <View style={[styles.titleRow, styles.skippedHeaderRow]}>
                  <Icon source={Icons.alertWithCircle} size={20} color={colors.secondary} />
                  <Text
                    variant='titleMedium'
                    style={[styles.skippedHeader, { color: colors.secondary }]}
                    testID={`${testID}::SkippedHeader`}
                  >
                    {sectionTitle}
                  </Text>
                </View>
              </>
            )}
          </>
        }
      />
      <Button
        mode='contained'
        onPress={onFinish}
        style={styles.button}
        testID={testID + '::FinishButton'}
      >
        {t('bulkImport.validation.finish')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: padding.medium,
  },
  successSection: {
    marginBottom: padding.large,
    gap: padding.small,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: padding.small,
  },
  title: {
    flex: 1,
  },
  divider: {
    marginBottom: padding.medium,
  },
  skippedHeaderRow: {
    marginVertical: padding.medium,
  },
  skippedHeader: {
    flex: 1,
  },
  successSectionCentered: {
    alignItems: 'center',
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  button: {
    marginTop: padding.large,
  },
});

export default ImportSuccessMessage;
