/**
 * BulkImportSettings - Provider selection screen for bulk recipe import
 *
 * This screen presents users with a list of available recipe providers (like HelloFresh)
 * from which they can bulk import recipes. Each provider is displayed with its logo,
 * name, and description, allowing users to select their preferred import source.
 *
 * Key Features:
 * - Lists all available recipe import providers
 * - Displays provider logos with automatic fallback handling
 * - Navigates to discovery screen when a provider is selected
 * - Supports localized provider descriptions
 *
 * Navigation Flow:
 * Settings -> BulkImportSettings -> BulkImportDiscovery -> BulkImportValidation
 *
 * @example
 * ```typescript
 * // Navigation to this screen
 * navigation.navigate('BulkImportSettings');
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Divider, List, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { AppBar } from '@components/organisms/AppBar';
import { ProviderListItem } from '@components/molecules/ProviderListItem';
import { useI18n } from '@utils/i18n';
import { getAvailableProviders } from '@providers/ProviderRegistry';

/**
 * BulkImportSettings screen component
 *
 * Renders a list of available recipe providers that users can select
 * to start the bulk import process. Selecting a provider navigates
 * to the discovery screen where recipes are scanned and displayed.
 *
 * @returns JSX element representing the provider selection screen
 */
const screenId = 'BulkImportSettings';

export function BulkImportSettings() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<StackScreenNavigation>();

  const providers = getAvailableProviders();

  /**
   * Handles provider selection and navigates to the discovery screen
   *
   * @param providerId - The unique identifier of the selected provider
   */
  const handleProviderPress = (providerId: string) => {
    navigation.navigate('BulkImportDiscovery', { providerId });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppBar
        title={t('bulkImport.fromService')}
        onGoBack={() => navigation.goBack()}
        testID={screenId}
      />

      <List.Subheader testID={screenId + '::Subheader'}>
        {t('bulkImport.selectSource')}
      </List.Subheader>
      <View style={styles.listContainer}>
        <FlashList
          data={providers}
          keyExtractor={provider => provider.id}
          ItemSeparatorComponent={() => <Divider />}
          estimatedItemSize={72}
          renderItem={({ item: provider }) => (
            <ProviderListItem
              provider={provider}
              onPress={() => handleProviderPress(provider.id)}
              testID={screenId + `::Provider::${provider.id}`}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
});

export default BulkImportSettings;
