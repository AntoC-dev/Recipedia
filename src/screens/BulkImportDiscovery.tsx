/**
 * BulkImportDiscovery - Recipe discovery and selection screen for bulk import
 *
 * This screen handles the multi-phase process of discovering recipes from an external
 * provider, allowing users to select which recipes to import, and parsing the selected
 * recipes for validation. It provides real-time progress feedback during discovery
 * and parsing phases.
 *
 * Screen Phases:
 * 1. **Discovering**: Scans provider categories, yields recipes as they're found
 * 2. **Selecting**: Users browse and select recipes to import
 * 3. **Parsing**: Fetches full recipe data for selected recipes
 *
 * Key Features:
 * - Real-time recipe discovery with streaming progress
 * - Background image loading for discovered recipes
 * - Select all/deselect all functionality
 * - Progress tracking during recipe parsing
 * - Abort support for long-running operations
 * - Error handling with user feedback
 *
 * Navigation Flow:
 * BulkImportSettings -> BulkImportDiscovery -> BulkImportValidation
 *
 * @example
 * ```typescript
 * // Navigate to this screen
 * navigation.navigate('BulkImportDiscovery', { providerId: 'hellofresh' });
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackScreenNavigation, StackScreenParamList } from '@customTypes/ScreenTypes';
import { AppBar } from '@components/organisms/AppBar';
import { RecipeSelectionCard } from '@components/molecules/RecipeSelectionCard';
import { DiscoveryFooter } from '@components/molecules/DiscoveryFooter';
import { DiscoveryHeader } from '@components/molecules/DiscoveryHeader';
import { RecipeParsingProgress } from '@components/molecules/RecipeParsingProgress';
import { SelectAllRow } from '@components/molecules/SelectAllRow';
import { useI18n } from '@utils/i18n';
import { getProvider } from '@providers/ProviderRegistry';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import { useDiscoveryWorkflow } from '@hooks/useDiscoveryWorkflow';

type BulkImportDiscoveryRouteProp = RouteProp<StackScreenParamList, 'BulkImportDiscovery'>;

const screenId = 'BulkImportDiscovery';

/**
 * BulkImportDiscovery screen component
 *
 * Manages the discovery, selection, and parsing workflow for bulk recipe import.
 * Uses async generators to stream progress updates during discovery and parsing.
 *
 * @returns JSX element representing the discovery and selection screen
 */
export function BulkImportDiscovery() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<StackScreenNavigation>();
  const route = useRoute<BulkImportDiscoveryRouteProp>();
  const { providerId } = route.params;
  const { defaultPersons } = useDefaultPersons();

  const provider = getProvider(providerId);

  const {
    phase,
    recipes,
    recipesWithImages,
    selectedCount,
    allSelected,
    isDiscovering,
    showSelectionUI,
    discoveryProgress,
    parsingProgress,
    error,
    isSelected,
    selectRecipe,
    unselectRecipe,
    toggleSelectAll,
    parseSelectedRecipes,
    abort,
  } = useDiscoveryWorkflow(provider, defaultPersons);

  const handleCancel = () => {
    abort();
    navigation.goBack();
  };

  const handleContinue = async () => {
    const convertedRecipes = await parseSelectedRecipes();
    if (convertedRecipes) {
      navigation.navigate('BulkImportValidation', {
        providerId,
        selectedRecipes: convertedRecipes,
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppBar title={t('bulkImport.selection.title')} onGoBack={handleCancel} testID={screenId} />

      {showSelectionUI && (
        <View style={styles.selectionContainer}>
          <DiscoveryHeader
            recipesCount={recipes.length}
            selectedCount={selectedCount}
            isDiscovering={isDiscovering}
            discoveryProgress={discoveryProgress}
            testID={screenId}
          />

          {recipes.length > 0 && (
            <SelectAllRow
              allSelected={allSelected}
              selectedCount={selectedCount}
              onToggle={toggleSelectAll}
              testID={screenId}
            />
          )}

          {recipes.length > 0 ? (
            <View style={styles.list}>
              <FlashList
                data={recipesWithImages}
                keyExtractor={item => item.url}
                extraData={selectedCount}
                estimatedItemSize={88}
                renderItem={({ item, index }) => (
                  <RecipeSelectionCard
                    testId={screenId + `::Recipe::${index}`}
                    recipe={item}
                    isSelected={isSelected(item.url)}
                    onSelected={() => selectRecipe(item.url)}
                    onUnselected={() => unselectRecipe(item.url)}
                  />
                )}
              />
            </View>
          ) : phase === 'selecting' ? (
            <View style={styles.emptyState}>
              <Text variant='bodyLarge' style={styles.emptyText}>
                {t('bulkImport.selection.noRecipesFound')}
              </Text>
            </View>
          ) : (
            <View style={styles.initialLoading}>
              <ActivityIndicator size='large' />
            </View>
          )}

          <DiscoveryFooter
            error={error}
            selectedCount={selectedCount}
            isDiscovering={isDiscovering}
            onContinue={handleContinue}
            testID={screenId}
          />
        </View>
      )}

      {phase === 'parsing' && (
        <RecipeParsingProgress
          progress={parsingProgress}
          selectedCount={selectedCount}
          testID={screenId}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  selectionContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  initialLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default BulkImportDiscovery;
