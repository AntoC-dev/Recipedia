/**
 * DiscoveryFooter - Footer component for the bulk import discovery screen
 *
 * Displays error message (if any) and the continue button.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

export type DiscoveryFooterProps = {
  error: string | null;
  selectedCount: number;
  isDiscovering: boolean;
  onContinue: () => void;
  testID: string;
};

export function DiscoveryFooter({
  error,
  selectedCount,
  isDiscovering,
  onContinue,
  testID,
}: DiscoveryFooterProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={styles.footer}>
      {error && (
        <Text variant='bodySmall' style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
      <Button
        mode='contained'
        onPress={onContinue}
        disabled={selectedCount === 0 || isDiscovering}
        testID={testID + '::ContinueButton'}
      >
        {t('bulkImport.selection.continueToValidation')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: padding.medium,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: padding.small,
  },
});

export default DiscoveryFooter;
