import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeNumberProps } from '@components/organisms/RecipeNumber';
import { BlurButton, ErrorEcho, MockScanButton } from './_recipeFieldMockHelpers';

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
            <Text testID={testID + '::ScanField'}>{numberProps.scanField}</Text>
            <Text testID={testID + '::WithScan'}>{String(!!numberProps.withScan)}</Text>
            {numberProps.editType === 'editable' ? (
              <View>
                <Text testID={testID + '::TextEditable'}>{numberProps.textEditable}</Text>
                <Button
                  testID={testID + '::SetTextToEdit'}
                  title='Set Text to Edit'
                  onPress={newNumber => numberProps.setTextToEdit(Number(newNumber))}
                />
                <BlurButton testID={testID} onBlur={onBlur} />
              </View>
            ) : null}
            {numberProps.withScan ? (
              <MockScanButton testID={testID + '::OpenModal'} field={numberProps.scanField} />
            ) : null}
          </View>
        )}
      </View>
      <ErrorEcho testID={testID} error={error} />
    </View>
  );
}
