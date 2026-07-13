import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeTagProps } from '@components/organisms/RecipeTags';

export function recipeTagsMock(recipeTagProp: RecipeTagProps) {
  const tagsTestID = 'RecipeTags';
  return (
    <View>
      <Text testID={tagsTestID + '::TagsList'}>{JSON.stringify(recipeTagProp.tagsList)}</Text>
      {recipeTagProp.type === 'readOnly' ? null : (
        <View>
          <Text testID={tagsTestID + '::RandomTags'}>{recipeTagProp.randomTags}</Text>
          <Button
            testID={tagsTestID + '::AddNewTag'}
            onPress={() => recipeTagProp.addNewTag('mockTag')}
            title='Add New Tag'
          />
          <Button
            testID={tagsTestID + '::RemoveTag'}
            onPress={() => recipeTagProp.removeTag(recipeTagProp.tagsList[0]!)}
            title='Change Tag'
          />
        </View>
      )}
    </View>
  );
}
