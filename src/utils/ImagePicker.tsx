/**
 * ImagePicker - Image selection and manipulation utilities
 *
 * This module provides user-friendly image picking, capturing, and cropping functionality
 * with full theme integration. Uses react-native-image-crop-picker for consistent
 * cross-platform behavior and applies React Native Paper theme colors for UI consistency.
 *
 * Key Features:
 * - Gallery image selection with cropping
 * - Camera photo capture with cropping
 * - Manual image cropping
 * - Theme-aware UI styling
 * - High-quality image compression
 * - Gesture-based rotation and free-style cropping
 *
 * @example
 * ```typescript
 * import { useTheme } from 'react-native-paper';
 *
 * const { colors } = useTheme();
 *
 * // Pick from gallery
 * const imagePath = await pickImage(colors);
 *
 * // Take photo with camera
 * const photoPath = await takePhoto(colors);
 *
 * // Crop existing image
 * const croppedPath = await cropImage(existingImageUri, colors);
 * ```
 */

import { openCamera, openCropper, openPicker } from 'react-native-image-crop-picker';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';
import { uiLogger } from '@utils/logger';

/**
 * Creates image picker options with theme-appropriate colors
 *
 * Configures the image picker/cropper interface to match the current app theme.
 * Sets up cropping behavior, quality settings, and UI customization.
 *
 * @param themeColors - React Native Paper theme colors
 * @returns Configuration object for image picker operations
 */
function createImageOptionsWithTheme(themeColors: MD3Colors) {
  const statusBarColor = themeColors.primaryContainer;
  const actionColor = themeColors.surface;
  const backgroundColor = themeColors.onSurface;
  // TODO to translate
  return {
    mediaType: 'photo' as const,
    sortOrder: 'desc' as const,
    cropperCancelText: 'Cancel',
    cropperChooseText: 'Choose',
    cropping: true,
    width: 10000,
    height: 10000,
    avoidEmptySpaceAroundImage: false,
    cropperToolbarTitle: '',
    freeStyleCropEnabled: true,
    showCropGuidelines: true,
    showCropFrame: true,
    enableRotationGesture: true,
    compressImageQuality: 1,
    cropperStatusBarColor: statusBarColor,
    cropperToolbarColor: backgroundColor,
    cropperToolbarWidgetColor: actionColor,
    cropperCircleOverlay: false,
    useFrontCamera: false,
    includeExif: true,
    hideBottomControls: true,
    waitAnimationEnd: true,
  };
}

/**
 * Opens the device's image gallery to select a photo
 *
 * Allows users to pick an image from their device's photo gallery with built-in
 * cropping functionality. Returns the file path of the selected and cropped image.
 *
 * @param themeColors - React Native Paper theme colors for UI consistency
 * @returns Promise resolving to the file path of selected image, or empty string if cancelled
 *
 * @example
 * ```typescript
 * const { colors } = useTheme();
 * const imagePath = await pickImage(colors);
 *
 * if (imagePath) {
 *   console.log(`Image selected: ${imagePath}`);
 *   // Process the selected image
 * } else {
 *   console.log('User cancelled image selection');
 * }
 * ```
 */
export async function pickImage(themeColors: MD3Colors): Promise<string> {
  try {
    const pickResult = await openPicker({
      ...createImageOptionsWithTheme(themeColors),
      mediaType: 'photo',
    });
    return pickResult.path;
  } catch (error) {
    uiLogger.debug(`pickImage: user cancelled ${error}`);
    return '';
  }
}

/**
 * Opens the cropping interface for an existing image
 *
 * Allows users to manually crop an existing image file. Useful for editing
 * images that have already been selected or captured.
 *
 * @param uri - File path or URI of the image to crop
 * @param themeColors - React Native Paper theme colors for UI consistency
 * @returns Promise resolving to the file path of cropped image, or empty string if cancelled
 *
 * @example
 * ```typescript
 * const { colors } = useTheme();
 * const existingImagePath = "file:///path/to/image.jpg";
 * const croppedPath = await cropImage(existingImagePath, colors);
 *
 * if (croppedPath) {
 *   console.log(`Image cropped: ${croppedPath}`);
 *   // Use the cropped image
 * } else {
 *   console.log('User cancelled cropping');
 * }
 * ```
 */
export async function cropImage(uri: string, themeColors: MD3Colors): Promise<string> {
  try {
    const cropResult = await openCropper({
      ...createImageOptionsWithTheme(themeColors),
      mediaType: 'photo',
      path: uri,
    });
    return cropResult.path;
  } catch (error) {
    uiLogger.debug(`cropImage: user cancelled ${error}`);
    return '';
  }
}

/**
 * Opens the device's camera to capture a new photo
 *
 * Launches the camera interface allowing users to take a new photo with built-in
 * cropping functionality. Returns the file path of the captured and cropped image.
 *
 * @param themeColors - React Native Paper theme colors for UI consistency
 * @returns Promise resolving to the file path of captured image, or empty string if cancelled
 *
 * @example
 * ```typescript
 * const { colors } = useTheme();
 * const photoPath = await takePhoto(colors);
 *
 * if (photoPath) {
 *   console.log(`Photo captured: ${photoPath}`);
 *   // Process the captured photo
 * } else {
 *   console.log('User cancelled photo capture');
 * }
 * ```
 */
export async function takePhoto(themeColors: MD3Colors): Promise<string> {
  try {
    const cameraResult = await openCamera({
      ...createImageOptionsWithTheme(themeColors),
      mediaType: 'photo',
    });
    return cameraResult.path;
  } catch (error) {
    uiLogger.debug(`takePhoto: user cancelled ${error}`);
    return '';
  }
}
