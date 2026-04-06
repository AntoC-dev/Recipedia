import React from 'react';
import { Button, Text, View } from 'react-native';
import { SkippedRecipesListProps } from '@components/molecules/SkippedRecipesList';

export function SkippedRecipesListMock({
  skippedRecipes,
  testID,
  ListHeaderComponent,
  scrollEnabled,
}: SkippedRecipesListProps) {
  return (
    <View testID={testID}>
      {ListHeaderComponent}
      <Text testID={`${testID}::scrollEnabled`}>{String(!!scrollEnabled)}</Text>
      {skippedRecipes.map((recipe, index) => (
        <View key={recipe.sourceUrl} testID={`${testID}::Item::${index}`}>
          <Text testID={`${testID}::Item::${index}::Title`}>{recipe.title}</Text>
          <Text testID={`${testID}::Item::${index}::SourceUrl`}>{recipe.sourceUrl}</Text>
        </View>
      ))}
    </View>
  );
}
