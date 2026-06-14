import React from 'react';
import { Button, Text, View } from 'react-native';
import { NutritionTableProps } from '@components/molecules/NutritionTable';

export function NutritionTable({
  nutrition,
  isEditable = false,
  onNutritionChange,
  onRemoveNutrition,
  showRemoveButton = false,
  parentTestId,
}: NutritionTableProps) {
  const testId = parentTestId + '::NutritionTable';

  return (
    <View testID={testId}>
      <Text testID={testId + '::Nutrition'}>{JSON.stringify(nutrition)}</Text>
      <Text testID={testId + '::IsEditable'}>{isEditable}</Text>
      <Text testID={testId + '::ShowRemoveButton'}>{showRemoveButton}</Text>
      {onNutritionChange && (
        <Button
          testID={testId + '::OnNutritionChange'}
          onPress={() => onNutritionChange({ energyKcal: 300 })}
          title='Mock Change Nutrition'
        />
      )}
      {onNutritionChange && (
        <Button
          testID={testId + '::OnNutritionReapply'}
          onPress={() => onNutritionChange(nutrition ?? ({} as never))}
          title='Mock Reapply Nutrition'
        />
      )}
      {onRemoveNutrition && (
        <Button
          testID={testId + '::OnRemoveNutrition'}
          onPress={onRemoveNutrition}
          title='Mock Remove Nutrition'
        />
      )}
    </View>
  );
}

export default NutritionTable;
