import React from 'react';
import { Button, Text, View } from 'react-native';
import { ImportSkippedWarningProps } from '@components/molecules/ImportSkippedWarning';
import { SkippedRecipesListMock } from './SkippedRecipesList-mock';

export function ImportSkippedWarningMock({
  skippedRecipes,
  onContinue,
  testID,
}: ImportSkippedWarningProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::Title`}>bulkImport.validation.skippedWarningTitle</Text>
      <Text testID={`${testID}::Body`}>bulkImport.validation.skippedWarningBody</Text>
      <SkippedRecipesListMock skippedRecipes={skippedRecipes} testID={`${testID}::SkippedList`} />
      <Button
        testID={`${testID}::ContinueButton`}
        onPress={onContinue}
        title='bulkImport.validation.continueToImport'
      />
    </View>
  );
}
