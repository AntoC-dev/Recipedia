/**
 * ImportSuccessMessage - Success message after import completion
 *
 * Shows the number of imported recipes and a finish button.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

export type ImportSuccessMessageProps = {
  importedCount: number;
  onFinish: () => void;
  testID: string;
};

export function ImportSuccessMessage({
  importedCount,
  onFinish,
  testID,
}: ImportSuccessMessageProps) {
  const { t } = useI18n();

  return (
    <View style={styles.centerContent}>
      <Text variant='headlineMedium' style={styles.statusText}>
        {t('bulkImport.validation.importComplete')}
      </Text>
      <Text variant='bodyLarge' style={styles.statusText}>
        {t('bulkImport.validation.recipesImported', { count: importedCount })}
      </Text>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginVertical: padding.medium,
  },
  button: {
    marginTop: padding.large,
  },
});

export default ImportSuccessMessage;
