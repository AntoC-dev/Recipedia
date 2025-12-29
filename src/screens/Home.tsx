/**
 * Home - Main dashboard screen with recipe recommendations and FAB menu
 *
 * The primary landing screen of the Recipedia app featuring multiple recommendation
 * carousels with random recipes and an expandable FAB menu for recipe creation.
 * Includes pull-to-refresh functionality and automatic cleanup of deleted recipes.
 *
 * Key Features:
 * - Four dynamic recommendation carousels with random recipes
 * - Pull-to-refresh functionality for fresh recommendations
 * - Automatic cleanup of deleted/missing recipes on focus
 * - Expandable FAB menu for recipe creation (camera, gallery, manual)
 * - Responsive layout with proper bottom padding
 * - Theme-aware styling and colors
 * - Comprehensive logging for debugging and analytics
 * - Real-time recipe existence validation
 *
 * Navigation Integration:
 * - Serves as the main entry point from bottom tab navigation
 * - Integrates with recipe creation flows via VerticalBottomButtons
 * - Handles navigation to individual recipe screens via RecipeCard interactions
 *
 * Performance Optimizations:
 * - Efficient random recipe loading with controlled batch sizes
 * - Focus-based cleanup prevents stale data display
 * - Smooth scroll performance with proper view sizing
 *
 * @example
 * ```typescript
 * // Navigation integration (typically in tab navigator)
 * <Tab.Screen
 *   name="Home"
 *   component={Home}
 *   options={{
 *     tabBarIcon: ({ color }) => <Icon name="home" color={color} />
 *   }}
 * />
 *
 * // The Home screen automatically handles:
 * // - Loading random recipe recommendations
 * // - Providing recipe creation entry points
 * // - Managing recipe data freshness
 * // - Responsive layout for different screen sizes
 * ```
 */

import { RecipeRecommendation } from '@components/organisms/RecipeRecommendation';

import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import { generateHomeRecommendations } from '@utils/FilterFunctions';
import { RecommendationType } from '@customTypes/RecipeFiltersTypes';
import VerticalBottomButtons from '@components/organisms/VerticalBottomButtons';
import { useI18n } from '@utils/i18n';
import { padding, screenWidth } from '@styles/spacing';
import { homeLogger } from '@utils/logger';
import { useSeasonFilter } from '@context/SeasonFilterContext';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { AdBanner } from '@components/organisms/AdBanner';

const homeId = 'Home';
const recommandationId = homeId + '::RecipeRecommendation';

export const howManyItemInCarousel = 20;

/**
 * Home screen component - Main dashboard with recipe recommendations
 *
 * @param props - Navigation props for the Home screen
 * @returns JSX element representing the main home dashboard
 */
/**
 * Home screen component - Main dashboard with recipe recommendations
 */

export function Home() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { seasonFilter } = useSeasonFilter();
  const { recipes, ingredients, tags } = useRecipeDatabase();

  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<RecommendationType[]>([]);

  useEffect(() => {
    homeLogger.debug('Loading smart recipe recommendations', {
      carouselSize: howManyItemInCarousel,
      seasonFilterEnabled: seasonFilter,
    });

    setRecommendations(
      generateHomeRecommendations(recipes, ingredients, tags, seasonFilter, howManyItemInCarousel)
    );
    homeLogger.debug('Smart recipe recommendations loaded successfully');
  }, [recipes, ingredients, tags, seasonFilter]);

  const onRefresh = () => {
    homeLogger.info('User refreshing home screen recommendations');
    setRefreshing(true);
    setRecommendations(
      generateHomeRecommendations(recipes, ingredients, tags, seasonFilter, howManyItemInCarousel)
    );
    setRefreshing(false);
  };

  const renderEmptyState = () => {
    const emptyStateTestId = homeId + '::EmptyState';
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: padding.medium,
        }}
      >
        <Text
          testID={emptyStateTestId + '::Title'}
          variant='headlineSmall'
          style={{ textAlign: 'center', marginBottom: padding.veryLarge }}
        >
          {t('emptyState.noRecommendations.title')}
        </Text>
        <Text
          testID={emptyStateTestId + '::Description'}
          variant='bodyMedium'
          style={{ textAlign: 'center', color: colors.onSurfaceVariant }}
        >
          {t('emptyState.noRecommendations.description')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={recommendations}
        renderItem={({ item }) => (
          <RecipeRecommendation
            testId={`${recommandationId}::${item.id}`}
            carouselProps={item.recipes}
            titleRecommendation={t(item.titleKey, item.titleParams)}
          />
        )}
        keyExtractor={item => item.id}
        ListHeaderComponent={<AdBanner placement='home' testId={homeId} />}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl colors={[colors.primary]} refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: screenWidth / 6, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
      <VerticalBottomButtons />
    </SafeAreaView>
  );
}

export default Home;
