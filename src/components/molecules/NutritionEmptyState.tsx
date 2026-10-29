import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { recipeTextStyles } from '@styles/recipeComponents';
import { Icons } from '@assets/Icons';
import { RoundButton } from '@components/atomic/RoundButton';
import { ScanButton } from '@components/molecules/ScanButton';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';

export type NutritionEmptyStateProps = {
  /** Called by the "add manually" button, shown when `withScan` is not set */
  onButtonPressed: () => void;
  /** Renders the OCR scan button instead of the "add manually" button */
  withScan?: boolean;
  parentTestId?: string;
};

export function NutritionEmptyState({
  onButtonPressed,
  withScan,
  parentTestId,
}: NutritionEmptyStateProps) {
  const { t } = useI18n();

  const testId = parentTestId + '::NutritionEmptyState';

  return (
    <View style={recipeTextStyles.containerSection}>
      <Text
        variant={'headlineSmall'}
        style={recipeTextStyles.containerElement}
        testID={testId + '::Title'}
      >
        {t('recipe.nutrition.titleSimple')}
      </Text>
      {withScan ? (
        <ScanButton
          testID={testId + '::OCRButton'}
          field={recipeColumnsNames.nutrition}
          style={recipeTextStyles.button}
        />
      ) : (
        <RoundButton
          testID={testId + '::AddButton'}
          icon={Icons.plusIcon}
          onPressFunction={onButtonPressed}
          label={t('recipe.roundButton.addManually')}
          style={recipeTextStyles.button}
        />
      )}
    </View>
  );
}
