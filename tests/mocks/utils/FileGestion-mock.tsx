const mockDirectoryUri = '';

export const getDirectoryUri = jest.fn().mockReturnValue(mockDirectoryUri);

export const mockDownloadImageToCache = jest.fn();

export const getCacheUri = jest.fn().mockReturnValue('');

export const isTemporaryImageUri = jest.fn().mockImplementation((uri: string): boolean => {
  const directoryUri = getDirectoryUri();
  return !uri.includes(directoryUri);
});

export const clearCache = jest.fn().mockResolvedValue(undefined);

export const moveFile = jest.fn().mockResolvedValue(undefined);

export const copyFile = jest.fn().mockResolvedValue(undefined);

export const saveRecipeImage = jest.fn().mockResolvedValue('/mock/directory/saved_image.jpg');

export const init = jest.fn().mockResolvedValue(undefined);

export const copyDatasetImages = jest.fn().mockResolvedValue(undefined);

export const transformDatasetRecipeImages = jest.fn((recipes: any[], directoryUri: string) =>
  recipes.map(recipe => ({
    ...recipe,
    image_Source: directoryUri + recipe.image_Source,
  }))
);

export function fileGestionMock() {
  return {
    getDirectoryUri,
    getCacheUri,
    isTemporaryImageUri,
    clearCache,
    moveFile,
    copyFile,
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
