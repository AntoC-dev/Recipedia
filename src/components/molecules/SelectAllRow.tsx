/**
 * SelectAllRow - Checkbox row for selecting/deselecting all recipes
 *
 * Displays a checkbox with select all label that toggles between
 * checked, unchecked, and indeterminate states based on selection.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';

export type SelectAllRowProps = {
  allSelected: boolean;
  selectedCount: number;
  onToggle: () => void;
  testID: string;
};

export function SelectAllRow({ allSelected, selectedCount, onToggle, testID }: SelectAllRowProps) {
  const { t } = useI18n();

  const status = allSelected ? 'checked' : selectedCount > 0 ? 'indeterminate' : 'unchecked';

  return (
    <View style={styles.selectAllRow}>
      <Checkbox status={status} onPress={onToggle} testID={testID + '::SelectAllCheckbox'} />
      <Text variant='bodyMedium' style={styles.selectAllText} onPress={onToggle}>
        {t('bulkImport.selection.selectAllExplanation')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: padding.small,
    paddingVertical: padding.small,
  },
  selectAllText: {
    flex: 1,
  },
});

export default SelectAllRow;
