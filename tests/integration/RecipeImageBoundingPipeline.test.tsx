import RecipeDatabase from '@utils/RecipeDatabase';
import { RecipeDraft } from '@customTypes/DatabaseElementTypes';
import { MAX_IMAGE_DIMENSION } from '@utils/imageResize';
import { mockFileCopy, mockFileExists } from '@mocks/deps/expo-file-system-mock';
import {
  ImageManipulator,
  SaveFormat,
  mockImageRef,
  mockManipulatorContext,
  setMockImageDimensions,
} from '@mocks/deps/expo-image-manipulator-mock';
import { mockDecodedImageRef, mockLoadAsync } from '@mocks/deps/expo-image-mock';

jest.unmock('@utils/FileGestion');

jest.mock('expo-image', () => require('@mocks/deps/expo-image-mock'));

jest.mock('expo-file-system', () =>
  require('@mocks/deps/expo-file-system-mock').expoFileSystemMock()
);

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'fixed-uuid') }));

const permanentDirectory = '/documents/Test Recipedia/';
const manipulatedUri = '/cache/ImageManipulator/bounded.jpg';

const cameraPhoto: RecipeDraft = {
  title: 'Roast Chicken',
  image_Source: '/cache/camera/IMG_0042.jpg',
  description: '',
  tags: [],
  persons: 4,
  ingredients: [],
  season: [],
  preparation: [],
  time: 60,
};

describe('Recipe image bounding pipeline', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFileExists.mockReturnValue(false);
    setMockImageDimensions(MAX_IMAGE_DIMENSION, 960);
    mockLoadAsync.mockResolvedValue(mockDecodedImageRef);
    mockManipulatorContext.renderAsync.mockResolvedValue(mockImageRef);
    mockImageRef.saveAsync.mockResolvedValue({ uri: manipulatedUri, width: 1280, height: 960 });

    database = RecipeDatabase.getInstance();
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  const addAndReadBack = async (recipe: RecipeDraft) => {
    await database.addRecipe(recipe);
    return database.get_recipes().find(saved => saved.title === recipe.title)!;
  };

  test('a camera photo is bounded before it is persisted and referenced by the recipe', async () => {
    const saved = await addAndReadBack(cameraPhoto);

    expect(mockLoadAsync).toHaveBeenCalledWith(cameraPhoto.image_Source, {
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
    });
    expect(mockFileCopy).toHaveBeenCalledWith(
      manipulatedUri,
      expect.objectContaining({ uri: permanentDirectory + 'roast_chicken_fixed-uuid.jpg' })
    );
    expect(saved.image_Source).toBe(permanentDirectory + 'roast_chicken_fixed-uuid.jpg');
  });

  test('the full-resolution original never reaches permanent storage', async () => {
    await addAndReadBack(cameraPhoto);

    expect(mockFileCopy).not.toHaveBeenCalledWith(
      cameraPhoto.image_Source,
      expect.objectContaining({ uri: expect.stringContaining(permanentDirectory) })
    );
  });

  test('an image already within the bound is persisted without re-encoding', async () => {
    setMockImageDimensions(800, 600);

    const saved = await addAndReadBack(cameraPhoto);

    expect(mockImageRef.saveAsync).not.toHaveBeenCalled();
    expect(mockFileCopy).toHaveBeenCalledWith(
      cameraPhoto.image_Source,
      expect.objectContaining({ uri: saved.image_Source })
    );
  });

  test('a scraped webp keeps its container format through the bound', async () => {
    mockImageRef.saveAsync.mockResolvedValue({
      uri: '/cache/ImageManipulator/bounded.webp',
      width: 1280,
      height: 960,
    });

    const saved = await addAndReadBack({
      ...cameraPhoto,
      image_Source: '/cache/Test Recipedia/scraped_1700000000.webp',
    });

    expect(mockImageRef.saveAsync).toHaveBeenCalledWith(
      expect.objectContaining({ format: SaveFormat.WEBP })
    );
    expect(saved.image_Source).toMatch(/\.webp$/);
  });

  test('a recipe already pointing at permanent storage is left untouched', async () => {
    const existingUri = permanentDirectory + 'previously_saved.jpg';

    const saved = await addAndReadBack({ ...cameraPhoto, image_Source: existingUri });

    expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
    expect(mockFileCopy).not.toHaveBeenCalled();
    expect(saved.image_Source).toBe(existingUri);
  });

  test('a recipe saved without an image stays imageless', async () => {
    const saved = await addAndReadBack({ ...cameraPhoto, image_Source: '' });

    expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
    expect(saved.image_Source).toBe(permanentDirectory);
  });

  test('a failed downscale still persists the recipe using the original file', async () => {
    mockImageRef.saveAsync.mockRejectedValue(new Error('encoder unavailable'));

    const saved = await addAndReadBack(cameraPhoto);

    expect(mockFileCopy).toHaveBeenCalledWith(
      cameraPhoto.image_Source,
      expect.objectContaining({ uri: saved.image_Source })
    );
    expect(saved.image_Source).toBe(permanentDirectory + 'roast_chicken_fixed-uuid.jpg');
  });
});
