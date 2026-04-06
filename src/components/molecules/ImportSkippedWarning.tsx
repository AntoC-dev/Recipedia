/**
 * ImportSkippedWarning - Warning screen shown before validation when recipes have no ingredients
 *
 * Informs the user that some recipes could not be parsed (no ingredient names were found)
 * and will be skipped. Displayed as a dedicated phase before the validation review queue
 * so the user is aware before spending time validating other ingredients.
 *
 * @module components/molecules/ImportSkippedWarning
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { SkippedRecipeInfo } from '@customTypes/BulkImportTypes';
import { SkippedRecipesList } from '@components/molecules/SkippedRecipesList';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { Icons } from '@assets/Icons';

export interface ImportSkippedWarningProps {
  /** Recipes that will be skipped due to missing ingredient names */
  skippedRecipes: SkippedRecipeInfo[];
  /** Called when the user acknowledges the warning and continues */
  onContinue: () => void;
  /** Test ID prefix for component testing */
  testID: string;
}

/**
 * Renders a warning screen listing recipes that will be skipped
 *
 * @param props - See {@link ImportSkippedWarningProps}
 */
export function ImportSkippedWarning({
  skippedRecipes,
  onContinue,
  testID,
}: ImportSkippedWarningProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={styles.root} testID={testID}>
      <SkippedRecipesList
        skippedRecipes={skippedRecipes}
        testID={`${testID}::SkippedList`}
        scrollEnabled={true}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Icon source={Icons.alertWithCircle} size={35} color={colors.secondary} />
              <Text
                variant='titleLarge'
                style={[styles.title, { color: colors.secondary }]}
                testID={`${testID}::Title`}
              >
                {t('bulkImport.validation.skippedWarningTitle')}
              </Text>
            </View>
            <Text variant='bodyMedium' style={styles.body} testID={`${testID}::Body`}>
              {t('bulkImport.validation.skippedWarningBody')}
            </Text>
          </View>
        }
      />
      <Button
        mode='contained'
        onPress={onContinue}
        style={styles.button}
        testID={`${testID}::ContinueButton`}
      >
        {t('bulkImport.validation.continueToImport')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: padding.medium,
  },
  header: {
    gap: padding.small,
    marginBottom: padding.large,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: padding.small,
  },
  title: {
    flex: 1,
  },
  body: {
    opacity: 0.8,
  },
  button: {
    marginTop: padding.medium,
  },
});

export default ImportSkippedWarning;
