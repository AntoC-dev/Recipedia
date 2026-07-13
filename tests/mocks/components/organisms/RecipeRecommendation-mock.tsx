import React from 'react';
import { Text, View } from 'react-native';
import { RecipeRecommendationProps } from '@components/organisms/RecipeRecommendation';

export function recipeRecommendationMock(recipeRecommendationProp: RecipeRecommendationProps) {
  return (
    <View>
      <Text testID={recipeRecommendationProp.titleRecommendation + '::Title::TitleRecommendation'}>
        {recipeRecommendationProp.titleRecommendation}
      </Text>
      <Text testID={recipeRecommendationProp.titleRecommendation + '::CarouselProps'}>
        {JSON.stringify(recipeRecommendationProp.carouselProps)}
      </Text>
    </View>
  );
}
