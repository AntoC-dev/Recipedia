/**
 * RecipeRecommendation - Titled carousel section for recipe suggestions
 *
 * A simple but effective recommendation component that displays a titled section
 * with a horizontal carousel of recipe cards. Perfect for showcasing featured recipes,
 * recommendations, or categorized recipe collections.
 *
 * Key Features:
 * - Clean sectioned layout with Material Design styling
 * - Customizable section title
 * - Integrated carousel for horizontal recipe browsing
 * - Theme-aware typography
 * - Seamless integration with recipe navigation
 *
 * @example
 * ```typescript
 * // Featured recipes section
 * <RecipeRecommendation
 *   testId="featured-recipes"
 *   titleRecommendation="Featured Recipes"
 *   carouselProps={featuredRecipes}
 * />
 *
 * // Category-based recommendations
 * <RecipeRecommendation
 *   testId="breakfast-recommendations"
 *   titleRecommendation="Perfect for Breakfast"
 *   carouselProps={breakfastRecipes}
 * />
 *
 * // Seasonal suggestions
 * <RecipeRecommendation
 *   testId="seasonal-picks"
 *   titleRecommendation="Summer Favorites"
 *   carouselProps={summerRecipes}
 * />
 * ```
 */

import React from 'react';
import { List, useTheme } from 'react-native-paper';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { Carousel } from '@components/molecules/Carousel';

/**
 * Props for the RecipeRecommendation component
 */
export type RecipeRecommendationProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Title text for the recommendation section */
  titleRecommendation: string;
  /** Array of recipe data to display in the carousel */
  carouselProps: recipeTableElement[];
};

/**
 * RecipeRecommendation component for titled recipe carousels
 *
 * @param props - The component props
 * @returns JSX element representing a titled section with recipe carousel
 */
export function RecipeRecommendation(props: RecipeRecommendationProps) {
  const { fonts } = useTheme();
  return (
    <List.Section>
      <List.Subheader testID={props.testId + '::SubHeader'} style={fonts.titleLarge}>
        {props.titleRecommendation}
      </List.Subheader>
      <Carousel testID={props.testId + '::Carousel'} items={props.carouselProps} />
    </List.Section>
  );
}
