import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeTextProps } from '@components/organisms/RecipeText';
import { BlurButton, ErrorEcho } from './_recipeFieldMockHelpers';

export function recipeTextMock(recipeTextProp: RecipeTextProps) {
  const { rootText, addOrEditProps, error, onBlur } = recipeTextProp;
  const testID = recipeTextProp.testID ?? 'RecipeText';
  return (
    <View>
      <Text testID={testID + '::RootText'}>{rootText.value}</Text>
      {addOrEditProps ? (
        <View>
          {addOrEditProps.editType === 'add' ? (
            <Button
              testID={testID + '::OpenModal'}
              title='Open Modal'
              onPress={() => addOrEditProps.openModal()}
            />
          ) : (
            <View>
              <Text testID={testID + '::TextEditable'}>{addOrEditProps.textEditable}</Text>
              <Button
                testID={testID + '::SetTextToEdit'}
                title='Set Text to Edit'
                onPress={newText => addOrEditProps.setTextToEdit(newText as unknown as string)}
              />
              <BlurButton testID={testID} onBlur={onBlur} />
            </View>
          )}
        </View>
      ) : null}
      <ErrorEcho testID={testID} error={error} />
    </View>
  );
}
