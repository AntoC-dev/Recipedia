/**
 * SquareButton - Square-shaped image button component
 *
 * A pressable square button that displays an image. Supports two modes:
 * displaying a recipe image or a custom image source. The button automatically
 * centers the image and applies consistent styling with customizable dimensions.
 *
 * Key Features:
 * - Configurable square dimensions
 * - Support for recipe images or custom image sources
 * - Centered image display with proper scaling
 * - Consistent styling via theme system
 * - Type-safe props with discriminated unions
 *
 * @example
 * ```typescript
 * // Recipe image button
 * <SquareButton
 *   type="recipe"
 *   recipe={recipeData}
 *   side={100}
 *   onPressFunction={() => navigateToRecipe(recipeData)}
 *   testID="recipe-button"
 * />
 *
 * // Custom image button
 * <SquareButton
 *   type="image"
 *   imgSrc="path/to/image.jpg"
 *   side={80}
 *   onPressFunction={() => handleImagePress()}
 *   testID="custom-button"
 * />
 * ```
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { squareButtonStyles, viewInsideButtonCentered } from '@styles/buttons';

import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { CustomImage } from '@components/atomic/CustomImage';
import { useI18n } from '@utils/i18n';

/** Props for recipe type button */
export type propIsRecipe = { type: 'recipe'; recipe: recipeTableElement };

/** Props for custom image type button */
export type propIsImg = { type: 'image'; imgSrc: string };

/**
 * Props for the SquareButton component
 * Uses discriminated union to ensure type safety between recipe and image modes
 */
export type SquareButtonProps = {
  /** Side length of the square button in pixels */
  side: number;
  /** Function called when button is pressed */
  onPressFunction: () => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Screen-reader label; defaults to the recipe title, or a generic image label */
  accessibilityLabel?: string;
} & (propIsRecipe | propIsImg);

/**
 * SquareButton component
 *
 * @param buttonProps - The component props with discriminated union for type safety
 * @returns JSX element representing a square image button
 */
export function SquareButton(buttonProps: SquareButtonProps) {
  const { t } = useI18n();
  let img: string;
  let defaultLabel: string;
  switch (buttonProps.type) {
    case 'recipe':
      img = buttonProps.recipe.image_Source;
      defaultLabel = buttonProps.recipe.title;
      break;
    case 'image':
      img = buttonProps.imgSrc;
      defaultLabel = t('imageButton');
      break;
  }

  return (
    <Pressable
      testID={buttonProps.testID}
      accessibilityRole={'button'}
      accessibilityLabel={buttonProps.accessibilityLabel ?? defaultLabel}
      style={squareButtonStyles(buttonProps.side).squareButton}
      onPress={buttonProps.onPressFunction}
    >
      <View style={viewInsideButtonCentered}>
        <CustomImage testID={buttonProps.testID + '::SquareButton'} uri={img} />
      </View>
    </Pressable>
  );
}

export default SquareButton;
