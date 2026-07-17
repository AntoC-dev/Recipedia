/**
 * RecipeImage - Recipe image display with dynamic overlay button positioning
 *
 * A specialized image component designed for recipe display with smart button positioning
 * based on image load state. Features automatic fallback handling for invalid images
 * and context-aware button placement for optimal user experience.
 *
 * Key Features:
 * - Dynamic button positioning based on image validity
 * - Automatic image load state detection
 * - Fallback handling for invalid or missing images
 * - Modal integration for image editing/replacement
 * - Responsive height scaling based on screen size
 * - Overlay button with proper accessibility
 * - Theme-integrated image background handling
 *
 * @example
 * ```typescript
 * // Recipe image with edit functionality
 * <RecipeImage
 *   imgUri={recipe.image_Source}
 *   buttonIcon="camera"
 *   openModal={(field) => openImageEditModal(field)}
 * />
 *
 * // Read-only recipe image
 * <RecipeImage
 *   imgUri={recipe.image_Source}
 *   openModal={() => {}} // No-op for read-only
 * />
 *
 * // Image with replacement option
 * <RecipeImage
 *   imgUri={currentImageUri}
 *   buttonIcon="image-edit"
 *   openModal={(field) => showImagePicker(field)}
 * />
 * ```
 */

import { StyleSheet, View } from 'react-native';
import React from 'react';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import { IconName } from '@assets/Icons';
import { CustomImage } from '@components/atomic/CustomImage';
import { RoundButton } from '@components/atomic/RoundButton';
import { padding, screenHeight } from '@styles/spacing';

/**
 * Props for the RecipeImage component
 */
export type RecipeImageProps = {
  /** URI or path to the recipe image */
  imgUri: string;
  /** Callback fired when the overlay button is pressed */
  openModal: (field: recipeColumnsNames) => void;
  /** Optional icon for the overlay button */
  buttonIcon?: IconName;
};

/**
 * RecipeImage component for recipe image display with smart button positioning
 *
 * @param props - The component props
 * @returns JSX element representing a recipe image with dynamic overlay button
 */
export function RecipeImage({ imgUri, openModal, buttonIcon }: RecipeImageProps) {
  const [validUri, setValidUri] = React.useState(imgUri.length > 0);

  const imageTestID = 'RecipeImage';
  return (
    <View style={styles.recipeImageContainer} testID={imageTestID}>
      <CustomImage
        testID={imageTestID}
        uri={imgUri}
        onLoadError={() => {
          setValidUri(false);
        }}
        onLoadSuccess={() => setValidUri(true)}
      />
      {buttonIcon ? (
        <View style={validUri ? styles.topRightButtonContainer : styles.centerButtonContainer}>
          <RoundButton
            testID={imageTestID}
            size={'medium'}
            icon={buttonIcon}
            onPressFunction={() => openModal(recipeColumnsNames.image)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  recipeImageContainer: { height: screenHeight / 2 },
  centerButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightButtonContainer: {
    position: 'absolute',
    top: padding.small,
    right: padding.small,
  },
});
