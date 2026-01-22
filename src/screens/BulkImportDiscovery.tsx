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
 * - Visibility-based lazy loading of recipe images (only loads images for visible items)
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

import React, { useState } from 'react';
import { StyleSheet, View, ViewabilityConfig, ViewToken } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackScreenNavigation, StackScreenParamList } from '@customTypes/ScreenTypes';
import { DiscoveryListItem } from '@customTypes/BulkImportTypes';
import { buildDiscoveryListData } from '@utils/BulkImportUtils';
import { AppBar } from '@components/organisms/AppBar';
import { RecipeSelectionCard } from '@components/molecules/RecipeSelectionCard';
import { DiscoveryFooter } from '@components/molecules/DiscoveryFooter';
import { DiscoveryHeader } from '@components/molecules/DiscoveryHeader';
import { RecipeParsingProgress } from '@components/molecules/RecipeParsingProgress';
import { RecipeCardSkeleton } from '@components/molecules/RecipeCardSkeleton';
import { SelectAllRow } from '@components/molecules/SelectAllRow';
import { useI18n } from '@utils/i18n';
import { getProvider } from '@providers/ProviderRegistry';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import { useDiscoveryWorkflow } from '@hooks/useDiscoveryWorkflow';
import { useVisibleImageLoader } from '@hooks/useVisibleImageLoader';
import { padding } from '@styles/spacing';

type BulkImportDiscoveryRouteProp = RouteProp<StackScreenParamList, 'BulkImportDiscovery'>;

const screenId = 'BulkImportDiscovery';
const FLASH_LIST_DRAW_DISTANCE = 200;

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: 10,
  waitForInteraction: false,
  minimumViewTime: 100,
};

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

  const [visibleUrls, setVisibleUrls] = useState<Set<string>>(new Set());

  const {
    phase,
    recipes,
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

  const { imageMap } = useVisibleImageLoader({
    recipes,
    visibleUrls,
    fetchImageUrl: (url, signal) =>
      provider?.fetchImageUrlForRecipe(url, signal) ?? Promise.resolve(null),
  });

  const freshRecipesWithImages = freshRecipes.map(r => ({
    ...r,
    imageUrl: imageMap.get(r.url) ?? r.imageUrl,
  }));
  const seenRecipesWithImages = seenRecipes.map(r => ({
    ...r,
    imageUrl: imageMap.get(r.url) ?? r.imageUrl,
  }));

  const totalRecipesCount = freshRecipesWithImages.length + seenRecipesWithImages.length;
  const listData = buildDiscoveryListData(freshRecipesWithImages, seenRecipesWithImages);

  /**
   * Handles FlashList viewability changes to track visible recipe URLs.
   * Updates the visibleUrls state for visibility-based image loading.
   *
   * @param viewableItems - Array of currently visible list items from FlashList
   */
  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const urls = viewableItems
      .filter(item => item.item?.type === 'recipe')
      .map(item => item.item.recipe.url);
    setVisibleUrls(new Set(urls));
  };

  /**
   * Handles cancel action by aborting any in-progress operations
   * and navigating back to the previous screen.
   */
  const handleCancel = () => {
    abort();
    navigation.goBack();
  };

  /**
   * Renders a list item based on its type (header or recipe card).
   *
   * @param item - The discovery list item to render
   * @returns JSX element for either a section header or recipe selection card
   */
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

  /**
   * Handles the continue action after recipe selection.
   * Aborts discovery if still running, marks discovered URLs as seen,
   * parses selected recipes, and navigates to the validation screen if successful.
   */
  const handleContinue = async () => {
    if (isDiscovering) {
      abort();
    }
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
              getItemType={item => item.type}
              renderItem={renderListItem}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              drawDistance={FLASH_LIST_DRAW_DISTANCE}
            />
          ) : phase === 'selecting' ? (
            <View style={styles.emptyState}>
              <Text variant='bodyLarge' style={styles.emptyText}>
                {t('bulkImport.selection.noRecipesFound')}
              </Text>
            </View>
          ) : (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3, 4, 5].map(i => (
                <RecipeCardSkeleton key={i} testID={`${screenId}::Skeleton::${i}`} />
              ))}
            </View>
          )}

          <DiscoveryFooter
            error={error}
            selectedCount={selectedCount}
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
  skeletonContainer: {
    flex: 1,
    paddingTop: padding.medium,
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
