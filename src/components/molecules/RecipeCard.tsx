/**
 * RecipeCard - Interactive card component for displaying recipe information
 *
 * A responsive card component that displays recipe information in a visually appealing format.
 * Features recipe image, title, tags, preparation time, and serving count. Supports two sizes
 * with different levels of detail and automatically navigates to the recipe screen when pressed.
 *
 * Key Features:
 * - Two size variants: 'small' (compact) and 'medium' (detailed)
 * - Responsive width based on screen size
 * - Recipe image with fallback background color
 * - Navigation integration for seamless UX
 * - Theme-aware styling and colors
 * - Tag display and recipe metadata
 *
 * @example
 * ```typescript
 * // Small card for lists/grids
 * <RecipeCard
 *   testId="recipe-card-1"
 *   size="small"
 *   recipe={recipeData}
 * />
 *
 * // Medium card with full details
 * <RecipeCard
 *   testId="featured-recipe"
 *   size="medium"
 *   recipe={featuredRecipe}
 * />
 * ```
 */

import React from 'react';
import { Card, Text, useTheme } from 'react-native-paper';
import { padding, screenWidth } from '@styles/spacing';
import { View } from 'react-native';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '@utils/i18n';

/**
 * Props for the RecipeCard component
 */
export type RecipeCardProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Size variant affecting layout and information density */
  size: 'small' | 'medium';
  /** Recipe data to display in the card */
  recipe: recipeTableElement;
};

/**
 * RecipeCard component
 *
 * @param props - The component props
 * @returns JSX element representing an interactive recipe card
 */
export function RecipeCard({ testId, size, recipe }: RecipeCardProps) {
  const { navigate } = useNavigation<StackScreenNavigation>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const cardWidth = screenWidth * (size === 'small' ? 0.35 : 0.45);
  const radius = cardWidth / 12;

  return (
    <Card
      accessible={false}
      testID={testId + `::${recipe.title}`}
      mode={'outlined'}
      style={{
        flex: 1,
        margin: padding.small,
        width: cardWidth,
        justifyContent: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: radius,
      }}
      onPress={() => {
        navigate('Recipe', { mode: 'readOnly', recipe: recipe });
      }}
    >
      <Card.Cover
        testID={testId + '::Cover'}
        source={{ uri: recipe.image_Source }}
        style={{
          height: cardWidth,
          backgroundColor: colors.tertiary,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
        }}
      />
      <Card.Title
        testID={testId + '::Title'}
        title={recipe.title}
        titleNumberOfLines={2}
        titleVariant={size === 'small' ? 'labelLarge' : 'titleMedium'}
      />
      {size === 'medium' && (
        <View>
          <Card.Content style={{ padding: padding.medium }}>
            <Text
              style={{ color: colors.primary }}
              numberOfLines={1}
              testID={testId + '::Content'}
              accessible={true}
            >
              {recipe.tags.map(tag => tag.name).join(', ')}
            </Text>
          </Card.Content>
          <Card.Actions>
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text
                testID={testId + '::PrepTime'}
                variant={'bodySmall'}
                style={{ marginLeft: -padding.verySmall }}
                accessible={true}
              >
                {t('recipeCard.prepTime', { time: recipe.time })}
              </Text>
              <Text
                testID={testId + '::Persons'}
                variant={'bodySmall'}
                style={{ marginRight: -padding.verySmall }}
                accessible={true}
              >
                {t('recipeCard.persons', { count: recipe.persons })}
              </Text>
            </View>
          </Card.Actions>
        </View>
      )}
    </Card>
  );
}

export default RecipeCard;
