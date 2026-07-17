import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { recipeTextStyles } from '@styles/recipeComponents';
import { Icons } from '@assets/Icons';
import { RoundButton } from '@components/atomic/RoundButton';

export type NutritionEmptyStateProps = {
  onButtonPressed: () => void;
  mode: 'add' | 'ocr';
  parentTestId?: string;
};

export function NutritionEmptyState({
  onButtonPressed,
  mode,
  parentTestId,
}: NutritionEmptyStateProps) {
  const { t } = useI18n();

  const testId = parentTestId + '::NutritionEmptyState';
  const isOCRMode = mode === 'ocr';

  return (
    <View style={recipeTextStyles.containerSection}>
      <Text
        variant={'headlineSmall'}
        style={recipeTextStyles.containerElement}
        testID={testId + '::Title'}
      >
        {t('recipe.nutrition.titleSimple')}
      </Text>
      <RoundButton
        testID={testId + (isOCRMode ? '::OCRButton' : '::AddButton')}
        size={'medium'}
        icon={isOCRMode ? Icons.scanImageIcon : Icons.plusIcon}
        onPressFunction={onButtonPressed}
        style={recipeTextStyles.button}
      />
    </View>
  );
}
