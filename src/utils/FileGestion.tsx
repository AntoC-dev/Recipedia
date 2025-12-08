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
 * - Image Manipulator Cache: `/cache/ImageManipulator/` - Image processing temp files
 * - Camera Cache: `/cache/ExperienceData/` - Camera temp files
 *
 * @example
 * ```typescript
 * import { init, saveRecipeImage, clearCache } from '@utils/FileGestion';
 *
 * await init();
 *
 * // Save a recipe image
 * const imageName = await saveRecipeImage(tempUri, "Chocolate Cake");
 *
 * // Clear cache
 * await clearCache();
 * ```
 */

import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import pkg from '@app/package.json';
import { productionRecipesImages, testRecipesImages } from '@utils/Constants';
import { getDatasetType } from '@utils/DatasetLoader';
import { fileSystemLogger } from '@utils/logger';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

const DIRECTORY_NAME = Constants.expoConfig?.name || pkg.name;
const DIRECTORY_URI = FileSystem.documentDirectory + DIRECTORY_NAME + '/';
const CACHE_URI = FileSystem.cacheDirectory + DIRECTORY_NAME + '/';
const IMANGE_MANIPULATOR_CACHE_URI = FileSystem.cacheDirectory + 'ImageManipulator/';
const CAMERA_CACHE_URI = FileSystem.cacheDirectory + 'ExperienceData/';

/**
 * Gets the main app directory URI for permanent storage
 *
 * @returns URI path to the main app directory
 */
export function getDirectoryUri(): string {
  return DIRECTORY_URI;
}

/**
 * Gets the app cache directory URI for temporary storage
 *
 * @returns URI path to the app cache directory
 */
export function getCacheUri(): string {
  return CACHE_URI;
}

/**
 * Clears all cache directories
 *
 * Removes and recreates the image manipulator cache and camera cache directories.
 * Used for freeing up storage space and clearing temporary files.
 *
 * @example
 * ```typescript
 * await clearCache();
 * console.log('Cache cleared successfully');
 * ```
 */
export async function clearCache(): Promise<void> {
  fileSystemLogger.info('Clearing cache directories');
  try {
    await FileSystem.deleteAsync(IMANGE_MANIPULATOR_CACHE_URI);
    await FileSystem.makeDirectoryAsync(IMANGE_MANIPULATOR_CACHE_URI);
  } catch (error) {
    fileSystemLogger.warn('Failed to clear image manipulator cache', {
      cacheUri: IMANGE_MANIPULATOR_CACHE_URI,
      error,
    });
  }
  try {
    await FileSystem.deleteAsync(CAMERA_CACHE_URI);
    await FileSystem.makeDirectoryAsync(CAMERA_CACHE_URI);
  } catch (error) {
    fileSystemLogger.warn('Failed to clear camera cache', {
      cacheUri: CAMERA_CACHE_URI,
      error,
    });
  }
}

/**
 * Moves a file from one location to another
 *
 * Deletes the destination file if it exists, then moves the source file.
 * Useful for relocating files from cache to permanent storage.
 *
 * @param oldUri - Source file URI
 * @param newUri - Destination file URI
 *
 * @example
 * ```typescript
 * await moveFile(
 *   'file:///cache/temp-image.jpg',
 *   'file:///documents/recipe-image.jpg'
 * );
 * ```
 */
export async function moveFile(oldUri: string, newUri: string): Promise<void> {
  try {
    // If needed, remove existing file
    await FileSystem.deleteAsync(newUri, { idempotent: true });
    await FileSystem.moveAsync({ from: oldUri, to: newUri });
  } catch (error) {
    fileSystemLogger.warn('Failed to move file', { from: oldUri, to: newUri, error });
  }
}

/**
 * Copies a file from one location to another
 *
 * Creates a copy of the source file at the destination location.
 * Does not modify or remove the original file.
 *
 * @param oldUri - Source file URI
 * @param newUri - Destination file URI
 *
 * @example
 * ```typescript
 * await copyFile(
 *   'file:///cache/temp-image.jpg',
 *   'file:///documents/recipe-image.jpg'
 * );
 * ```
 */
export async function copyFile(oldUri: string, newUri: string): Promise<void> {
  await FileSystem.copyAsync({ from: oldUri, to: newUri });
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
  const isTemporary = !uri.includes(DIRECTORY_URI);

  fileSystemLogger.debug('Checking if image URI is temporary', {
    imageUri: uri,
    permanentStorageUri: DIRECTORY_URI,
    isTemporary,
    containsCache: uri.includes('cache'),
    containsImageManipulator: uri.includes('ImageManipulator'),
  });

  return isTemporary;
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
    const extension = remoteUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `scraped_${Date.now()}.${extension}`;
    const localUri = CACHE_URI + filename;

    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);

    if (downloadResult.status !== 200) {
      fileSystemLogger.warn('Image download failed with status', {
        status: downloadResult.status,
        remoteUrl,
      });
      return '';
    }

    fileSystemLogger.info('Image downloaded successfully', {
      remoteUrl,
      localUri,
    });

    return downloadResult.uri;
  } catch (error) {
    fileSystemLogger.error('Failed to download image', { remoteUrl, error });
    return '';
  }
}

/**
 * Saves a recipe image from cache to permanent storage
 *
 * Takes a temporary image file and saves it to the main app directory with
 * a standardized naming convention. The recipe name is sanitized and used
 * as the filename with the original file extension preserved.
 *
 * @param cacheFileUri - URI of the temporary image file
 * @param recName - Recipe name to use for the filename
 * @returns Promise resolving to the saved image URI, or empty string if failed
 *
 * @example
 * ```typescript
 * const tempImageUri = "file:///cache/temp-image.jpg";
 * const savedUri = await saveRecipeImage(tempImageUri, "Chocolate Cake");
 * // Returns something like: "file:///documents/Recipedia/chocolate_cake.jpg"
 * ```
 */
export async function saveRecipeImage(cacheFileUri: string, recName: string): Promise<string> {
  fileSystemLogger.info('Starting image save operation', {
    sourceUri: cacheFileUri,
    recipeName: recName,
    permanentStorageDir: DIRECTORY_URI,
  });

  const extension = cacheFileUri.split('.');
  const imgName = recName.replace(/ /g, '_').toLowerCase() + '.' + extension[extension.length - 1];
  const imgUri: string = DIRECTORY_URI + imgName;

  fileSystemLogger.info('Generated filename and destination', {
    originalRecipeName: recName,
    sanitizedFilename: imgName,
    fullDestinationUri: imgUri,
    fileExtension: extension[extension.length - 1],
  });

  try {
    await copyFile(cacheFileUri, imgUri);
    fileSystemLogger.info('Image copied successfully to permanent storage', {
      sourceUri: cacheFileUri,
      destinationUri: imgUri,
      filenameStoredInDb: imgName,
    });
    return imgUri;
  } catch (error) {
    fileSystemLogger.error('Failed to save recipe image', {
      sourceUri: cacheFileUri,
      destinationUri: imgUri,
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
 * await init();
 * console.log('File system initialized');
 * ```
 */
export async function init(): Promise<void> {
  fileSystemLogger.info('Initializing file system', {
    directoryUri: DIRECTORY_URI,
    cacheUri: CACHE_URI,
  });
  try {
    await ensureDirExists(DIRECTORY_URI);
    await ensureDirExists(CACHE_URI);
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
    directoryUri: DIRECTORY_URI,
  });

  const datasetType = getDatasetType();
  const imageSet = datasetType === 'production' ? productionRecipesImages : testRecipesImages;

  fileSystemLogger.info('Selected image set based on dataset type', {
    datasetType,
    imageCount: imageSet.length,
  });

  try {
    const assetModules = await Asset.loadAsync(imageSet);
    if (assetModules.length !== imageSet.length) {
      throw new Error(
        `Failed to load all ${datasetType} assets. Expected ${imageSet.length}, loaded ${assetModules.length}`
      );
    }

    fileSystemLogger.info('Assets loaded successfully', {
      datasetType,
      assetCount: assetModules.length,
    });

    for (const asset of assetModules) {
      const destinationUri = DIRECTORY_URI + asset.name + '.' + asset.type;
      const fileInfo = await FileSystem.getInfoAsync(destinationUri);

      if (fileInfo.exists) {
        fileSystemLogger.debug('Asset file already exists, skipping', {
          assetName: asset.name,
          destinationUri,
        });
        continue;
      }

      await FileSystem.copyAsync({ from: asset.localUri as string, to: destinationUri });
      fileSystemLogger.debug('Asset file copied successfully', {
        assetName: asset.name,
        destinationUri,
      });
    }

    fileSystemLogger.info('Dataset images copied successfully', {
      datasetType,
      imageCount: imageSet.length,
    });
  } catch (error) {
    fileSystemLogger.error('Failed to copy dataset images', {
      datasetType,
      error,
    });
    throw error;
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 *
 * Checks if a directory exists and creates it (including intermediate directories)
 * if it doesn't. Throws an error if the path exists but is not a directory.
 *
 * @param dirUri - URI of the directory to ensure exists
 * @throws Error if the path exists but is not a directory
 */
async function ensureDirExists(dirUri: string): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(dirUri);

  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    fileSystemLogger.info('Directory created', { directory: dirUri });
  } else if (!dirInfo.isDirectory) {
    throw new Error(`${dirUri} exists but is not a directory`);
  } else {
    fileSystemLogger.debug('Directory already exists', { directory: dirUri });
  }
}

/**
 * Transforms dataset recipe images from bare filenames to full URIs
 *
 * Converts recipe image sources from simple filenames (e.g., 'spaghetti_bolognese.png')
 * to full file system URIs (e.g., 'file:///documents/Recipedia/spaghetti_bolognese.png').
 * This is used during dataset initialization to ensure dataset recipes use the same
 * URI format as user-created recipes.
 *
 * @param recipes - Array of recipes with bare filename image sources
 * @param directoryUri - Base directory URI to prepend to filenames
 * @returns New array of recipes with transformed image URIs
 *
 * @example
 * ```typescript
 * const dataset = getDataset('en');
 * const transformed = transformDatasetRecipeImages(
 *   dataset.recipes,
 *   getDirectoryUri()
 * );
 * // Recipe with image_Source: 'pasta.png' becomes 'file:///documents/Recipedia/pasta.png'
 * ```
 */
export function transformDatasetRecipeImages(
  recipes: recipeTableElement[],
  directoryUri: string
): recipeTableElement[] {
  return recipes.map(recipe => ({
    ...recipe,
    image_Source: directoryUri + recipe.image_Source,
  }));
}
