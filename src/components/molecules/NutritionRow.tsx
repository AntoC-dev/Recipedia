import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { padding } from '@styles/spacing';
import { NumericTextInput } from '@components/atomic/NumericTextInput';

export type NutritionRowProps = {
  label: string;
  value: number;
  unit: string;
  isSubItem?: boolean;
  isEditable?: boolean;
  field?: keyof nutritionTableElement;
  onValueChange?: (field: keyof nutritionTableElement, value: number) => void;
  testId: string;
};

export function NutritionRow({
  label,
  value,
  unit,
  isSubItem = false,
  isEditable = false,
  field,
  onValueChange,
  testId,
}: NutritionRowProps) {
  const handleValueChange = (numValue: number) => {
    if (field && onValueChange) {
      onValueChange(field, numValue);
    }
  };

  const displayValue = value % 1 === 0 ? value.toString() : parseFloat(value.toFixed(2)).toString();

  return (
    <View>
      <View style={styles.container}>
        <Text
          variant='bodyMedium'
          style={[{ width: '50%' }, isSubItem && styles.subLabel]}
          testID={testId + '::Text'}
        >
          {isSubItem ? `${label}` : label}
        </Text>

        {isEditable && field ? (
          <NumericTextInput
            testID={testId + '::NumericTextInput'}
            value={value}
            onChangeValue={handleValueChange}
            keyboardType='numeric'
            dense
            mode='outlined'
            style={{ width: '50%' }}
            right={<TextInput.Affix text={unit} />}
          />
        ) : (
          <Text variant='bodyMedium' testID={testId + '::Value'}>
            {displayValue} {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingVertical: padding.small,
  },
  subLabel: {
    fontStyle: 'italic',
    paddingLeft: padding.medium,
    opacity: 0.8,
  },
});
