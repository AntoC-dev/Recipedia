import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeTextProps } from '@components/organisms/RecipeText';
import { BlurButton, ErrorEcho, MockScanButton } from './_recipeFieldMockHelpers';

export function recipeTextMock(recipeTextProp: RecipeTextProps) {
  const { rootText, addOrEditProps, error, onBlur } = recipeTextProp;
  const testID = recipeTextProp.testID ?? 'RecipeText';
  return (
    <View>
      <Text testID={testID + '::RootText'}>{rootText.value}</Text>
      {addOrEditProps ? (
        <View>
          <Text testID={testID + '::ScanField'}>{addOrEditProps.scanField}</Text>
          <Text testID={testID + '::WithScan'}>{String(!!addOrEditProps.withScan)}</Text>
          {addOrEditProps.editType === 'editable' ? (
            <View>
              <Text testID={testID + '::TextEditable'}>{addOrEditProps.textEditable}</Text>
              <Button
                testID={testID + '::SetTextToEdit'}
                title='Set Text to Edit'
                onPress={newText => addOrEditProps.setTextToEdit(newText as unknown as string)}
              />
              <BlurButton testID={testID} onBlur={onBlur} />
            </View>
          ) : null}
          {addOrEditProps.withScan ? (
            <MockScanButton testID={testID + '::OpenModal'} field={addOrEditProps.scanField} />
          ) : null}
        </View>
      ) : null}
      <ErrorEcho testID={testID} error={error} />
    </View>
  );
}
