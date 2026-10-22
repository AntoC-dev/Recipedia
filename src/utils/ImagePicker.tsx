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

import { Image, Platform } from 'react-native';
import { openCamera, openCropper, openPicker } from 'react-native-image-crop-picker';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';
import { uiLogger } from '@utils/logger';
import { ImageSize } from '@utils/imageResize';

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
    hideBottomControls: false,
    waitAnimationEnd: true,
  };
}

async function readSourceSize(uri: string): Promise<ImageSize | undefined> {
  try {
    const size = await Image.getSize(uri);
    uiLogger.debug('cropImage: source size read', { uri, ...size });
    return size;
  } catch (error) {
    uiLogger.warn('cropImage: cannot read source size, opening cropper without a box', {
      uri,
      error: String(error),
    });
    return undefined;
  }
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
    uiLogger.debug('pickImage: image picked', {
      path: pickResult.path,
      width: pickResult.width,
      height: pickResult.height,
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
 * iOS: react-native-image-crop-picker always scales the crop to fit `width` x `height`
 * (200x200 by default). Requesting a box equal to the source size means an untouched crop is
 * returned with its exact pixels, the cropper opens on the full image (the box also sets its
 * initial aspect), a partial crop is upscaled once to the source frame, a 90-degree rotated crop
 * is shrunk to fit, and memory never exceeds the source size. When the source size cannot be
 * read, the cropper opens without a box and the output may have a lower resolution.
 *
 * @param uri - File path or URI of the image to crop
 * @param themeColors - React Native Paper theme colors for UI consistency
 * @param knownSize - Oriented pixel size of the image when already known, skips reading it on iOS
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
export async function cropImage(
  uri: string,
  themeColors: MD3Colors,
  knownSize?: ImageSize
): Promise<string> {
  try {
    uiLogger.debug('cropImage: opening cropper', { uri, platform: Platform.OS });
    const sourceSize =
      Platform.OS === 'ios' ? (knownSize ?? (await readSourceSize(uri))) : undefined;
    const cropResult = await openCropper({
      ...createImageOptionsWithTheme(themeColors),
      mediaType: 'photo',
      path: uri,
      ...sourceSize,
    });
    uiLogger.debug('cropImage: image cropped', {
      path: cropResult.path,
      width: cropResult.width,
      height: cropResult.height,
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
    uiLogger.debug('takePhoto: photo captured', {
      path: cameraResult.path,
      width: cameraResult.width,
      height: cameraResult.height,
    });
    return cropImage(cameraResult.path, themeColors, {
      width: cameraResult.width,
      height: cameraResult.height,
    });
  } catch (error) {
    uiLogger.debug(`takePhoto: user cancelled ${error}`);
    return '';
  }
}
