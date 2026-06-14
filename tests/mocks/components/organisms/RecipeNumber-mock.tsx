import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeNumberProps } from '@components/organisms/RecipeNumber';
import { BlurButton, ErrorEcho } from './_recipeFieldMockHelpers';

export function recipeNumberMock(recipeNumberProp: RecipeNumberProps) {
  const { testID, numberProps, error, onBlur } = recipeNumberProp;
  return (
    <View>
      <View>
        {numberProps.editType === 'read' ? (
          <Text testID={testID + '::Text'}>{numberProps.text}</Text>
        ) : (
          <View>
            <Text testID={testID + '::PrefixText'}>{numberProps.prefixText}</Text>
            <Text testID={testID + '::SuffixText'}>{numberProps.suffixText}</Text>
            {numberProps.editType === 'add' ? (
              <Button
                testID={testID + '::OpenModal'}
                title='Open Modal'
                onPress={() => numberProps.openModal()}
              />
            ) : (
              <View>
                <Text testID={testID + '::TextEditable'}>{numberProps.textEditable}</Text>
                <Button
                  testID={testID + '::SetTextToEdit'}
                  title='Set Text to Edit'
                  onPress={newNumber => numberProps.setTextToEdit(Number(newNumber))}
                />
                <BlurButton testID={testID} onBlur={onBlur} />
              </View>
            )}
          </View>
        )}
      </View>
      <ErrorEcho testID={testID} error={error} />
    </View>
  );
}
