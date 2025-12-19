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
import { DiscoveryListItem } from '@customTypes/BulkImportTypes';
import { buildDiscoveryListData } from '@utils/BulkImportUtils';
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
import { padding } from '@styles/spacing';

type BulkImportDiscoveryRouteProp = RouteProp<StackScreenParamList, 'BulkImportDiscovery'>;

const screenId = 'BulkImportDiscovery';
const RECIPE_CARD_HEIGHT = 88;
const SECTION_HEADER_HEIGHT = 40;

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
    freshRecipes,
    seenRecipes,
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
    markUrlsAsSeen,
  } = useDiscoveryWorkflow(provider, defaultPersons, providerId);

  const totalRecipesCount = freshRecipes.length + seenRecipes.length;
  const listData = buildDiscoveryListData(freshRecipes, seenRecipes);

  const handleCancel = () => {
    abort();
    navigation.goBack();
  };

  const renderListItem = ({ item }: { item: DiscoveryListItem }) => {
    if (item.type === 'header') {
      return (
        <Text
          testID={`${screenId}::${item.key}`}
          variant='titleSmall'
          style={[styles.sectionHeader, { color: colors.onSurfaceVariant }]}
        >
          {t(item.titleKey, { count: item.count })}
        </Text>
      );
    }
    return (
      <RecipeSelectionCard
        testId={`${screenId}::${item.key}`}
        recipe={item.recipe}
        isSelected={isSelected(item.recipe.url)}
        onSelected={() => selectRecipe(item.recipe.url)}
        onUnselected={() => unselectRecipe(item.recipe.url)}
      />
    );
  };

  const handleContinue = async () => {
    await markUrlsAsSeen();
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
            recipesCount={totalRecipesCount}
            selectedCount={selectedCount}
            isDiscovering={isDiscovering}
            discoveryProgress={discoveryProgress}
            testID={screenId}
          />

          {totalRecipesCount > 0 && (
            <SelectAllRow
              allSelected={allSelected}
              selectedCount={selectedCount}
              onToggle={toggleSelectAll}
              testID={screenId}
            />
          )}

          {totalRecipesCount > 0 ? (
            <FlashList
              data={listData}
              keyExtractor={item => item.key}
              extraData={selectedCount}
              estimatedItemSize={RECIPE_CARD_HEIGHT}
              getItemType={item => item.type}
              overrideItemLayout={(layout, item) => {
                layout.size = item.type === 'header' ? SECTION_HEADER_HEIGHT : RECIPE_CARD_HEIGHT;
              }}
              renderItem={renderListItem}
            />
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
  sectionHeader: {
    paddingHorizontal: padding.large,
    paddingVertical: padding.small,
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
