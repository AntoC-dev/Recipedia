import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { recipeButtonStyles, recipeTextStyles } from '@styles/recipeComponents';
import { Icons } from '@assets/Icons';
import { RoundButton } from '@components/atomic/RoundButton';
import { ScanButton } from '@components/molecules/ScanButton';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';

export type NutritionEmptyStateProps = {
  /** Called by the "add manually" button */
  onButtonPressed: () => void;
  /** Renders the OCR scan button beside the "add manually" button */
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
      <View style={recipeButtonStyles.roundButtonsContainer}>
        {withScan ? (
          <ScanButton
            testID={testId + '::OCRButton'}
            field={recipeColumnsNames.nutrition}
            style={recipeButtonStyles.roundButton}
          />
        ) : null}
        <RoundButton
          testID={testId + '::AddButton'}
          icon={withScan ? Icons.pencilIcon : Icons.plusIcon}
          onPressFunction={onButtonPressed}
          label={t('recipe.roundButton.addManually')}
          style={recipeButtonStyles.roundButton}
        />
      </View>
    </View>
  );
}
