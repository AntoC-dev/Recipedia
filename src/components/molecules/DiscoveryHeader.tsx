/**
 * DiscoveryHeader - Header component for the bulk import discovery screen
 *
 * Displays recipe count, discovery progress status, and selection count.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { DiscoveryProgress } from '@customTypes/BulkImportTypes';
import { padding } from '@styles/spacing';

export type DiscoveryHeaderProps = {
  recipesCount: number;
  selectedCount: number;
  isDiscovering: boolean;
  discoveryProgress: DiscoveryProgress | null;
  testID: string;
};

export function DiscoveryHeader({
  recipesCount,
  selectedCount,
  isDiscovering,
  discoveryProgress,
  testID,
}: DiscoveryHeaderProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Text variant='headlineSmall' testID={testID + '::RecipeCount'}>
        {t('bulkImport.discovery.recipesFound', { count: recipesCount })}
      </Text>
      {isDiscovering && discoveryProgress && (
        <View style={styles.discoveryStatus} testID={testID + '::DiscoveryProgress'}>
          <ActivityIndicator size='small' style={styles.smallSpinner} />
          <Text variant='bodySmall' style={{ color: colors.onSurfaceVariant }}>
            {t('bulkImport.discovery.scanningCategories', {
              current: discoveryProgress.categoriesScanned,
              total: discoveryProgress.totalCategories,
            })}
          </Text>
        </View>
      )}
      <Text
        variant='bodyMedium'
        style={{ color: colors.onSurfaceVariant }}
        testID={testID + '::SelectedCount'}
      >
        {t('bulkImport.selection.selectedCount', { count: selectedCount, total: recipesCount })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: padding.medium,
    paddingVertical: padding.small,
  },
  discoveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: padding.verySmall,
  },
  smallSpinner: {
    marginRight: padding.small,
  },
});

export default DiscoveryHeader;
