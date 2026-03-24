/**
 * SeasonalityCalendar - Interactive month selection component for ingredient seasonality
 *
 * A versatile calendar component that allows users to select and display which months
 * an ingredient is available or in season. Features both interactive selection mode
 * (using SelectableAccordion) and read-only display mode with intelligent layout.
 *
 * @example
 * ```typescript
 * // Interactive mode for editing ingredient seasonality
 * <SeasonalityCalendar
 *   testID="tomato-seasonality"
 *   selectedMonths={['6', '7', '8', '9']}
 *   onMonthsChange={(months) => updateIngredientSeasonality(months)}
 * />
 *
 * // Read-only mode for displaying existing data
 * <SeasonalityCalendar
 *   testID="apple-seasonality"
 *   selectedMonths={['9', '10', '11']}
 *   readOnly={true}
 * />
 *
 * // All-year ingredient (displays compact format)
 * <SeasonalityCalendar
 *   testID="rice-seasonality"
 *   selectedMonths={['1','2','3','4','5','6','7','8','9','10','11','12']}
 *   readOnly={true}
 * />
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { SelectableAccordion, SelectableItem } from '@components/molecules/SelectableAccordion';

/**
 * Props for the SeasonalityCalendar component
 */
export type SeasonalityCalendarProps = {
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Array of month numbers ('1' to '12') that are selected */
  selectedMonths: string[];
  /** Callback fired when month selection changes (omit for read-only mode) */
  onMonthsChange?: (months: string[]) => void;
  /** Whether the calendar should be read-only (default: false) */
  readOnly?: boolean;
};

const MONTH_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;

type MonthInfo = {
  num: string;
  name: string;
};

/**
 * SeasonalityCalendar component for ingredient month selection
 *
 * In interactive mode, delegates to SelectableAccordion with multi-select chips.
 * In read-only mode, renders a compact inline display with selected months or
 * an "all year" label.
 *
 * @param props - The component props
 * @returns JSX element representing an interactive or read-only month selection calendar
 */
export function SeasonalityCalendar({
  testID,
  selectedMonths,
  onMonthsChange,
  readOnly = false,
}: SeasonalityCalendarProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const calendarTestId = testID + '::SeasonalityCalendar';

  if (!readOnly) {
    const monthItems: SelectableItem[] = MONTH_VALUES.map(v => ({
      value: v,
      label: t(`month_${v}`),
    }));

    const handleMonthPress = (month: string) => {
      const newMonths = selectedMonths.includes(month)
        ? selectedMonths.filter(m => m !== month)
        : [...selectedMonths, month];
      onMonthsChange?.(newMonths);
    };

    const allSelected = selectedMonths.length === MONTH_VALUES.length;

    return (
      <SelectableAccordion
        testID={calendarTestId}
        title={t('seasonality')}
        items={monthItems}
        selectedValues={selectedMonths}
        onPress={handleMonthPress}
        multiSelect
        numColumns={2}
        allSelectedLabel={t('all_year')}
        onToggleAll={
          onMonthsChange ? () => onMonthsChange(allSelected ? [] : [...MONTH_VALUES]) : undefined
        }
      />
    );
  }

  const allMonths: MonthInfo[] = MONTH_VALUES.map(v => ({ num: v, name: t(`month_${v}`) }));
  const allYearReadOnly: boolean = selectedMonths.length === MONTH_VALUES.length;
  const monthToDisplay: MonthInfo[] = allMonths.filter(month => selectedMonths.includes(month.num));

  return (
    <View style={[styles.readOnlyContainer, allYearReadOnly && styles.readOnlyRow]}>
      <Text testID={calendarTestId + '::SeasonalityText'} style={styles.readOnlyTitle}>
        {t('seasonality')}:
      </Text>
      {allYearReadOnly ? (
        <Text testID={calendarTestId + '::AllYear'}>{t('all_year')}</Text>
      ) : (
        <View style={styles.readOnlyChipContainer}>
          {monthToDisplay.map(month => (
            <Chip
              key={month.num}
              testID={calendarTestId + `::${month.num}`}
              style={styles.readOnlyChip}
              selected={true}
              showSelectedCheck={false}
              mode='outlined'
              selectedColor={colors.primary}
            >
              {month.name}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readOnlyContainer: {
    marginVertical: padding.small,
  },
  readOnlyRow: {
    flexDirection: 'row',
  },
  readOnlyTitle: {
    fontWeight: 'bold',
    marginRight: padding.small,
  },
  readOnlyChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: padding.small,
  },
  readOnlyChip: {
    margin: padding.verySmall,
  },
});
