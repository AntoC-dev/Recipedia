/**
 * imageResize - Bounded image downscaling helpers
 *
 * Recipe photos come from the camera (8-48MP) or from scraped websites at
 * whatever resolution the site serves. Persisting them verbatim makes every
 * list tile decode a multi-megapixel bitmap into a ~200px view, which causes
 * frame drops and bitmap-cache churn once a library grows past a few hundred
 * recipes.
 *
 * These helpers cap the longest side of an image at {@link MAX_IMAGE_DIMENSION}
 * before it reaches permanent storage, re-encoding through
 * `expo-image-manipulator` while preserving the original container format.
 *
 * @example
 * ```typescript
 * import { resizeImageToBound } from '@utils/imageResize';
 *
 * const bounded = await resizeImageToBound(cacheUri, 'jpg');
 * if (bounded.resized) {
 *   // bounded.uri points at a new, smaller file in the manipulator cache
 * }
 * ```
 *
 * @module imageResize
 */

import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator';
import { fileSystemLogger } from '@utils/logger';

/**
 * Longest side, in pixels, that a stored recipe image may have.
 *
 * Sized for the recipe detail view, which renders full width at half the screen
 * height — roughly 1080 physical pixels on a high-density phone. Card tiles are
 * far smaller and are downsampled again by expo-image at render time.
 */
export const MAX_IMAGE_DIMENSION = 1280;

/**
 * Encoder quality applied when an image is re-encoded during downscaling.
 * Ignored by lossless formats such as PNG.
 */
export const IMAGE_COMPRESSION_QUALITY = 0.8;

/**
 * Pixel dimensions of an image.
 */
export type ImageSize = {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
};

/**
 * Result of a bounded downscale attempt.
 */
export type BoundedImage = {
  /** URI to use as the image source — the downscaled copy, or the original when untouched */
  uri: string;
  /** True when a smaller copy was written, false when the original was kept as-is */
  resized: boolean;
};

const saveFormatByExtension: Record<string, SaveFormat> = {
  jpg: SaveFormat.JPEG,
  jpeg: SaveFormat.JPEG,
  png: SaveFormat.PNG,
  webp: SaveFormat.WEBP,
};

/**
 * Computes the dimensions an image should be scaled to so its longest side fits
 * within `maxDimension`, preserving aspect ratio.
 *
 * @param width - Source width in pixels
 * @param height - Source height in pixels
 * @param maxDimension - Maximum allowed longest side. Defaults to {@link MAX_IMAGE_DIMENSION}
 * @returns Target dimensions, or `null` when the image already fits or the input dimensions are unusable
 *
 * @example
 * ```typescript
 * computeBoundedSize(4032, 3024, 1280) // { width: 1280, height: 960 }
 * computeBoundedSize(800, 600, 1280)   // null — already within bound
 * ```
 */
export function computeBoundedSize(
  width: number,
  height: number,
  maxDimension: number = MAX_IMAGE_DIMENSION
): ImageSize | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) {
    return null;
  }

  const scale = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Maps a file extension to the `expo-image-manipulator` save format that keeps
 * the image in its original container.
 *
 * @param extension - File extension without the leading dot, any casing
 * @returns Matching save format, or `null` when the format cannot be preserved
 *
 * @example
 * ```typescript
 * saveFormatForExtension('JPEG') // SaveFormat.JPEG
 * saveFormatForExtension('gif')  // null
 * ```
 */
export function saveFormatForExtension(extension: string): SaveFormat | null {
  return saveFormatByExtension[extension.toLowerCase()] ?? null;
}

/**
 * Writes a copy of an image whose longest side fits within `maxDimension`.
 *
 * The source is left untouched. When the image already fits, its format cannot
 * be preserved, or the manipulator fails, the original URI is returned with
 * `resized: false` so callers can fall back to storing the source as-is.
 *
 * The source is decoded once: the bitmap produced while probing the dimensions
 * is reused as the input of the resize, and both native references are released
 * before returning so peak bitmap memory does not depend on the JS collector.
 *
 * @param sourceUri - URI of the image to downscale
 * @param extension - Source file extension, used to keep the container format
 * @returns Promise resolving to the URI to store and whether a new file was written
 *
 * @example
 * ```typescript
 * const bounded = await resizeImageToBound('file:///cache/photo.jpg', 'jpg');
 * const fileToStore = bounded.uri;
 * ```
 */
export async function resizeImageToBound(
  sourceUri: string,
  extension: string
): Promise<BoundedImage> {
  const format = saveFormatForExtension(extension);
  if (!format) {
    fileSystemLogger.debug('Image format cannot be preserved, skipping downscale', {
      sourceUri,
      extension,
    });
    return { uri: sourceUri, resized: false };
  }

  let probe: ImageRef | null = null;
  let rendered: ImageRef | null = null;

  try {
    probe = await ImageManipulator.manipulate(sourceUri).renderAsync();
    const bounded = computeBoundedSize(probe.width, probe.height);

    if (!bounded) {
      fileSystemLogger.debug('Image already within bound, skipping downscale', {
        sourceUri,
        width: probe.width,
        height: probe.height,
      });
      return { uri: sourceUri, resized: false };
    }

    const context = ImageManipulator.manipulate(probe);
    context.resize(bounded);
    rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format,
      compress: IMAGE_COMPRESSION_QUALITY,
    });

    fileSystemLogger.debug('Image downscaled', {
      sourceUri,
      sourceWidth: probe.width,
      sourceHeight: probe.height,
      targetWidth: bounded.width,
      targetHeight: bounded.height,
    });

    return { uri: saved.uri, resized: true };
  } catch (error) {
    fileSystemLogger.warn('Failed to downscale image, keeping original', { sourceUri, error });
    return { uri: sourceUri, resized: false };
  } finally {
    rendered?.release();
    probe?.release();
  }
}
