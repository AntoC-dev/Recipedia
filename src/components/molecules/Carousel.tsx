/**
 * Carousel - Horizontal scrolling recipe card carousel
 *
 * A horizontal scrolling component that displays multiple recipe cards in a row.
 * Built on React Native's FlatList with optimized performance for smooth scrolling.
 * Perfect for showcasing featured recipes, search results, or category-based recipe lists.
 *
 * Key Features:
 * - Horizontal scrolling with hidden scroll indicators
 * - Automatic key generation for optimal performance
 * - Responsive padding and spacing
 * - Integration with RecipeCard components
 * - Optimized for various screen sizes
 *
 * @example
 * ```typescript
 * // Featured recipes carousel
 * <Carousel
 *   items={featuredRecipes}
 *   testID="featured-carousel"
 * />
 *
 * // Search results carousel
 * <Carousel
 *   items={searchResults}
 *   testID="search-results"
 * />
 *
 * // Category-specific recipes
 * <Carousel
 *   items={dessertRecipes}
 *   testID="desserts-carousel"
 * />
 * ```
 */

import React from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { padding } from '@styles/spacing';
import { RecipeCard } from '@components/molecules/RecipeCard';

/**
 * Props for the Carousel component
 */
export type CarouselItemProps = {
  /** Array of recipe data to display as cards */
  items: recipeTableElement[];
  /** Unique identifier for testing and accessibility */
  testID: string;
};

/**
 * Carousel component for horizontal recipe browsing
 *
 * @param props - The component props
 * @returns JSX element representing a horizontal scrolling recipe carousel
 */
export function Carousel(props: CarouselItemProps) {
  return (
    <View>
      <FlatList
        data={props.items}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, idx) => item.id?.toString() ?? item.title + idx}
        contentContainerStyle={{ paddingHorizontal: padding.small }}
        renderItem={({ item, index }: ListRenderItemInfo<recipeTableElement>) => (
          <RecipeCard testId={props.testID + `::Card::${index}`} size={'small'} recipe={item} />
        )}
      />
    </View>
  );
}

export default Carousel;
