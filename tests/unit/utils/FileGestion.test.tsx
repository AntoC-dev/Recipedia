import {
  clearCache,
  copyDatasetImages,
  getCacheUri,
  getDirectoryUri,
  init,
  isTemporaryImageUri,
  saveRecipeImage,
  transformDatasetRecipeImages,
} from '@utils/FileGestion';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
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

describe('FileGestion Utility', () => {
  const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
  const mockMakeDirectoryAsync = FileSystem.makeDirectoryAsync as jest.Mock;
  const mockReadDirectoryAsync = FileSystem.readDirectoryAsync as jest.Mock;
  const mockCopyAsync = FileSystem.copyAsync as jest.Mock;
  const mockDeleteAsync = FileSystem.deleteAsync as jest.Mock;
  const mockWriteAsStringAsync = FileSystem.writeAsStringAsync as jest.Mock;
  const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;
  const mockAssetFromModule = Asset.fromModule as jest.Mock;
  const mockAssetLoadAsync = Asset.loadAsync as jest.Mock;

  const defaultDocumentsPath = '/documents/Test Recipedia/';
  const defaultCachePath = '/cache/Test Recipedia/';

  const mockDirectoryExists = (exists: boolean = false) => {
    mockGetInfoAsync.mockResolvedValue({ exists, isDirectory: exists });
  };

  const mockFileExists = (exists: boolean = false, isDirectory: boolean = false) => {
    mockGetInfoAsync.mockResolvedValue({ exists, isDirectory });
  };

  const assertDirectoryPaths = () => {
    expect(getDirectoryUri()).toBe(defaultDocumentsPath);
    expect(getCacheUri()).toBe(defaultCachePath);
  };

  const resetAllMocks = () => {
    jest.clearAllMocks();
    mockGetInfoAsync.mockReset();
    mockMakeDirectoryAsync.mockReset();
    mockReadDirectoryAsync.mockReset();
    mockCopyAsync.mockReset();
    mockDeleteAsync.mockReset();
    mockWriteAsStringAsync.mockReset();
    mockReadAsStringAsync.mockReset();
    mockAssetFromModule.mockReset();
    mockAssetLoadAsync.mockReset();
  };

  const setupInitializationMocks = (directoryExists: boolean = false) => {
    mockDirectoryExists(directoryExists);
    mockMakeDirectoryAsync.mockResolvedValue(undefined);
  };

  const setupImageSavingMocks = () => {
    mockCopyAsync.mockResolvedValue(undefined);
  };

  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    resetAllMocks();
  });

  test('getDirectoryUri returns correct path', () => {
    expect(getDirectoryUri()).toBe(defaultDocumentsPath);
  });

  test('getCacheUri returns correct path', () => {
    expect(getCacheUri()).toBe(defaultCachePath);
  });

  test('creates main directory when it does not exist during initialization', async () => {
    setupInitializationMocks(false);

    await init();

    expect(mockGetInfoAsync).toHaveBeenCalledWith(defaultDocumentsPath);
    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(defaultDocumentsPath, {
      intermediates: true,
    });
  });

  test('skips directory creation when it already exists', async () => {
    setupInitializationMocks(true);

    await init();

    expect(mockGetInfoAsync).toHaveBeenCalledWith(defaultDocumentsPath);
    expect(mockMakeDirectoryAsync).not.toHaveBeenCalled();
  });

  test('init does not copy images anymore', async () => {
    setupInitializationMocks(false);

    await init();

    expect(mockAssetLoadAsync).not.toHaveBeenCalled();
    expect(mockCopyAsync).not.toHaveBeenCalled();
  });

  test('saves recipe image with proper naming and file operations', async () => {
    const sourceUri = '/temp/recipe-photo.jpg';
    const recipeName = 'Chocolate Cake';
    const expectedImageName = 'chocolate_cake.jpg';
    const expectedDestination = defaultDocumentsPath + expectedImageName;

    setupImageSavingMocks();

    const result = await saveRecipeImage(sourceUri, recipeName);

    expect(result).toBe(expectedDestination);
    expect(mockCopyAsync).toHaveBeenCalledWith({ from: sourceUri, to: expectedDestination });
    expect(mockCopyAsync).toHaveBeenCalledTimes(1);
  });

  test('sanitizes recipe names correctly for filename generation', async () => {
    const testCases = [
      { input: 'Simple Recipe', expected: defaultDocumentsPath + 'simple_recipe.jpg' },
      {
        input: 'Recipe with Special@#$%Characters',
        expected: defaultDocumentsPath + 'recipe_with_special_characters.jpg',
      },
      {
        input: '   Spaced   Recipe   ',
        expected: defaultDocumentsPath + 'spaced_recipe.jpg',
      },
      {
        input: 'Recipe/With\\Slashes',
        expected: defaultDocumentsPath + 'recipe_with_slashes.jpg',
      },
      {
        input: 'Recipe:With;Colons,And<More>',
        expected: defaultDocumentsPath + 'recipe_with_colons_and_more.jpg',
      },
    ];

    setupImageSavingMocks();

    for (const { input, expected } of testCases) {
      const result = await saveRecipeImage('/temp/test.jpg', input);
      expect(result).toBe(expected);
      jest.clearAllMocks();
    }
  });

  test('clears cache directories completely', async () => {
    mockDeleteAsync.mockResolvedValue(undefined);
    mockMakeDirectoryAsync.mockResolvedValue(undefined);

    await clearCache();

    expect(mockDeleteAsync).toHaveBeenCalledWith('/cache/ImageManipulator/');
    expect(mockDeleteAsync).toHaveBeenCalledWith('/cache/ExperienceData/');
    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith('/cache/ImageManipulator/');
    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith('/cache/ExperienceData/');
    expect(mockDeleteAsync).toHaveBeenCalledTimes(2);
    expect(mockMakeDirectoryAsync).toHaveBeenCalledTimes(2);
  });

  test('handles file system errors gracefully during initialization', async () => {
    mockGetInfoAsync.mockRejectedValue(new Error('File system error'));

    await expect(init()).resolves.toBeUndefined();
    expect(mockGetInfoAsync).toHaveBeenCalledWith(defaultDocumentsPath);
  });

  test('handles errors during image saving operations', async () => {
    const sourceUri = '/temp/failing-image.jpg';
    const recipeName = 'Test Recipe';

    mockCopyAsync.mockRejectedValue(new Error('Copy operation failed'));

    const result = await saveRecipeImage(sourceUri, recipeName);
    expect(result).toBe('');
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: sourceUri,
      to: defaultDocumentsPath + 'test_recipe.jpg',
    });
  });

  test('handles errors during cache clearing operations', async () => {
    mockDeleteAsync
      .mockRejectedValueOnce(new Error('Delete failed'))
      .mockResolvedValueOnce(undefined);

    await expect(clearCache()).resolves.toBeUndefined();
    expect(mockDeleteAsync).toHaveBeenCalledTimes(2);
  });

  test('maintains consistent directory structure across operations', async () => {
    setupInitializationMocks(false);
    setupImageSavingMocks();
    mockDeleteAsync.mockResolvedValue(undefined);

    await init();
    await saveRecipeImage('/temp/test.jpg', 'Test Recipe');
    await clearCache();

    assertDirectoryPaths();
    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(defaultDocumentsPath, {
      intermediates: true,
    });
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: '/temp/test.jpg',
      to: defaultDocumentsPath + 'test_recipe.jpg',
    });
    expect(mockDeleteAsync).toHaveBeenCalledWith('/cache/ImageManipulator/');
  });

  test('handles concurrent operations safely', async () => {
    setupInitializationMocks(false);
    setupImageSavingMocks();
    mockFileExists(false);

    const initPromise = init();
    const savePromise1 = saveRecipeImage('/temp/image1.jpg', 'Recipe 1');
    const savePromise2 = saveRecipeImage('/temp/image2.jpg', 'Recipe 2');

    const results = await Promise.all([initPromise, savePromise1, savePromise2]);

    expect(results[1]).toBe(defaultDocumentsPath + 'recipe_1.jpg');
    expect(results[2]).toBe(defaultDocumentsPath + 'recipe_2.jpg');
    expect(mockCopyAsync).toHaveBeenCalledTimes(2);
  });

  test('handles edge cases in recipe name sanitization', async () => {
    const edgeCases = [
      { input: '', expected: defaultDocumentsPath + '.jpg' },
      { input: '   ', expected: defaultDocumentsPath + '.jpg' },
      { input: '!@#$%^&*()', expected: defaultDocumentsPath + '.jpg' },
      { input: 'Recipe.with.dots', expected: defaultDocumentsPath + 'recipe_with_dots.jpg' },
      {
        input: 'Recipe\nwith\nnewlines',
        expected: defaultDocumentsPath + 'recipe_with_newlines.jpg',
      },
      { input: 'Recipe\twith\ttabs', expected: defaultDocumentsPath + 'recipe_with_tabs.jpg' },
    ];

    setupImageSavingMocks();

    for (const { input, expected } of edgeCases) {
      const result = await saveRecipeImage('/temp/test.jpg', input);
      expect(result).toBe(expected);
      jest.clearAllMocks();
    }
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
    expect(isTemporaryImageUri(defaultDocumentsPath + 'pasta.png')).toBe(false);
  });
});

describe('copyDatasetImages', () => {
  const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
  const mockCopyAsync = FileSystem.copyAsync as jest.Mock;
  const mockAssetLoadAsync = Asset.loadAsync as jest.Mock;

  const defaultDocumentsPath = '/documents/Test Recipedia/';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('copies test dataset images', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      { name: 'image1', type: 'jpg', localUri: '/asset/path/image1.jpg' },
      { name: 'image2', type: 'jpg', localUri: '/asset/path/image2.jpg' },
      { name: 'image3', type: 'jpg', localUri: '/asset/path/image3.jpg' },
    ];

    mockAssetLoadAsync.mockResolvedValue(mockAssets);
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    mockCopyAsync.mockResolvedValue(undefined);

    await copyDatasetImages();

    expect(mockAssetLoadAsync).toHaveBeenCalledTimes(1);
    expect(mockCopyAsync).toHaveBeenCalledTimes(3);
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: '/asset/path/image1.jpg',
      to: defaultDocumentsPath + 'image1.jpg',
    });
  });

  test('copies production dataset images', async () => {
    setMockDatasetType('production');

    const mockAssets = [
      {
        name: 'spaghetti_bolognaise',
        type: 'png',
        localUri: '/asset/path/spaghetti_bolognaise.png',
      },
      { name: 'soupe_legumes_hiver', type: 'png', localUri: '/asset/path/soupe_legumes_hiver.png' },
      {
        name: 'curry_lentilles_corail',
        type: 'png',
        localUri: '/asset/path/curry_lentilles_corail.png',
      },
    ];

    mockAssetLoadAsync.mockResolvedValue(mockAssets);
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    mockCopyAsync.mockResolvedValue(undefined);

    await copyDatasetImages();

    expect(mockAssetLoadAsync).toHaveBeenCalledTimes(1);
    expect(mockCopyAsync).toHaveBeenCalledTimes(3);
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: '/asset/path/spaghetti_bolognaise.png',
      to: defaultDocumentsPath + 'spaghetti_bolognaise.png',
    });
  });

  test('skips copying images that already exist', async () => {
    setMockDatasetType('test');

    const mockAssets = [
      { name: 'image1', type: 'jpg', localUri: '/asset/path/image1.jpg' },
      { name: 'image2', type: 'jpg', localUri: '/asset/path/image2.jpg' },
      { name: 'image3', type: 'jpg', localUri: '/asset/path/image3.jpg' },
    ];

    mockAssetLoadAsync.mockResolvedValue(mockAssets);
    mockGetInfoAsync
      .mockResolvedValueOnce({ exists: true })
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);

    await copyDatasetImages();

    expect(mockCopyAsync).toHaveBeenCalledTimes(1);
    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: '/asset/path/image2.jpg',
      to: defaultDocumentsPath + 'image2.jpg',
    });
  });

  test('throws error when asset loading fails', async () => {
    setMockDatasetType('test');

    mockAssetLoadAsync.mockRejectedValue(new Error('Asset loading failed'));

    await expect(copyDatasetImages()).rejects.toThrow('Asset loading failed');
  });

  test('throws error when asset count mismatch', async () => {
    setMockDatasetType('test');

    const mockAssets = [{ name: 'image1', type: 'jpg', localUri: '/asset/path/image1.jpg' }];

    mockAssetLoadAsync.mockResolvedValue(mockAssets);

    await expect(copyDatasetImages()).rejects.toThrow();
  });
});

describe('transformDatasetRecipeImages', () => {
  const directoryUri = 'file:///documents/Recipedia/';

  test('transforms bare filename to full URI', () => {
    const recipes: recipeTableElement[] = [
      {
        id: 1,
        title: 'Spaghetti Bolognese',
        description: 'A classic Italian pasta dish',
        image_Source: 'spaghetti_bolognese.png',
        preparation: [],
        ingredients: [],
        tags: [],
        season: [],
        time: 30,
        persons: 4,
      },
    ];

    const result = transformDatasetRecipeImages(recipes, directoryUri);

    expect(result[0].image_Source).toBe('file:///documents/Recipedia/spaghetti_bolognese.png');
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

    const result = transformDatasetRecipeImages(recipes, directoryUri);

    expect(result[0].image_Source).toBe('file:///documents/Recipedia/image1.png');
    expect(result[1].image_Source).toBe('file:///documents/Recipedia/image2.jpg');
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

    const result = transformDatasetRecipeImages(recipes, directoryUri);

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
    const recipes: recipeTableElement[] = [];

    const result = transformDatasetRecipeImages(recipes, directoryUri);

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

    const result = transformDatasetRecipeImages(recipes, directoryUri);

    expect(result[0].image_Source).toBe('file:///documents/Recipedia/');
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
    transformDatasetRecipeImages(recipes, directoryUri);

    expect(recipes[0].image_Source).toBe(originalImageSource);
  });
});
