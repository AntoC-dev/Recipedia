import React from 'react';
import { Button, Text, View } from 'react-native';
import { FilterAccordionProps } from '@components/organisms/FilterAccordion';
import { mapToObject } from '@mocks/components/organisms/FiltersSelection-mock';
import { listFilter } from '@customTypes/RecipeFiltersTypes';

export function filterAccordionMock({
  testId,
  tagsList,
  ingredientsList,
  filtersState,
  addFilter,
  removeFilter,
}: FilterAccordionProps) {
  // Match the actual component behavior: add ::FilterAccordion suffix
  const accordionId = testId + '::FilterAccordion';

  return (
    <View testID={accordionId}>
      <Text testID={accordionId + '::TagsList'}>{JSON.stringify(tagsList)}</Text>
      <Text testID={accordionId + '::IngredientsList'}>{JSON.stringify(ingredientsList)}</Text>
      <Text testID={accordionId + '::FiltersState'}>
        {JSON.stringify(mapToObject(filtersState))}
      </Text>
      <Button
        testID={accordionId + '::AddFilter'}
        onPress={() => addFilter(listFilter.tags, 'New filter')}
        title='Click on Add Filter'
      />
      <Button
        testID={accordionId + '::RemoveFilter'}
        onPress={() => removeFilter(listFilter.tags, 'New filter')}
        title='Click on Remove Filter'
      />
      <Button
        testID={accordionId + '::RemoveFilterByTitle'}
        onPress={() => removeFilter(listFilter.recipeTitleInclude, 'S')}
        title='Click on Remove Filter By Title'
      />
    </View>
  );
}
