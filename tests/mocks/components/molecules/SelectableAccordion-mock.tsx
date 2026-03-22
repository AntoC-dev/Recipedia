import React from 'react';
import { Button, Text, View } from 'react-native';
import { SelectableAccordionProps } from '@components/molecules/SelectableAccordion';

export function selectableAccordionMock({
  testID,
  title,
  items,
  selectedValues,
  onPress,
  allSelectedLabel,
}: SelectableAccordionProps) {
  const description =
    allSelectedLabel && selectedValues.length === items.length
      ? allSelectedLabel
      : selectedValues.join(', ');
  return (
    <View testID={testID}>
      <Text testID={testID + '::Title'}>{title}</Text>
      <Text testID={testID + '::SelectedValues'}>{JSON.stringify(selectedValues)}</Text>
      <Text testID={testID + '::Description'}>{description}</Text>
      {items.map(item => (
        <Button
          key={item.value}
          testID={testID + '::' + item.value}
          title={item.label}
          onPress={() => onPress(item.value)}
        />
      ))}
    </View>
  );
}
