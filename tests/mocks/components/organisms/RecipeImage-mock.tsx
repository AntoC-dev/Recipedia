import React from 'react';
import { Text, View } from 'react-native';
import { RecipeImageProps } from '@components/organisms/RecipeImage';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { MockScanButton } from './_recipeFieldMockHelpers';

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
      {recipeImageProp.overlayButton ? (
        <MockScanButton testID={imageTestID + '::OpenModal'} field={recipeColumnsNames.image} />
      ) : null}
    </View>
  );
}
