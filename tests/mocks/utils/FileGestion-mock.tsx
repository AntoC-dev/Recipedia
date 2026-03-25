export const extractFilenameFromUri = jest.fn((imageUri: string): string => imageUri);

export const constructImageUri = jest.fn((imageFilename: string): string => imageFilename);

export const mockDownloadImageToCache = jest.fn();

export const isTemporaryImageUri = jest.fn((): boolean => false);

export const cleanupOrphanedImages = jest.fn().mockResolvedValue(0);

export const clearCache = jest.fn().mockResolvedValue(undefined);

export const deleteFile = jest.fn().mockResolvedValue(undefined);

export const saveRecipeImage = jest.fn().mockResolvedValue('/mock/directory/saved_image.jpg');

export const init = jest.fn().mockResolvedValue(undefined);

export const copyDatasetImages = jest.fn().mockResolvedValue(undefined);

export const transformDatasetRecipeImages = jest.fn((recipes: any[]) =>
  recipes.map(recipe => ({
    ...recipe,
  }))
);

export function fileGestionMock() {
  return {
    extractFilenameFromUri,
    constructImageUri,
    isTemporaryImageUri,
    cleanupOrphanedImages,
    clearCache,
    deleteFile,
    saveRecipeImage,
    init,
    copyDatasetImages,
    transformDatasetRecipeImages,
    downloadImageToCache: mockDownloadImageToCache,
  };
}

export function mockDownloadImageToCacheSuccess(path = '/local/path/image.jpg') {
  mockDownloadImageToCache.mockResolvedValue(path);
}

export function mockDownloadImageToCacheFailure() {
  mockDownloadImageToCache.mockResolvedValue(null);
}
