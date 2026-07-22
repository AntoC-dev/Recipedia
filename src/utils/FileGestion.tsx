/**
 * FileGestion - File system management and image storage utilities
 *
 * This module provides comprehensive file system management for the Recipedia app.
 * It handles image storage, cache management, asset initialization, and file operations
 * with proper error handling and logging.
 *
 * Key Features:
 * - Organized directory structure for app data and cache
 * - Recipe image storage with automatic naming
 * - Cache management for temporary files
 * - Asset initialization for bundled images
 * - File copy, move, and backup operations
 *
 * Directory Structure:
 * - Documents: `/documents/Recipedia/` - Permanent app data
 * - Cache: `/cache/Recipedia/` - Temporary app cache
 *
 * @example
 * ```typescript
 * import { init, saveRecipeImage, clearCache } from '@utils/FileGestion';
 *
 * init();
 *
 * // Save a recipe image
 * const imageName = await saveRecipeImage(tempUri, "Chocolate Cake");
 *
 * // Clear cache
 * clearCache();
 * ```
 */

import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import ImageCropPicker from 'react-native-image-crop-picker';
import pkg from '@app/package.json';
import { productionRecipesImages, testRecipesImages } from '@utils/Constants';
import { getDatasetType } from '@utils/DatasetLoader';
import { fileSystemLogger } from '@utils/logger';
import { RecipeDraft } from '@customTypes/DatabaseElementTypes';
import { forEachChunk } from '@utils/chunk';

const DIRECTORY_NAME = Constants.expoConfig?.name || pkg.name;
const APP_DIR = new Directory(Paths.document, DIRECTORY_NAME);
const APP_CACHE = new Directory(Paths.cache, DIRECTORY_NAME);

/**
 * Sanitizes a string for use as a safe filename
 *
 * Converts the input to a filesystem-safe format by:
 * - Converting to lowercase
 * - Removing diacritics/accents (e.g., "café" → "cafe")
 * - Replacing non-alphanumeric characters with underscores
 * - Collapsing multiple underscores into one
 * - Removing leading/trailing underscores
 * - Truncating to maximum 100 characters
 *
 * @param name - The original string to sanitize
 * @returns A sanitized, filesystem-safe string
 *
 * @example
 * ```typescript
 * sanitizeFilename("Crème Brûlée!") // Returns: "creme_brulee"
 * sanitizeFilename("Recipe #1: Test") // Returns: "recipe_1_test"
 * sanitizeFilename("___test___") // Returns: "test"
 * ```
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100);
}

/**
 * Extracts the filename from a full image URI by stripping the app directory prefix.
 *
 * If the URI doesn't contain the directory prefix, returns it unchanged
 * (assumes it's already a filename).
 *
 * @param imageUri - Full image URI (e.g., "file:///documents/Recipedia/pasta.jpg")
 * @returns Just the filename (e.g., "pasta.jpg")
 */
export function extractFilenameFromUri(imageUri: string): string {
  if (imageUri.startsWith(APP_DIR.uri)) {
    return imageUri.substring(APP_DIR.uri.length);
  }
  return imageUri;
}

/**
 * Constructs a full image URI from a filename by prepending the app directory path.
 *
 * @param imageFilename - The image filename (e.g., "pasta.jpg")
 * @returns Full image URI (e.g., "file:///documents/Recipedia/pasta.jpg")
 */
export function constructImageUri(imageFilename: string): string {
  return APP_DIR.uri + imageFilename;
}

/**
 * Clears the app cache directory and camera picker temporary files
 *
 * Removes all files from the app-specific cache directory and calls
 * ImageCropPicker.clean() to remove camera picker temporary files.
 *
 * @example
 * ```typescript
 * clearCache();
 * console.log('Cache cleared successfully');
 * ```
 */
export function clearCache(): void {
  fileSystemLogger.info('Clearing cache directories');
  try {
    if (APP_CACHE.exists) {
      const items = APP_CACHE.list();
      for (const item of items) {
        item.delete();
      }
    }
  } catch (error) {
    fileSystemLogger.warn('Failed to clear app cache', {
      cacheUri: APP_CACHE.uri,
      error,
    });
  }
  ImageCropPicker.clean().catch((error: unknown) => {
    fileSystemLogger.warn('Failed to clean camera picker cache', { error });
  });
}

/**
 * Deletes a file at the given URI
 *
 * Silently ignores errors so callers can fire-and-forget cleanup without
 * affecting the happy path (e.g. old image files after a recipe image update).
 *
 * @param uri - URI of the file to delete
 *
 * @example
 * ```typescript
 * deleteFile('file:///documents/Recipedia/old_image_abc123.jpg');
 * ```
 */
export function deleteFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
      fileSystemLogger.debug('File deleted', { uri });
    }
  } catch (error) {
    fileSystemLogger.warn('Failed to delete file', { uri, error });
  }
}

/**
 * Determines if an image URI points to a temporary location
 *
 * Returns true when the URI does not reside inside the app's permanent storage
 * directory (documents/Recipedia). Useful to know whether an image still lives
 * in a cache (ImageManipulator, camera, etc.) and needs to be persisted.
 *
 * @param uri - Image URI to check
 * @returns True if the URI is temporary (cache/manipulator/camera), false if stored permanently
 *
 * @example
 * ```typescript
 * const isTemp = isTemporaryImageUri('file:///cache/ImageManipulator/123.jpg');
 * ```
 */
export function isTemporaryImageUri(uri: string): boolean {
  const isTemporary = !uri.startsWith(APP_DIR.uri);

  fileSystemLogger.debug('Checking if image URI is temporary', {
    imageUri: uri,
    isTemporary,
  });

  return isTemporary;
}

/**
 * Removes image files from the app directory that are no longer referenced by any recipe
 *
 * Compares the files present on disk in the permanent storage directory against
 * the set of active image URIs supplied by the caller (typically all `image_Source`
 * values from the recipe table). Any file not in the active set is deleted.
 *
 * Active URIs are normalised before comparison:
 * - Empty strings and temporary (cache) URIs are ignored
 * - Query parameters (e.g. `?v=123`) are stripped
 *
 * @param activeImageUris - Image URIs currently referenced by recipes
 * @returns Number of orphaned files that were identified and cleaned up
 *
 * @example
 * ```typescript
 * const deleted = await cleanupOrphanedImages(recipes.map(r => r.image_Source));
 * console.log(`Cleaned up ${deleted} orphaned images`);
 * ```
 */
export async function cleanupOrphanedImages(activeImageUris: string[]): Promise<number> {
  try {
    const activeSet = new Set(
      activeImageUris
        .filter(uri => uri && uri.startsWith(APP_DIR.uri))
        .map(uri => uri.split('?')[0])
    );

    const files = APP_DIR.list();
    let deletedCount = 0;

    for (const file of files) {
      if (!activeSet.has(file.uri)) {
        deleteFile(file.uri);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      fileSystemLogger.info('Orphaned images cleaned up', {
        deletedCount,
        totalFiles: files.length,
      });
    }

    return deletedCount;
  } catch (error) {
    fileSystemLogger.warn('Failed to cleanup orphaned images', { error });
    return 0;
  }
}

/**
 * Downloads an image from a remote URL to the app cache directory.
 *
 * Used for downloading recipe images from scraped websites. The image is
 * stored in the cache directory with a unique filename based on timestamp.
 *
 * @param remoteUrl - HTTP/HTTPS URL of the image to download
 * @returns Promise resolving to the local cache URI, or empty string on failure
 *
 * @example
 * ```typescript
 * const localUri = await downloadImageToCache('https://example.com/recipe.jpg');
 * if (localUri) {
 *   // Use localUri for recipe image
 * }
 * ```
 */
export async function downloadImageToCache(remoteUrl: string): Promise<string> {
  if (!remoteUrl) {
    fileSystemLogger.warn('No URL provided for image download');
    return '';
  }

  fileSystemLogger.info('Starting image download', { remoteUrl });

  try {
    const urlWithoutQuery = remoteUrl.split('?')[0]!;
    const extensionMatch = urlWithoutQuery.match(/\.(jpe?g|png|webp|gif)$/i);
    const extension = extensionMatch ? extensionMatch[1]!.toLowerCase() : 'jpg';
    const filename = `scraped_${Date.now()}.${extension}`;
    const localFile = new File(APP_CACHE, filename);

    const downloaded = await File.downloadFileAsync(remoteUrl, localFile, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipediaApp/1.0; +https://github.com/recipedia)',
      },
      idempotent: true,
    });

    fileSystemLogger.info('Image downloaded successfully', {
      remoteUrl,
      localUri: downloaded.uri,
    });

    return downloaded.uri;
  } catch (error) {
    fileSystemLogger.error('Failed to download image', { remoteUrl, error });
    return '';
  }
}

/**
 * Saves a recipe image from cache to permanent storage
 *
 * Moves a temporary image file to permanent storage with a unique filename.
 * The recipe name is sanitized and combined with a UUID for the filename,
 * preserving the original file extension.
 *
 * @param cacheFileUri - URI of the temporary image file to move
 * @param recName - Recipe name used to generate the filename
 * @returns Promise resolving to the permanent image URI, or empty string on failure
 *
 * @example
 * ```typescript
 * const tempImageUri = "file:///cache/temp-image.jpg";
 * const savedUri = await saveRecipeImage(tempImageUri, "Chocolate Cake");
 * // Returns: "file:///documents/Recipedia/chocolate_cake_<uuid>.jpg"
 * ```
 */
export async function saveRecipeImage(cacheFileUri: string, recName: string): Promise<string> {
  try {
    const extensionParts = cacheFileUri.split('.');
    const extension = extensionParts[extensionParts.length - 1]!.split('?')[0] || 'jpg';
    const imgName = sanitizeFilename(recName) + '_' + Crypto.randomUUID() + '.' + extension;
    const imgFile = new File(APP_DIR, imgName);

    const sourceFile = new File(cacheFileUri);
    await sourceFile.copy(imgFile);
    try {
      sourceFile.delete();
    } catch {
      // Best-effort cleanup — source is in cache, will be cleaned up eventually
    }
    fileSystemLogger.debug('Image saved to permanent storage', {
      destinationUri: imgFile.uri,
    });
    return imgFile.uri;
  } catch (error) {
    fileSystemLogger.error('Failed to save recipe image', {
      sourceUri: cacheFileUri,
      recipeName: recName,
      error,
    });
    return '';
  }
}

/**
 * Initializes the file system directories
 *
 * Creates necessary directories for the app's permanent storage and cache.
 * This function should be called during app startup before any file operations.
 *
 * @example
 * ```typescript
 * init();
 * console.log('File system initialized');
 * ```
 */
export function init(): void {
  fileSystemLogger.info('Initializing file system', {
    directoryUri: APP_DIR.uri,
    cacheUri: APP_CACHE.uri,
  });
  try {
    if (!APP_DIR.exists) {
      APP_DIR.create({ intermediates: true });
      fileSystemLogger.info('App directory created', { directory: APP_DIR.uri });
    }
    if (!APP_CACHE.exists) {
      APP_CACHE.create({ intermediates: true });
      fileSystemLogger.info('Cache directory created', { directory: APP_CACHE.uri });
    }
    fileSystemLogger.info('File system initialized successfully');
  } catch (error) {
    fileSystemLogger.error('FileGestion initialization failed', { error });
  }
}

/**
 * Copies dataset recipe images from bundled assets to file system
 *
 * Determines the current dataset type (test or production) and loads the appropriate
 * image assets, then copies them to the app's permanent storage.
 *
 * @example
 * ```typescript
 * await copyDatasetImages();
 * // Copies all test or production images based on NODE_ENV
 * ```
 */
export async function copyDatasetImages(): Promise<void> {
  fileSystemLogger.info('Starting dataset image copy operation', {
    directoryUri: APP_DIR.uri,
  });

  const datasetType = getDatasetType();
  const imageSet = datasetType === 'production' ? productionRecipesImages : testRecipesImages;

  fileSystemLogger.info('Selected image set based on dataset type', {
    datasetType,
    imageCount: imageSet.length,
  });

  try {
    // Download + copy the image set in chunks, yielding to the event loop
    // between chunks. This bounds peak asset-download concurrency and stops the
    // 1200-image copy from monopolising the JS thread during first launch.
    let loadedCount = 0;

    await forEachChunk(imageSet, async chunk => {
      // Force download of each asset to ensure it exists on local storage.
      // expo-asset may mark bundled Android images as "downloaded" without
      // extracting them to the file system — resetting the flag ensures the
      // native module copies each asset from APK resources to cache.
      const assetModules = (
        await Promise.all(
          chunk.map(async moduleId => {
            try {
              const asset = Asset.fromModule(moduleId);
              asset.downloaded = false;

              await asset.downloadAsync();
              return asset;
            } catch (err) {
              fileSystemLogger.warn('Failed to load individual asset', { moduleId, error: err });
              return null;
            }
          })
        )
      ).filter((asset): asset is Asset => asset !== null);

      loadedCount += assetModules.length;

      await Promise.all(
        assetModules.map(async asset => {
          if (!asset.localUri) {
            fileSystemLogger.warn('Asset missing localUri, skipping', { assetName: asset.name });
            return;
          }

          const destFile = new File(APP_DIR, asset.name + '.' + asset.type);

          if (destFile.exists) {
            fileSystemLogger.debug('Asset file already exists, skipping', {
              assetName: asset.name,
            });
            return;
          }

          try {
            const sourceFile = new File(asset.localUri);
            await sourceFile.copy(destFile);
          } catch (copyError) {
            fileSystemLogger.warn('Failed to copy individual asset file', {
              assetName: asset.name,
              error: copyError,
            });
          }
        })
      );
    });

    if (loadedCount === 0 && imageSet.length > 0) {
      throw new Error(
        `Failed to load any ${datasetType} assets out of ${imageSet.length}. Check if assets are bundled correctly.`
      );
    }

    fileSystemLogger.info('Dataset images operation completed', {
      datasetType,
      successCount: loadedCount,
    });
  } catch (error) {
    fileSystemLogger.error('Failed to copy dataset images', { datasetType, error });
    throw error;
  }
}

/**
 * Transforms dataset recipe images from bare filenames to full URIs
 *
 * Converts recipe image sources from simple filenames (e.g., 'spaghetti_bolognese.webp')
 * to full file system URIs (e.g., 'file:///documents/Recipedia/spaghetti_bolognese.webp').
 * This is used during dataset initialization to ensure dataset recipes use the same
 * URI format as user-created recipes.
 *
 * @param recipes - Array of recipes with bare filename image sources
 * @returns New array of recipes with transformed image URIs
 *
 * @example
 * ```typescript
 * const dataset = getDataset('en');
 * const transformed = transformDatasetRecipeImages(dataset.recipes);
 * // Recipe with image_Source: 'pasta.png' becomes 'file:///documents/Recipedia/pasta.png'
 * ```
 */
export function transformDatasetRecipeImages<T extends RecipeDraft>(recipes: T[]): T[] {
  return recipes.map(recipe => ({
    ...recipe,
    image_Source: APP_DIR.uri + recipe.image_Source,
  }));
}
