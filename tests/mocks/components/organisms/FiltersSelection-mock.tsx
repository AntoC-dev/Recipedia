import React, { useState, useEffect } from 'react';
import { FiltersSelectionProps } from '@components/organisms/FiltersSelection';
import { Button, Text, View } from 'react-native';

let cptRemove = 0;
let addFilterCalls = 0;

// Mock filters that get added in sequence
const mockFilters = [
  'filterTypes.inSeason',
  'ingredientTypes.nutsAndSeeds',
  'filterTypes.purchased',
];
let globalCurrentFilters: string[] = [];

// Reset function for tests
export function resetFiltersSelection() {
  addFilterCalls = 0;
  globalCurrentFilters = [];
  cptRemove = 0;
}

// TODO to put somewhere else
export function mapToObject(map: Map<any, any>) {
  const obj: Record<string, any> = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

function FiltersSelectionMock({
  testId,
  addingFilterMode,
  onRemoveFilter,
  setAddingAFilter,
  onToggleButtonTop,
  screenFocused,
}: FiltersSelectionProps) {
  const [localFilters, setLocalFilters] = useState<string[]>([...globalCurrentFilters]);

  // Sync with global state
  useEffect(() => {
    setLocalFilters([...globalCurrentFilters]);
  }, []);

  return (
    <View>
      <Text testID={testId + '::Filters'}>{JSON.stringify(localFilters)}</Text>
      <Text testID={testId + '::AddingFilterMode'}>{addingFilterMode.toString()}</Text>
      <Button
        testID={testId + '::AddFilter'}
        onPress={() => {
          // Add the next filter in sequence
          if (addFilterCalls < mockFilters.length) {
            const filterToAdd = mockFilters[addFilterCalls];
            if (!globalCurrentFilters.includes(filterToAdd)) {
              globalCurrentFilters.push(filterToAdd);
              setLocalFilters([...globalCurrentFilters]);
            }
            addFilterCalls++;
          }
          setAddingAFilter(!addingFilterMode);
        }}
        title='Add Filter'
      />
      <Button
        testID={testId + '::RemoveFilter'}
        onPress={() => {
          if (globalCurrentFilters.length > 0) {
            const removedFilter = globalCurrentFilters.shift();
            if (removedFilter) {
              setLocalFilters([...globalCurrentFilters]);
              onRemoveFilter(removedFilter);
              addFilterCalls = Math.max(0, addFilterCalls - 1);
            }
          }
        }}
        title='Remove Filter'
      />
      <Button
        testID={testId + '::ToggleAddingFilterMode'}
        onPress={() => setAddingAFilter(!addingFilterMode)}
        title='Toggle Filter Mode'
      />
      <Text testID={testId + '::ScreenFocused'}>{String(screenFocused)}</Text>
      <Button
        testID={testId + '::ReportToggleTop'}
        onPress={() => onToggleButtonTop?.(88)}
        title='Report Toggle Top'
      />
    </View>
  );
}

export const filtersSelectionMock = FiltersSelectionMock;
