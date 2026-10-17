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

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image, Platform } from 'react-native';
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
    avoidEmptySpaceAroundImage: false,
    cropperToolbarTitle: '',
    freeStyleCropEnabled: true,
    showCropGuidelines: true,
    showCropFrame: true,
    enableRotationGesture: true,
    cropperRotateButtonsHidden: false,
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
 * Builds the `width`/`height` cropper options for iOS: a square box whose side equals the
 * longest side of the source image, so the native resize never downscales a crop.
 *
 * @param uri - File path or URI of the image about to be cropped
 * @returns Square `width`/`height` options in source pixels
 */
async function getSquareCropBox(uri: string): Promise<{ width: number; height: number }> {
  const { width, height } = await Image.getSize(uri);
  const side = Math.max(width, height);
  return { width: side, height: side };
}

/**
 * Resizes a cropper output back to the crop's native pixel size and re-encodes it as JPEG.
 *
 * @param path - File path of the cropper output
 * @param cropRect - Crop rectangle in source pixels, as reported by the cropper
 * @returns Promise resolving to the URI of the resized image
 */
async function resizeToCropRect(
  path: string,
  cropRect: { width: number; height: number }
): Promise<string> {
  const context = ImageManipulator.manipulate(path);
  context.resize({ width: Math.round(cropRect.width), height: Math.round(cropRect.height) });
  const imageRef = await context.renderAsync();
  const result = await imageRef.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
  return result.uri;
}

/**
 * Opens the device's image gallery to select a photo
 *
 * Allows users to pick an image from their device's photo gallery.
 * Returns the full-resolution file path of the selected image so that
 * any subsequent crop (e.g. for OCR region selection) operates on the
 * original data and produces a sharp result.
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
      cropping: false,
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
 * Android: returns the cropper output directly, which uCrop already writes at full
 * resolution with any rotation applied.
 *
 * iOS: the native cropper shrinks its output to fit the requested `width` x `height`
 * (200x200 by default) and upscales smaller crops to touch that box. A square box as large as
 * the source's longest side is requested so rotated or unrotated crops are never downscaled,
 * then the output is resized back to `cropRect` (its true pixel size) with
 * `expo-image-manipulator`. Falls back to `cropResult.path` when `cropRect` is unavailable.
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
    const isIOS = Platform.OS === 'ios';
    const cropResult = await openCropper({
      ...createImageOptionsWithTheme(themeColors),
      mediaType: 'photo',
      path: uri,
      ...(isIOS ? await getSquareCropBox(uri) : {}),
    });
    if (!isIOS || !cropResult.cropRect) {
      return cropResult.path;
    }
    return resizeToCropRect(cropResult.path, cropResult.cropRect);
  } catch (error) {
    uiLogger.debug(`cropImage: user cancelled ${error}`);
    return '';
  }
}

/**
 * Opens the device's camera to capture a new photo
 *
 * Captures an uncropped photo, then crops it through {@link cropImage} so the result keeps
 * full resolution (the native cropper would otherwise shrink it on iOS). Returns the file path
 * of the cropped image.
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
      cropping: false,
    });
    return cropImage(cameraResult.path, themeColors);
  } catch (error) {
    uiLogger.debug(`takePhoto: user cancelled ${error}`);
    return '';
  }
}
