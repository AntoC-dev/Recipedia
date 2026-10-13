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
 * before it reaches permanent storage. The source is decoded once, directly at
 * the reduced size, through `expo-image` (ImageIO thumbnail decode on iOS, Glide
 * downsampling on Android), then re-encoded through `expo-image-manipulator`
 * while preserving the original container format.
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

import { Image, type ImageRef as DecodedImageRef } from 'expo-image';
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
 * Tells whether an image decoded under the {@link MAX_IMAGE_DIMENSION} bound was
 * downscaled by the decoder.
 *
 * A bounded decode never upscales: a source smaller than the bound comes back
 * at its own size, while a larger one comes back with its longest side equal to
 * the bound. A source whose longest side already equals the bound is therefore
 * reported as reaching it.
 *
 * @param size - Pixel dimensions returned by the bounded decode
 * @returns `true` when the longest side reached the bound, `false` when the source was smaller or the dimensions are unusable
 *
 * @example
 * ```typescript
 * reachesBound({ width: 1280, height: 960 }) // true — a 4032x3024 source was downscaled
 * reachesBound({ width: 800, height: 600 })  // false — the source already fit
 * ```
 */
export function reachesBound(size: ImageSize): boolean {
  const { width, height } = size;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }
  return Math.max(width, height) >= MAX_IMAGE_DIMENSION;
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
 * Writes a copy of an image whose longest side fits within {@link MAX_IMAGE_DIMENSION}.
 *
 * The source is left untouched. When the image already fits, its format cannot
 * be preserved, or decoding/encoding fails, the original URI is returned with
 * `resized: false` so callers can fall back to storing the source as-is.
 *
 * The source is decoded once, directly at the reduced size, so no full-size
 * bitmap is ever built; the decoder applies EXIF orientation. Both native
 * references are released before returning so peak bitmap memory does not
 * depend on the JS collector.
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

  let decoded: DecodedImageRef | null = null;
  let rendered: ImageRef | null = null;

  try {
    decoded = await Image.loadAsync(sourceUri, {
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
    });
    rendered = await ImageManipulator.manipulate(decoded).renderAsync();

    if (!reachesBound(rendered)) {
      fileSystemLogger.debug('Image already within bound, skipping downscale', {
        sourceUri,
        width: rendered.width,
        height: rendered.height,
      });
      return { uri: sourceUri, resized: false };
    }

    const saved = await rendered.saveAsync({
      format,
      compress: IMAGE_COMPRESSION_QUALITY,
    });

    fileSystemLogger.debug('Image downscaled', {
      sourceUri,
      targetWidth: rendered.width,
      targetHeight: rendered.height,
    });

    return { uri: saved.uri, resized: true };
  } catch (error) {
    fileSystemLogger.warn('Failed to downscale image, keeping original', { sourceUri, error });
    return { uri: sourceUri, resized: false };
  } finally {
    rendered?.release();
    decoded?.release();
  }
}
