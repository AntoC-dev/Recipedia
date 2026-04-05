import React from 'react';
import { Button, Text, View } from 'react-native';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { ValidationReviewListProps } from '@components/organisms/ValidationReviewList';
import { normalizeKey } from '@utils/NutritionUtils';

export function validationReviewListMock({
  testID,
  rawTags,
  rawIngredients,
  onImport,
  recipeCount,
}: ValidationReviewListProps) {
  const testId = testID + '::ValidationReviewList';
  return (
    <View testID={testId}>
      <Text testID={`${testId}::RecipeCount`}>{String(recipeCount)}</Text>
      <Text testID={`${testId}::TagCount`}>{String(rawTags.length)}</Text>
      <Text testID={`${testId}::IngredientCount`}>{String(rawIngredients.length)}</Text>
      <Button
        testID={`${testId}::onImport`}
        onPress={() => {
          const tagMappings = new Map(rawTags.map(t => [normalizeKey(t.name), t]));
          const ingredientMappings = new Map(
            rawIngredients
              .filter(i => !!i.name)
              .map(i => [
                normalizeKey(i.name!),
                {
                  id: 0,
                  name: i.name!,
                  unit: i.unit || 'g',
                  type: ingredientType.vegetable,
                  season: [],
                  quantity: i.quantity,
                },
              ])
          );
          onImport({ tagMappings, ingredientMappings });
        }}
        title='Import'
      />
    </View>
  );
}
