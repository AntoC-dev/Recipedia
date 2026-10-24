import React from 'react';
import { Button, Text, View } from 'react-native';
import { RecipeImageProps } from '@components/organisms/RecipeImage';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';

export function recipeImageMock(recipeImageProp: RecipeImageProps) {
  const imageTestID = 'RecipeImage';

  return (
    <View>
      <Text testID={imageTestID + '::ImgUri'}>{recipeImageProp.imgUri}</Text>
      <Text testID={imageTestID + '::OverlayButtonIcon'}>
        {recipeImageProp.overlayButton?.icon}
      </Text>
      <Text testID={imageTestID + '::OverlayButtonLabelKey'}>
        {recipeImageProp.overlayButton?.labelKey}
      </Text>
      <Button
        testID={imageTestID + '::OpenModal'}
        onPress={() => {
          recipeImageProp.openModal(recipeColumnsNames.image);
        }}
        title='Open Modal'
      />
    </View>
  );
}
