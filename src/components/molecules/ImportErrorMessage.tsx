/**
 * ImportErrorMessage - Error message display for import failures
 *
 * Shows error title and message when import fails.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

export type ImportErrorMessageProps = {
  errorMessage: string | null;
  testID: string;
};

export function ImportErrorMessage({ errorMessage, testID }: ImportErrorMessageProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={styles.centerContent} testID={testID}>
      <Text
        variant='headlineSmall'
        style={[styles.statusText, { color: colors.error }]}
        testID={`${testID}::Title`}
      >
        {t('bulkImport.validation.importError')}
      </Text>
      <Text variant='bodyMedium' style={styles.statusText} testID={`${testID}::Message`}>
        {errorMessage}
      </Text>
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
});
