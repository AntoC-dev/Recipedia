import { Button, Text, View } from 'react-native';
import React from 'react';
import { SeasonalityCalendarProps } from '@components/molecules/SeasonalityCalendar';

export function seasonalityCalendarMock({
  testID,
  selectedMonths,
  onMonthsChange,
  readOnly,
}: SeasonalityCalendarProps) {
  const testId = testID + '::SeasonalityCalendar';
  return (
    <View>
      <Text testID={testId + '::SelectedMonths'}>{JSON.stringify(selectedMonths)}</Text>
      <Text testID={testId + '::ReadOnly'}>{readOnly}</Text>
      <Button
        testID={testId + '::OnMonthsChange'}
        onPress={() => onMonthsChange?.(selectedMonths)}
        title='On Months Change'
      />
    </View>
  );
}
