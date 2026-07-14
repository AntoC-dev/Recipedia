import {
  cleanupOrphanedImages,
  clearCache,
  constructImageUri,
  copyDatasetImages,
  deleteFile,
  downloadImageToCache,
  extractFilenameFromUri,
  init,
  isTemporaryImageUri,
  saveRecipeImage,
  transformDatasetRecipeImages,
} from '@utils/FileGestion';
import {
  mockDirectoryCreate,
  mockDirectoryDelete,
  mockDirectoryExists,
  mockDirectoryList,
  mockFileCopy,
  mockFileDelete,
  mockFileDownloadFileAsync,
  mockFileExists,
} from '@mocks/deps/expo-file-system-mock';
import { mockAssetFromModule } from '@mocks/deps/expo-asset-mock';
import ImageCropPicker from 'react-native-image-crop-picker';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { setMockDatasetType } from '@mocks/utils/DatasetLoader-mock';

jest.unmock('@utils/FileGestion');

jest.mock('expo-file-system', () =>
  require('@mocks/deps/expo-file-system-mock').expoFileSystemMock()
);

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

jest.mock('expo-asset', () => require('@mocks/deps/expo-asset-mock').expoAssetMock());

jest.mock('@app/package.json', () => require('@mocks/app/package-json-mock').packageJsonMock());

jest.mock('@utils/Constants', () => require('@mocks/utils/Constants-mock').constantsMock());

jest.mock('@utils/DatasetLoader', () => require('@mocks/utils/DatasetLoader-mock'));

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));

describe('FileGestion Utility', () => {
  const defaultDocumentsPath = '/documents/Test Recipedia/';
  const defaultCachePath = '/cache/Test Recipedia/';
  const mockUUID = '00000000-0000-0000-0000-000000000000';

  const mockClean = ImageCropPicker.clean as jest.Mock;

  const resetAllMocks = () => {
    jest.clearAllMocks();
    mockFileExists.mockReset().mockReturnValue(false);
    mockFileDelete.mockReset();
    mockFileCopy.mockReset();
    mockFileDownloadFileAsync.mockReset();
    mockDirectoryExists.mockReset().mockReturnValue(false);
    mockDirectoryDelete.mockReset();
    mockDirectoryCreate.mockReset();
    mockDirectoryList.mockReset().mockReturnValue([]);
    mockClean.mockReset().mockResolvedValue(undefined);
    mockAssetFromModule.mockReset();
    const Crypto = require('expo-crypto');
    Crypto.randomUUID.mockReturnValue(mockUUID);
  };

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    resetAllMocks();
  });

  test('constructImageUri prepends app directory to filename', () => {
    expect(constructImageUri('recipe.jpg')).toBe(defaultDocumentsPath + 'recipe.jpg');
  });

  test('constructImageUri does not produce double slashes', () => {
    const uri = constructImageUri('recipe.jpg');
    expect(uri).not.toMatch(/\/\//);
  });

  test('extractFilenameFromUri strips app directory prefix', () => {
    expect(extractFilenameFromUri(defaultDocumentsPath + 'recipe.jpg')).toBe('recipe.jpg');
  });

  test('extractFilenameFromUri returns input unchanged when prefix does not match', () => {
    expect(extractFilenameFromUri('/other/path/recipe.jpg')).toBe('/other/path/recipe.jpg');
  });

  test('extractFilenameFromUri and constructImageUri are inverses', () => {
    const filename = 'pasta_abc123.jpg';
    const uri = constructImageUri(filename);
    expect(extractFilenameFromUri(uri)).toBe(filename);
  });

  test('creates both directories when they do not exist during initialization', () => {
    mockDirectoryExists.mockReturnValue(false);

    init();

    expect(mockDirectoryCreate).toHaveBeenCalledWith(expect.stringContaining('Test Recipedia'), {
      intermediates: true,
    });
    expect(mockDirectoryCreate).toHaveBeenCalledTimes(2);
  });

  test('skips directory creation when directories already exist', () => {
    mockDirectoryExists.mockReturnValue(true);

    init();

    expect(mockDirectoryCreate).not.toHaveBeenCalled();
  });

  test('creates only missing directories during initialization', () => {
    mockDirectoryExists.mockReturnValueOnce(true).mockReturnValueOnce(false);

    init();

    expect(mockDirectoryCreate).toHaveBeenCalledTimes(1);
    expect(mockDirectoryCreate).toHaveBeenCalledWith(
      expect.stringContaining('/cache/Test Recipedia'),
      { intermediates: true }
    );
  });

  test('init does not copy images', () => {
    mockDirectoryExists.mockReturnValue(false);

    init();

    expect(mockAssetFromModule).not.toHaveBeenCalled();
    expect(mockFileCopy).not.toHaveBeenCalled();
  });

  test('saves recipe image with proper naming and file operations', () => {
    const sourceUri = '/temp/recipe-photo.jpg';
    const recipeName = 'Chocolate Cake';
    const expectedImageName = 'chocolate_cake_' + mockUUID + '.jpg';
    const expectedDestination = defaultDocumentsPath + expectedImageName;

    mockFileExists.mockReturnValue(false);

    const result = saveRecipeImage(sourceUri, recipeName);

    expect(result).toBe(expectedDestination);
    expect(mockFileCopy).toHaveBeenCalledWith(
      sourceUri,
      expect.objectContaining({ uri: expectedDestination })
    );
    expect(mockFileCopy).toHaveBeenCalledTimes(1);
  });

  test('sanitizes recipe names correctly for filename generation', () => {
    const testCases = [
      {
        input: 'Simple Recipe',
        expected: defaultDocumentsPath + 'simple_recipe_' + mockUUID + '.jpg',
      },
      {
        input: 'Recipe with Special@#$%Characters',
        expected: defaultDocumentsPath + 'recipe_with_special_characters_' + mockUUID + '.jpg',
      },
      {
        input: '   Spaced   Recipe   ',
        expected: defaultDocumentsPath + 'spaced_recipe_' + mockUUID + '.jpg',
      },
      {
        input: 'Recipe/With\\Slashes',
        expected: defaultDocumentsPath + 'recipe_with_slashes_' + mockUUID + '.jpg',
      },
      {
        input: 'Recipe:With;Colons,And<More>',
        expected: defaultDocumentsPath + 'recipe_with_colons_and_more_' + mockUUID + '.jpg',
      },
    ];

    mockFileExists.mockReturnValue(false);

    for (const { input, expected } of testCases) {
      const result = saveRecipeImage('/temp/test.jpg', input);
      expect(result).toBe(expected);
      jest.clearAllMocks();
    }
  });

  test('clears cache directory contents and calls ImageCropPicker.clean', () => {
    const mockItem1 = { delete: jest.fn() };
    const mockItem2 = { delete: jest.fn() };
    mockDirectoryExists.mockReturnValue(true);
    mockDirectoryList.mockReturnValue([mockItem1, mockItem2]);

    clearCache();

    expect(mockDirectoryList).toHaveBeenCalledWith(
      expect.stringContaining('/cache/Test Recipedia')
    );
    expect(mockItem1.delete).toHaveBeenCalledTimes(1);
    expect(mockItem2.delete).toHaveBeenCalledTimes(1);
    expect(mockClean).toHaveBeenCalledTimes(1);
  });

  test('handles file system errors gracefully during initialization', () => {
    mockDirectoryExists.mockImplementation(() => {
      throw new Error('File system error');
    });

    expect(() => init()).not.toThrow();
  });

  test('handles errors during image saving operations', () => {
    mockFileExists.mockReturnValue(false);
    mockFileCopy.mockImplementation(() => {
      throw new Error('Move operation failed');
    });

    const result = saveRecipeImage('/temp/failing-image.jpg', 'Test Recipe');

    expect(result).toBe('');
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/temp/failing-image.jpg',
      expect.objectContaining({ uri: defaultDocumentsPath + 'test_recipe_' + mockUUID + '.jpg' })
    );
  });

  test('handles errors during cache clearing operations', () => {
    mockDirectoryExists.mockReturnValue(true);
    mockDirectoryList.mockImplementation(() => {
      throw new Error('List failed');
    });

    expect(() => clearCache()).not.toThrow();
    expect(mockClean).toHaveBeenCalledTimes(1);
  });

  test('handles errors from ImageCropPicker.clean', () => {
    mockDirectoryExists.mockReturnValue(false);
    mockClean.mockRejectedValue(new Error('Clean failed'));

    clearCache();

    expect(mockClean).toHaveBeenCalledTimes(1);
  });

  test('skips listing when cache directory does not exist', () => {
    mockDirectoryExists.mockReturnValue(false);

    clearCache();

    expect(mockDirectoryList).not.toHaveBeenCalled();
    expect(mockClean).toHaveBeenCalledTimes(1);
  });

  test('maintains consistent directory structure across operations', () => {
    mockDirectoryExists.mockReturnValue(false);
    mockFileExists.mockReturnValue(false);

    init();

    mockDirectoryExists.mockReturnValue(true);
    saveRecipeImage('/temp/test.jpg', 'Test Recipe');
    clearCache();

    expect(constructImageUri('test.jpg')).toBe(defaultDocumentsPath + 'test.jpg');
    expect(mockDirectoryCreate).toHaveBeenCalledWith(expect.stringContaining('Test Recipedia'), {
      intermediates: true,
    });
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/temp/test.jpg',
      expect.objectContaining({ uri: defaultDocumentsPath + 'test_recipe_' + mockUUID + '.jpg' })
    );
  });

  test('handles concurrent operations safely', () => {
    mockDirectoryExists.mockReturnValue(false);
    mockFileExists.mockReturnValue(false);

    init();
    const result1 = saveRecipeImage('/temp/image1.jpg', 'Recipe 1');
    const result2 = saveRecipeImage('/temp/image2.jpg', 'Recipe 2');

    expect(result1).toBe(defaultDocumentsPath + 'recipe_1_' + mockUUID + '.jpg');
    expect(result2).toBe(defaultDocumentsPath + 'recipe_2_' + mockUUID + '.jpg');
    expect(mockFileCopy).toHaveBeenCalledTimes(2);
  });

  test('handles edge cases in recipe name sanitization', () => {
    const edgeCases = [
      { input: '', expected: defaultDocumentsPath + '_' + mockUUID + '.jpg' },
      { input: '   ', expected: defaultDocumentsPath + '_' + mockUUID + '.jpg' },
      { input: '!@#$%^&*()', expected: defaultDocumentsPath + '_' + mockUUID + '.jpg' },
      {
        input: 'Recipe.with.dots',
        expected: defaultDocumentsPath + 'recipe_with_dots_' + mockUUID + '.jpg',
      },
      {
        input: 'Recipe\nwith\nnewlines',
        expected: defaultDocumentsPath + 'recipe_with_newlines_' + mockUUID + '.jpg',
      },
      {
        input: 'Recipe\twith\ttabs',
        expected: defaultDocumentsPath + 'recipe_with_tabs_' + mockUUID + '.jpg',
      },
    ];

    mockFileExists.mockReturnValue(false);

    for (const { input, expected } of edgeCases) {
      const result = saveRecipeImage('/temp/test.jpg', input);
      expect(result).toBe(expected);
      jest.clearAllMocks();
    }
  });

  test('deleteFile deletes the file when it exists', () => {
    mockFileExists.mockReturnValue(true);

    deleteFile('/documents/Test Recipedia/old_image.jpg');

    expect(mockFileExists).toHaveBeenCalledWith('/documents/Test Recipedia/old_image.jpg');
    expect(mockFileDelete).toHaveBeenCalledWith('/documents/Test Recipedia/old_image.jpg');
  });

  test('deleteFile does not call delete when file does not exist', () => {
    mockFileExists.mockReturnValue(false);

    deleteFile('/documents/Test Recipedia/old_image.jpg');

    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('deleteFile swallows errors gracefully', () => {
    mockFileExists.mockReturnValue(true);
    mockFileDelete.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    expect(() => deleteFile('/documents/Test Recipedia/old_image.jpg')).not.toThrow();
  });

  test('saveRecipeImage calls Crypto.randomUUID for unique filename', () => {
    mockFileExists.mockReturnValue(false);
    const Crypto = require('expo-crypto');

    saveRecipeImage('/temp/image.jpg', 'My Recipe');

    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  test('saveRecipeImage attempts source cleanup after copy', () => {
    saveRecipeImage('/temp/image.jpg', 'My Recipe');

    const copyCallOrder = mockFileCopy.mock.invocationCallOrder[0];
    const deleteCallOrder = mockFileDelete.mock.invocationCallOrder[0];
    expect(copyCallOrder).toBeLessThan(deleteCallOrder);
  });

  test('saveRecipeImage succeeds even when source delete fails', () => {
    mockFileDelete.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = saveRecipeImage('/temp/image.jpg', 'My Recipe');

    expect(result).not.toBe('');
    expect(mockFileCopy).toHaveBeenCalledTimes(1);
  });

  test('saveRecipeImage catches Crypto.randomUUID errors and returns empty string', () => {
    const Crypto = require('expo-crypto');
    Crypto.randomUUID.mockImplementation(() => {
      throw new Error('crypto not available');
    });

    const result = saveRecipeImage('/temp/image.jpg', 'My Recipe');

    expect(result).toBe('');
    expect(mockFileCopy).not.toHaveBeenCalled();
  });

  test('saveRecipeImage preserves original file extension', () => {
    mockFileExists.mockReturnValue(false);

    const pngResult = saveRecipeImage('/temp/photo.png', 'Recipe');
    expect(pngResult).toMatch(/\.png$/);
    jest.clearAllMocks();
    mockFileExists.mockReturnValue(false);

    const webpResult = saveRecipeImage('/temp/photo.webp', 'Recipe');
    expect(webpResult).toMatch(/\.webp$/);
  });

  test('saveRecipeImage strips query string from extension', () => {
    mockFileExists.mockReturnValue(false);

    const result = saveRecipeImage('/temp/photo.jpg?v=123', 'Recipe');

    expect(result).toMatch(/\.jpg$/);
  });

  test('saveRecipeImage defaults to jpg when extension is empty', () => {
    mockFileExists.mockReturnValue(false);

    const result = saveRecipeImage('/temp/file.', 'Recipe');

    expect(result).toMatch(/\.jpg$/);
  });

  describe('downloadImageToCache', () => {
    test('returns empty string when URL is empty', async () => {
      const result = await downloadImageToCache('');
      expect(result).toBe('');
      expect(mockFileDownloadFileAsync).not.toHaveBeenCalled();
    });

    test('downloads image and returns local URI', async () => {
      const mockDownloadedFile = { uri: defaultCachePath + 'scraped_123.jpg' };
      mockFileDownloadFileAsync.mockResolvedValue(mockDownloadedFile);

      const result = await downloadImageToCache('https://example.com/image.jpg');

      expect(result).toBe(mockDownloadedFile.uri);
      expect(mockFileDownloadFileAsync).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({ uri: expect.stringContaining('scraped_') }),
        expect.objectContaining({
          headers: expect.any(Object),
          idempotent: true,
        })
      );
    });

    test('returns empty string on download failure', async () => {
      mockFileDownloadFileAsync.mockRejectedValue(new Error('Network error'));

      const result = await downloadImageToCache('https://example.com/image.jpg');

      expect(result).toBe('');
    });

    test('extracts correct file extension from URL', async () => {
      mockFileDownloadFileAsync.mockResolvedValue({ uri: '/cache/scraped_123.png' });

      await downloadImageToCache('https://example.com/photo.png');

      expect(mockFileDownloadFileAsync).toHaveBeenCalledWith(
        'https://example.com/photo.png',
        expect.objectContaining({ uri: expect.stringMatching(/\.png$/) }),
        expect.any(Object)
      );
    });

    test('strips query string when extracting extension', async () => {
      mockFileDownloadFileAsync.mockResolvedValue({ uri: '/cache/scraped_123.webp' });

      await downloadImageToCache('https://example.com/photo.webp?w=800&h=600');

      expect(mockFileDownloadFileAsync).toHaveBeenCalledWith(
        'https://example.com/photo.webp?w=800&h=600',
        expect.objectContaining({ uri: expect.stringMatching(/\.webp$/) }),
        expect.any(Object)
      );
    });

    test('defaults to jpg when URL has no recognized extension', async () => {
      mockFileDownloadFileAsync.mockResolvedValue({ uri: '/cache/scraped_123.jpg' });

      await downloadImageToCache('https://example.com/image');

      expect(mockFileDownloadFileAsync).toHaveBeenCalledWith(
        'https://example.com/image',
        expect.objectContaining({ uri: expect.stringMatching(/\.jpg$/) }),
        expect.any(Object)
      );
    });

    test('recognizes jpeg extension', async () => {
      mockFileDownloadFileAsync.mockResolvedValue({ uri: '/cache/scraped_123.jpeg' });

      await downloadImageToCache('https://example.com/photo.jpeg');

      expect(mockFileDownloadFileAsync).toHaveBeenCalledWith(
        'https://example.com/photo.jpeg',
        expect.objectContaining({ uri: expect.stringMatching(/\.jpeg$/) }),
        expect.any(Object)
      );
    });

    test('recognizes gif extension', async () => {
      mockFileDownloadFileAsync.mockResolvedValue({ uri: '/cache/scraped_123.gif' });

      await downloadImageToCache('https://example.com/animation.gif');

      expect(mockFileDownloadFileAsync).toHaveBeenCalledWith(
        'https://example.com/animation.gif',
        expect.objectContaining({ uri: expect.stringMatching(/\.gif$/) }),
        expect.any(Object)
      );
    });
  });

  describe('init edge cases', () => {
    test('handles create throwing an error', () => {
      mockDirectoryExists.mockReturnValue(false);
      mockDirectoryCreate.mockImplementation(() => {
        throw new Error('Cannot create directory');
      });

      expect(() => init()).not.toThrow();
    });
  });
});

describe('isTemporaryImageUri', () => {
  const defaultDocumentsPath = '/documents/Test Recipedia/';

  test('returns true for temporary URIs', () => {
    expect(isTemporaryImageUri('/cache/ImageManipulator/temp.jpg')).toBe(true);
    expect(isTemporaryImageUri('/cache/ExperienceData/camera.jpg')).toBe(true);
    expect(isTemporaryImageUri('/tmp/random.png')).toBe(true);
  });

  test('returns false for permanent storage URIs', () => {
    expect(isTemporaryImageUri(defaultDocumentsPath + 'recipe.jpg')).toBe(false);
    expect(isTemporaryImageUri(defaultDocumentsPath + 'pasta.webp')).toBe(false);
  });
});

describe('copyDatasetImages', () => {
  const defaultDocumentsPath = '/documents/Test Recipedia/';

  const createMockAsset = (name: string, type: string, localUri: string) => ({
    name,
    type,
    localUri,
    downloaded: true,
    downloadAsync: jest.fn().mockResolvedValue(undefined),
  });

  const setupFromModuleSequence = (assets: ReturnType<typeof createMockAsset>[]) => {
    assets.forEach(asset => mockAssetFromModule.mockReturnValueOnce(asset));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileExists.mockReset().mockReturnValue(false);
    mockFileCopy.mockReset();
    mockAssetFromModule.mockReset();
  });

  test('copies test dataset images via fromModule + copy', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      createMockAsset('image1', 'jpg', '/asset/path/image1.jpg'),
      createMockAsset('image2', 'jpg', '/asset/path/image2.jpg'),
      createMockAsset('image3', 'jpg', '/asset/path/image3.jpg'),
    ];
    setupFromModuleSequence(mockAssets);

    await copyDatasetImages();

    expect(mockAssetFromModule).toHaveBeenCalledTimes(3);
    expect(mockFileCopy).toHaveBeenCalledTimes(3);
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/asset/path/image1.jpg',
      expect.objectContaining({ uri: defaultDocumentsPath + 'image1.jpg' })
    );
  });

  test('copies production dataset images', async () => {
    setMockDatasetType('production');
    const { productionRecipesImages } = require('@utils/Constants');

    const mockAssets = [
      createMockAsset('spaghetti_bolognaise', 'webp', '/asset/path/spaghetti_bolognaise.webp'),
      createMockAsset('soupe_legumes_hiver', 'webp', '/asset/path/soupe_legumes_hiver.webp'),
      createMockAsset('curry_lentilles_corail', 'webp', '/asset/path/curry_lentilles_corail.webp'),
    ];
    setupFromModuleSequence(mockAssets);

    await copyDatasetImages();

    expect(mockAssetFromModule).toHaveBeenCalledTimes(productionRecipesImages.length);
    expect(mockFileCopy).toHaveBeenCalledTimes(3);
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/asset/path/spaghetti_bolognaise.webp',
      expect.objectContaining({ uri: defaultDocumentsPath + 'spaghetti_bolognaise.webp' })
    );
  });

  test('skips copying images that already exist at destination', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      createMockAsset('image1', 'jpg', '/asset/path/image1.jpg'),
      createMockAsset('image2', 'jpg', '/asset/path/image2.jpg'),
      createMockAsset('image3', 'jpg', '/asset/path/image3.jpg'),
    ];
    setupFromModuleSequence(mockAssets);
    mockFileExists.mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(true);

    await copyDatasetImages();

    expect(mockFileCopy).toHaveBeenCalledTimes(1);
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/asset/path/image2.jpg',
      expect.objectContaining({ uri: defaultDocumentsPath + 'image2.jpg' })
    );
  });

  test('throws error when all assets fail to download', async () => {
    setMockDatasetType('test');
    const failingAsset = createMockAsset('image1', 'jpg', '/asset/path/image1.jpg');
    failingAsset.downloadAsync.mockRejectedValue(new Error('Download failed'));
    mockAssetFromModule.mockReturnValue(failingAsset);

    await expect(copyDatasetImages()).rejects.toThrow('Failed to load any test assets');
  });

  test('continues when some assets fail to download', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      createMockAsset('image1', 'jpg', '/asset/path/image1.jpg'),
      createMockAsset('image2', 'jpg', '/asset/path/image2.jpg'),
    ];
    // Make first one fail
    mockAssets[0].downloadAsync.mockRejectedValue(new Error('Download failed'));

    mockAssetFromModule
      .mockReturnValueOnce(mockAssets[0])
      .mockReturnValueOnce(mockAssets[1])
      .mockReturnValueOnce(mockAssets[1]); // imageSet has 3 items in test constants

    await copyDatasetImages();

    expect(mockFileCopy).toHaveBeenCalledTimes(2);
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/asset/path/image2.jpg',
      expect.objectContaining({ uri: expect.stringContaining('image2.jpg') })
    );
  });

  test('resets downloaded flag before calling downloadAsync', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      createMockAsset('image1', 'jpg', '/asset/path/image1.jpg'),
      createMockAsset('image2', 'jpg', '/asset/path/image2.jpg'),
      createMockAsset('image3', 'jpg', '/asset/path/image3.jpg'),
    ];
    setupFromModuleSequence(mockAssets);

    await copyDatasetImages();

    mockAssets.forEach(asset => {
      expect(asset.downloaded).toBe(false);
      expect(asset.downloadAsync).toHaveBeenCalledTimes(1);
    });
  });

  test('skips assets that resolve without a localUri', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      createMockAsset('image1', 'jpg', ''),
      createMockAsset('image2', 'jpg', '/asset/path/image2.jpg'),
    ];
    setupFromModuleSequence(mockAssets);

    await copyDatasetImages();

    expect(mockFileCopy).toHaveBeenCalledTimes(1);
    expect(mockFileCopy).toHaveBeenCalledWith(
      '/asset/path/image2.jpg',
      expect.objectContaining({ uri: defaultDocumentsPath + 'image2.jpg' })
    );
  });

  test('continues when copying an individual asset file throws', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      createMockAsset('image1', 'jpg', '/asset/path/image1.jpg'),
      createMockAsset('image2', 'jpg', '/asset/path/image2.jpg'),
    ];
    setupFromModuleSequence(mockAssets);
    mockFileCopy.mockImplementationOnce(() => {
      throw new Error('copy failed');
    });

    await expect(copyDatasetImages()).resolves.toBeUndefined();

    expect(mockFileCopy).toHaveBeenCalledTimes(2);
  });

  test('calls fromModule with each module ID from the image set', async () => {
    setMockDatasetType('test');
    const { testRecipesImages } = require('@utils/Constants');

    const mockAssets = testRecipesImages.map((_: unknown, i: number) =>
      createMockAsset(`image${i}`, 'jpg', `/asset/path/image${i}.jpg`)
    );
    setupFromModuleSequence(mockAssets);

    await copyDatasetImages();

    testRecipesImages.forEach((moduleId: string) => {
      expect(mockAssetFromModule).toHaveBeenCalledWith(moduleId);
    });
  });
});

describe('cleanupOrphanedImages', () => {
  const defaultDocumentsPath = '/documents/Test Recipedia/';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileExists.mockReturnValue(false);
    mockDirectoryList.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns 0 and skips deletion when all directory files are active', async () => {
    const fileUri = defaultDocumentsPath + 'active.jpg';
    mockDirectoryList.mockReturnValue([{ uri: fileUri }]);

    const result = await cleanupOrphanedImages([fileUri]);

    expect(result).toBe(0);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('deletes orphan and returns 1 when one file is not in active set', async () => {
    const orphanUri = defaultDocumentsPath + 'orphan.jpg';
    const activeUri = defaultDocumentsPath + 'active.jpg';
    mockDirectoryList.mockReturnValue([{ uri: orphanUri }, { uri: activeUri }]);
    mockFileExists.mockReturnValue(true);

    const result = await cleanupOrphanedImages([activeUri]);

    expect(result).toBe(1);
    expect(mockFileDelete).toHaveBeenCalledWith(orphanUri);
    expect(mockFileDelete).not.toHaveBeenCalledWith(activeUri);
  });

  test('deletes all files and returns count when active URIs is empty', async () => {
    const file1Uri = defaultDocumentsPath + 'file1.jpg';
    const file2Uri = defaultDocumentsPath + 'file2.jpg';
    const file3Uri = defaultDocumentsPath + 'file3.jpg';
    mockDirectoryList.mockReturnValue([{ uri: file1Uri }, { uri: file2Uri }, { uri: file3Uri }]);
    mockFileExists.mockReturnValue(true);

    const result = await cleanupOrphanedImages([]);

    expect(result).toBe(3);
    expect(mockFileDelete).toHaveBeenCalledTimes(3);
  });

  test('returns 0 when directory is empty', async () => {
    const result = await cleanupOrphanedImages([defaultDocumentsPath + 'file.jpg']);

    expect(result).toBe(0);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('returns 0 and does not crash when directory listing throws', async () => {
    mockDirectoryList.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    const result = await cleanupOrphanedImages([]);

    expect(result).toBe(0);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('strips query params from active URI when matching directory file', async () => {
    const filename = 'image.jpg';
    const fileUri = defaultDocumentsPath + filename;
    const activeUriWithQuery = defaultDocumentsPath + filename + '?v=123';
    mockDirectoryList.mockReturnValue([{ uri: fileUri }]);

    const result = await cleanupOrphanedImages([activeUriWithQuery]);

    expect(result).toBe(0);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('ignores empty strings in active URIs and treats corresponding files as orphans', async () => {
    const orphanUri = defaultDocumentsPath + 'orphan.jpg';
    mockDirectoryList.mockReturnValue([{ uri: orphanUri }]);
    mockFileExists.mockReturnValue(true);

    const result = await cleanupOrphanedImages(['']);

    expect(result).toBe(1);
    expect(mockFileDelete).toHaveBeenCalledWith(orphanUri);
  });

  test('ignores temporary active URIs and treats files with the same name as orphans', async () => {
    const filename = 'image.jpg';
    const permanentFileUri = defaultDocumentsPath + filename;
    const temporaryActiveUri = '/cache/ImageManipulator/' + filename;
    mockDirectoryList.mockReturnValue([{ uri: permanentFileUri }]);
    mockFileExists.mockReturnValue(true);

    const result = await cleanupOrphanedImages([temporaryActiveUri]);

    expect(result).toBe(1);
    expect(mockFileDelete).toHaveBeenCalledWith(permanentFileUri);
  });

  test('returns correct count for multiple orphans among mixed files', async () => {
    mockDirectoryList.mockReturnValue([
      { uri: defaultDocumentsPath + 'orphan1.jpg' },
      { uri: defaultDocumentsPath + 'orphan2.jpg' },
      { uri: defaultDocumentsPath + 'active.jpg' },
      { uri: defaultDocumentsPath + 'orphan3.jpg' },
    ]);
    mockFileExists.mockReturnValue(true);

    const result = await cleanupOrphanedImages([defaultDocumentsPath + 'active.jpg']);

    expect(result).toBe(3);
  });

  test('does not protect files when active URI has only a directory path with no filename', async () => {
    const fileUri = defaultDocumentsPath + 'image.jpg';
    const directoryUri = defaultDocumentsPath;
    mockDirectoryList.mockReturnValue([{ uri: fileUri }]);
    mockFileExists.mockReturnValue(true);

    const result = await cleanupOrphanedImages([directoryUri]);

    expect(result).toBe(1);
  });

  test('counts orphan even when file does not physically exist on disk', async () => {
    const orphanUri = defaultDocumentsPath + 'ghost.jpg';
    mockDirectoryList.mockReturnValue([{ uri: orphanUri }]);
    mockFileExists.mockReturnValue(false);

    const result = await cleanupOrphanedImages([]);

    expect(result).toBe(1);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('deduplicates active URIs so the same URI listed twice still protects the file', async () => {
    const activeUri = defaultDocumentsPath + 'active.jpg';
    mockDirectoryList.mockReturnValue([{ uri: activeUri }]);

    const result = await cleanupOrphanedImages([activeUri, activeUri]);

    expect(result).toBe(0);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });

  test('continues cleanup when one file deletion throws', async () => {
    const orphan1 = defaultDocumentsPath + 'orphan1.jpg';
    const orphan2 = defaultDocumentsPath + 'orphan2.jpg';
    mockDirectoryList.mockReturnValue([{ uri: orphan1 }, { uri: orphan2 }]);
    mockFileExists.mockReturnValue(true);
    mockFileDelete
      .mockImplementationOnce(() => {
        throw new Error('Disk full');
      })
      .mockImplementationOnce(() => {});

    const result = await cleanupOrphanedImages([]);

    expect(result).toBe(2);
    expect(mockFileDelete).toHaveBeenCalledTimes(2);
  });

  test('strips multiple query params from active URI', async () => {
    const fileUri = defaultDocumentsPath + 'photo.jpg';
    const activeWithMultipleParams = defaultDocumentsPath + 'photo.jpg?v=2&w=100&h=200';
    mockDirectoryList.mockReturnValue([{ uri: fileUri }]);

    const result = await cleanupOrphanedImages([activeWithMultipleParams]);

    expect(result).toBe(0);
    expect(mockFileDelete).not.toHaveBeenCalled();
  });
});

describe('transformDatasetRecipeImages', () => {
  const defaultDocumentsPath = '/documents/Test Recipedia/';

  test('transforms bare filename to full URI', () => {
    const recipes: recipeTableElement[] = [
      {
        id: 1,
        title: 'Spaghetti Bolognese',
        description: 'A classic Italian pasta dish',
        image_Source: 'spaghetti_bolognese.webp',
        preparation: [],
        ingredients: [],
        tags: [],
        season: [],
        time: 30,
        persons: 4,
      },
    ];

    const result = transformDatasetRecipeImages(recipes);

    expect(result[0].image_Source).toBe(defaultDocumentsPath + 'spaghetti_bolognese.webp');
  });

  test('transforms multiple recipes', () => {
    const recipes: recipeTableElement[] = [
      {
        id: 1,
        title: 'Recipe 1',
        description: 'First recipe',
        image_Source: 'image1.png',
        preparation: [],
        ingredients: [],
        tags: [],
        season: [],
        time: 20,
        persons: 4,
      },
      {
        id: 2,
        title: 'Recipe 2',
        description: 'Second recipe',
        image_Source: 'image2.jpg',
        preparation: [],
        ingredients: [],
        tags: [],
        season: [],
        time: 15,
        persons: 2,
      },
    ];

    const result = transformDatasetRecipeImages(recipes);

    expect(result[0].image_Source).toBe(defaultDocumentsPath + 'image1.png');
    expect(result[1].image_Source).toBe(defaultDocumentsPath + 'image2.jpg');
  });

  test('preserves all other recipe properties', () => {
    const recipes: recipeTableElement[] = [
      {
        id: 1,
        title: 'Test Recipe',
        description: 'Test description',
        image_Source: 'test.png',
        preparation: [{ title: 'Step 1', description: 'Test step' }],
        ingredients: [],
        tags: [{ id: 1, name: 'Test Tag' }],
        season: ['1', '2', '3'],
        time: 45,
        nutrition: {
          energyKcal: 200,
          energyKj: 840,
          fat: 5,
          saturatedFat: 2,
          carbohydrates: 30,
          sugars: 5,
          fiber: 3,
          protein: 10,
          salt: 1,
          portionWeight: 100,
        },
        persons: 4,
      },
    ];

    const result = transformDatasetRecipeImages(recipes);

    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe('Test Recipe');
    expect(result[0].description).toBe('Test description');
    expect(result[0].preparation).toEqual([{ title: 'Step 1', description: 'Test step' }]);
    expect(result[0].tags).toEqual([{ id: 1, name: 'Test Tag' }]);
    expect(result[0].season).toEqual(['1', '2', '3']);
    expect(result[0].time).toBe(45);
    expect(result[0].nutrition).toEqual({
      energyKcal: 200,
      energyKj: 840,
      fat: 5,
      saturatedFat: 2,
      carbohydrates: 30,
      sugars: 5,
      fiber: 3,
      protein: 10,
      salt: 1,
      portionWeight: 100,
    });
    expect(result[0].persons).toBe(4);
  });

  test('handles empty array', () => {
    const result = transformDatasetRecipeImages([]);

    expect(result).toEqual([]);
  });

  test('handles empty image_Source', () => {
    const recipes: recipeTableElement[] = [
      {
        id: 1,
        title: 'Recipe without image',
        description: 'Recipe without an image',
        image_Source: '',
        preparation: [],
        ingredients: [],
        tags: [],
        season: [],
        time: 10,
        persons: 4,
      },
    ];

    const result = transformDatasetRecipeImages(recipes);

    expect(result[0].image_Source).toBe(defaultDocumentsPath);
  });

  test('does not mutate original recipes array', () => {
    const recipes: recipeTableElement[] = [
      {
        id: 1,
        title: 'Test Recipe',
        description: 'Test description',
        image_Source: 'test.png',
        preparation: [],
        ingredients: [],
        tags: [],
        season: [],
        time: 25,
        persons: 4,
      },
    ];

    const originalImageSource = recipes[0].image_Source;
    transformDatasetRecipeImages(recipes);

    expect(recipes[0].image_Source).toBe(originalImageSource);
  });
});
