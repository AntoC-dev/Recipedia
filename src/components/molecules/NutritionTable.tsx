import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, Divider, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { useI18n } from '@utils/i18n';
import { calculateNutritionPerPortion } from '@utils/Quantity';
import { NutritionRow } from './NutritionRow';
import { NutritionEditForm } from './NutritionEditForm';
import { Alert } from '@components/dialogs/Alert';
import { padding } from '@styles/spacing';
import { recipeTextStyles } from '@styles/recipeComponents';

export type NutritionTableProps = {
  nutrition: nutritionTableElement;
  isEditable?: boolean;
  onNutritionChange?: (updates: Partial<nutritionTableElement>) => void;
  onRemoveNutrition?: () => void;
  showRemoveButton?: boolean;
  parentTestId: string;
};

export function NutritionTable({
  nutrition,
  isEditable = false,
  onNutritionChange,
  onRemoveNutrition,
  showRemoveButton = false,
  parentTestId,
}: NutritionTableProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const testId = parentTestId + '::NutritionTable';
  const nutritionRowTestId = testId + '::NutritionRow';
  const translationPrefix = 'recipe.nutrition.';

  const [viewMode, setViewMode] = useState<'per100g' | 'perPortion'>('per100g');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const portionNutrition = calculateNutritionPerPortion(nutrition);
  const displayNutrition = viewMode === 'perPortion' ? portionNutrition : nutrition;

  const handleValueChange = (field: keyof nutritionTableElement, value: number) => {
    onNutritionChange?.({ [field]: value });
  };

  const handlePortionWeightChange = (weight: number) => {
    onNutritionChange?.({ portionWeight: weight });
  };

  const handleRemoveNutrition = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onRemoveNutrition?.();
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  return (
    <View style={recipeTextStyles.containerSection}>
      <Card
        accessible={false}
        mode={'elevated'}
        style={{ borderWidth: 0.5, borderColor: colors.outline }}
        testID={testId}
      >
        <Card.Content>
          <Text
            variant='headlineSmall'
            style={{
              textAlign: 'center',
            }}
            testID={testId + '::Title'}
          >
            {t(translationPrefix + 'title')}
          </Text>

          {isEditable ? (
            <Text
              variant='bodyMedium'
              style={{
                textAlign: 'center',
                paddingBottom: padding.medium,
                opacity: 0.7,
                fontStyle: 'italic',
              }}
              testID={testId + '::Subtitle'}
            >
              {t(translationPrefix + 'per100g')}
            </Text>
          ) : (
            <SegmentedButtons
              value={viewMode}
              onValueChange={value => setViewMode(value as 'per100g' | 'perPortion')}
              buttons={[
                {
                  value: 'per100g' as const,
                  label: t(translationPrefix + 'per100g'),
                },
                {
                  value: 'perPortion' as const,
                  label: t(translationPrefix + 'perPortionTab'),
                },
              ]}
              style={recipeTextStyles.button}
            />
          )}

          <View>
            <NutritionRow
              label={t(translationPrefix + 'energyKcal')}
              value={displayNutrition.energyKcal}
              unit='kcal'
              isEditable={isEditable}
              field='energyKcal'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::EnergyKcal'}
            />
            <NutritionRow
              label={t(translationPrefix + 'energyKj')}
              value={displayNutrition.energyKj}
              unit='kJ'
              isEditable={isEditable}
              field='energyKj'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::EnergyKj'}
            />

            <Divider />

            <NutritionRow
              label={t(translationPrefix + 'fat')}
              value={displayNutrition.fat}
              unit='g'
              isEditable={isEditable}
              field='fat'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::Fat'}
            />
            <NutritionRow
              label={t(translationPrefix + 'saturatedFat')}
              value={displayNutrition.saturatedFat}
              unit='g'
              isSubItem
              isEditable={isEditable}
              field='saturatedFat'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::SaturatedFat'}
            />

            <Divider />

            <NutritionRow
              label={t(translationPrefix + 'carbohydrates')}
              value={displayNutrition.carbohydrates}
              unit='g'
              isEditable={isEditable}
              field='carbohydrates'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::Carbohydrates'}
            />
            <NutritionRow
              label={t(translationPrefix + 'sugars')}
              value={displayNutrition.sugars}
              unit='g'
              isSubItem
              isEditable={isEditable}
              field='sugars'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::Sugars'}
            />

            <Divider />

            <NutritionRow
              label={t(translationPrefix + 'fiber')}
              value={displayNutrition.fiber}
              unit='g'
              isEditable={isEditable}
              field='fiber'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::Fiber'}
            />

            <Divider />

            <NutritionRow
              label={t(translationPrefix + 'protein')}
              value={displayNutrition.protein}
              unit='g'
              isEditable={isEditable}
              field='protein'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::Protein'}
            />

            <Divider />

            <NutritionRow
              label={t(translationPrefix + 'salt')}
              value={displayNutrition.salt}
              unit='g'
              isEditable={isEditable}
              field='salt'
              onValueChange={handleValueChange}
              testId={nutritionRowTestId + '::Salt'}
            />
          </View>

          {isEditable && (
            <NutritionEditForm
              portionWeight={nutrition.portionWeight}
              onPortionWeightChange={handlePortionWeightChange}
              onRemoveNutrition={handleRemoveNutrition}
              showRemoveButton={showRemoveButton}
              testId={testId + '::EditForm'}
            />
          )}
        </Card.Content>
      </Card>
      <Alert
        isVisible={showDeleteDialog}
        title={t(translationPrefix + 'removeNutrition')}
        content={t(translationPrefix + 'confirmDelete')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
        testId={parentTestId + '::DeleteAlert'}
      />
    </View>
  );
}

export default NutritionTable;
