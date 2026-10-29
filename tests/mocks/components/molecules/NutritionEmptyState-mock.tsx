import React from 'react';
import { Button, Text, View } from 'react-native';
import { NutritionEmptyStateProps } from '@components/molecules/NutritionEmptyState';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { MockScanButton } from '@mocks/components/organisms/_recipeFieldMockHelpers';

export function NutritionEmptyState({
  onButtonPressed,
  withScan,
  parentTestId = 'NutritionEmptyState',
}: NutritionEmptyStateProps) {
  const testId = parentTestId + '::NutritionEmptyState';

  return (
    <View testID={testId}>
      <Text testID={testId + '::ParentTestId'}>{parentTestId}</Text>
      {withScan ? (
        <MockScanButton testID={testId + '::OnOCRNutrition'} field={recipeColumnsNames.nutrition} />
      ) : (
        <Button
          testID={testId + '::OnAddNutrition'}
          onPress={onButtonPressed}
          title='Mock Add Nutrition'
        />
      )}
    </View>
  );
}

export default NutritionEmptyState;
