/**
 * ProviderListItem - List item component for recipe providers
 *
 * Displays a recipe provider in a list format with logo, name, description,
 * and navigation chevron. Used in the bulk import settings screen.
 *
 * @example
 * ```typescript
 * <ProviderListItem
 *   provider={helloFreshProvider}
 *   onPress={() => navigate('BulkImportDiscovery', { providerId: 'hellofresh' })}
 *   testID="BulkImportSettings::Provider::hellofresh"
 * />
 * ```
 */

import React from 'react';
import { View } from 'react-native';
import { List } from 'react-native-paper';
import { ProviderLogo } from '@components/molecules/ProviderLogo';
import { useI18n } from '@utils/i18n';
import { RecipeProvider } from '@customTypes/BulkImportTypes';
import { Icons } from '@assets/Icons';

/**
 * Props for the ProviderListItem component
 */
export type ProviderListItemProps = {
  /** The recipe provider to display */
  provider: RecipeProvider;
  /** Callback invoked when the list item is pressed */
  onPress: () => void;
  /** Unique identifier for testing */
  testID: string;
};

/**
 * ProviderListItem component for displaying a recipe provider
 *
 * Renders a List.Item with the provider's logo, name, and localized description.
 * Includes a chevron icon to indicate navigation.
 *
 * @param props - The component props
 * @returns JSX element representing the provider list item
 */
export function ProviderListItem({ provider, onPress, testID }: ProviderListItemProps) {
  const { t } = useI18n();

  return (
    <View>
      <List.Item
        testID={testID}
        title={provider.name}
        description={t(`bulkImport.provider_${provider.id}.Description`)}
        left={() => <ProviderLogo logoUrl={provider.logoUrl} testID={testID + '::Logo'} />}
        right={props => <List.Icon {...props} icon={Icons.chevronRight} />}
        onPress={onPress}
      />
    </View>
  );
}

export default ProviderListItem;
