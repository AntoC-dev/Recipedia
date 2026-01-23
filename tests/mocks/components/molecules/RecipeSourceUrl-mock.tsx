import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeSourceUrlProps } from '@components/molecules/RecipeSourceUrl';

export function RecipeSourceUrl({
  sourceUrl,
  onCopied,
  testID = 'RecipeSourceUrl',
}: RecipeSourceUrlProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::Text`}>{sourceUrl}</Text>
      {onCopied && <Button testID={`${testID}::CopyButton`} onPress={onCopied} title='Mock Copy' />}
    </View>
  );
}

export default RecipeSourceUrl;
