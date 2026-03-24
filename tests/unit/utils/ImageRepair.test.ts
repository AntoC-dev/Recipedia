import { repairMissingRecipeImages } from '@utils/ImageRepair';
import { findProviderForUrl, findProviderById } from '@providers/ProviderRegistry';
import {
  mockDownloadImageToCache,
  mockDownloadImageToCacheSuccess,
} from '@mocks/utils/FileGestion-mock';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { mockFileExists, mockFileInfo } from '@mocks/deps/expo-file-system-mock';

jest.mock('@providers/ProviderRegistry', () => ({
  findProviderForUrl: jest.fn(),
  findProviderById: jest.fn(),
}));

jest.mock('expo-file-system', () =>
  require('@mocks/deps/expo-file-system-mock').expoFileSystemMock()
);

const mockFindProviderForUrl = findProviderForUrl as jest.Mock;
const mockFindProviderById = findProviderById as jest.Mock;

function buildRecipe(overrides: Partial<recipeTableElement> = {}): recipeTableElement {
  return {
    id: 1,
    image_Source: '',
    title: 'Test Recipe',
    description: 'A description',
    tags: [],
    persons: 4,
    ingredients: [],
    season: [],
    preparation: [],
    time: 30,
    sourceUrl: 'https://www.quitoque.fr/recettes/poulet-roti',
    sourceProvider: 'quitoque',
    ...overrides,
  };
}

function buildProvider(
  imageUrl: string | null = 'https://cdn.example.com/image.jpg',
  placeholderUrl: string | null = null
) {
  return {
    fetchImageUrlForRecipe: jest.fn().mockResolvedValue(imageUrl),
    getPlaceholderImageUrl: jest.fn().mockReturnValue(placeholderUrl),
  };
}

const PLACEHOLDER_URL =
  'https://www.quitoque.fr/media/cache/sylius_shop_product_cover/build/quitoque/theme/images/placeholder.4d937d0d.jpg';

describe('repairMissingRecipeImages', () => {
  let editRecipe: jest.Mock;

  beforeEach(() => {
    editRecipe = jest.fn().mockResolvedValue(true);
    mockDownloadImageToCacheSuccess('/local/path/image.jpg');
    mockFileExists.mockReset().mockReturnValue(false);
    mockFileInfo.mockReset().mockReturnValue({ exists: true, md5: null });
  });

  it('does not call editRecipe when recipe list is empty', async () => {
    await repairMissingRecipeImages([], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe with non-empty image_Source and no provider', async () => {
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    const recipe = buildRecipe({ image_Source: '/existing/image.jpg' });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe with undefined sourceUrl', async () => {
    const recipe = buildRecipe({ sourceUrl: undefined });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe with empty sourceUrl', async () => {
    const recipe = buildRecipe({ sourceUrl: '' });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe with invalid sourceUrl', async () => {
    const recipe = buildRecipe({ sourceUrl: 'not-a-url' });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('still repairs recipe with empty image_Source (existing behaviour)', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    const recipe = buildRecipe({ image_Source: '' });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).toHaveBeenCalledWith({ ...recipe, image_Source: '/local/path/image.jpg' });
  });

  it('repairs all candidates with empty image_Source when all succeed', async () => {
    const recipe1 = buildRecipe({ id: 1, title: 'Recipe 1' });
    const recipe2 = buildRecipe({ id: 2, title: 'Recipe 2' });
    const recipe3 = buildRecipe({ id: 3, title: 'Recipe 3' });
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));

    await repairMissingRecipeImages([recipe1, recipe2, recipe3], editRecipe);

    expect(editRecipe).toHaveBeenCalledTimes(3);
  });

  it('skips recipe when no provider matches the URL', async () => {
    mockFindProviderForUrl.mockReturnValue(undefined);
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when provider returns null image URL', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider(null));
    mockFindProviderById.mockReturnValue(buildProvider(null, null));
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when provider returns empty string image URL', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider(''));
    mockFindProviderById.mockReturnValue(buildProvider('', null));
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when downloadImageToCache returns empty string', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    mockDownloadImageToCache.mockResolvedValue('');
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when downloadImageToCache returns null', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    mockDownloadImageToCache.mockResolvedValue(null);
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('catches downloadImageToCache error and does not call editRecipe', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    mockDownloadImageToCache.mockRejectedValue(new Error('disk full'));
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('catches provider fetchImageUrlForRecipe error and does not call editRecipe', async () => {
    const failingProvider = {
      fetchImageUrlForRecipe: jest.fn().mockRejectedValue(new Error('network')),
      getPlaceholderImageUrl: jest.fn().mockReturnValue(null),
    };
    mockFindProviderForUrl.mockReturnValue(failingProvider);
    mockFindProviderById.mockReturnValue(failingProvider);
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('does not throw when editRecipe returns false', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    editRecipe.mockResolvedValue(false);
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
  });

  it('catches editRecipe error and resolves normally', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    editRecipe.mockRejectedValue(new Error('db error'));
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
  });

  it('calls editRecipe with updated image_Source on full success', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).toHaveBeenCalledWith({ ...recipe, image_Source: '/local/path/image.jpg' });
  });

  it('processes successful recipe and skips failing one independently', async () => {
    const goodRecipe = buildRecipe({ id: 1, title: 'Good Recipe' });
    const badRecipe = buildRecipe({ id: 2, title: 'Bad Recipe' });

    const goodProvider = buildProvider();
    const badProvider = {
      fetchImageUrlForRecipe: jest.fn().mockRejectedValue(new Error('fail')),
      getPlaceholderImageUrl: jest.fn().mockReturnValue(null),
    };
    mockFindProviderForUrl.mockReturnValueOnce(goodProvider).mockReturnValueOnce(badProvider);
    mockFindProviderById.mockReturnValue(buildProvider('https://cdn.example.com/image.jpg', null));

    await repairMissingRecipeImages([goodRecipe, badRecipe], editRecipe);

    expect(editRecipe).toHaveBeenCalledTimes(1);
    expect(editRecipe).toHaveBeenCalledWith({
      ...goodRecipe,
      image_Source: '/local/path/image.jpg',
    });
  });

  describe('MD5-based placeholder detection', () => {
    it('finds candidate when recipe image MD5 matches provider placeholder MD5', async () => {
      const quitoqueProvider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(quitoqueProvider);
      mockFindProviderForUrl.mockReturnValue(quitoqueProvider);

      mockDownloadImageToCache
        .mockResolvedValueOnce('/cache/temp_placeholder.jpg')
        .mockResolvedValueOnce('/local/path/image.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo
        .mockReturnValueOnce({ exists: true, md5: 'abc123' })
        .mockReturnValueOnce({ exists: true, md5: 'abc123' });

      const recipe = buildRecipe({ image_Source: '/local/placeholder_copy.jpg' });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).toHaveBeenCalledWith({ ...recipe, image_Source: '/local/path/image.jpg' });
    });

    it('skips recipe when image MD5 does not match placeholder MD5', async () => {
      const quitoqueProvider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(quitoqueProvider);
      mockFindProviderForUrl.mockReturnValue(quitoqueProvider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo
        .mockReturnValueOnce({ exists: true, md5: 'abc123' })
        .mockReturnValueOnce({ exists: true, md5: 'different_hash' });

      const recipe = buildRecipe({ image_Source: '/local/real_image.jpg' });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips provider group when placeholder download fails', async () => {
      const quitoqueProvider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(quitoqueProvider);
      mockFindProviderForUrl.mockReturnValue(quitoqueProvider);

      mockDownloadImageToCache.mockResolvedValueOnce('');

      const recipe = buildRecipe({ image_Source: '/local/placeholder_copy.jpg' });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips recipe when its local file does not exist', async () => {
      const quitoqueProvider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(quitoqueProvider);
      mockFindProviderForUrl.mockReturnValue(quitoqueProvider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValueOnce(true).mockReturnValueOnce(false);
      mockFileInfo.mockReturnValueOnce({ exists: true, md5: 'abc123' });

      const recipe = buildRecipe({ image_Source: '/local/missing_file.jpg' });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('downloads placeholder once for all recipes of the same provider', async () => {
      const quitoqueProvider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(quitoqueProvider);
      mockFindProviderForUrl.mockReturnValue(quitoqueProvider);

      mockDownloadImageToCache
        .mockResolvedValueOnce('/cache/temp_placeholder.jpg')
        .mockResolvedValue('/local/path/image.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo
        .mockReturnValueOnce({ exists: true, md5: 'placeholder_hash' })
        .mockReturnValueOnce({ exists: true, md5: 'placeholder_hash' })
        .mockReturnValueOnce({ exists: true, md5: 'placeholder_hash' })
        .mockReturnValueOnce({ exists: true, md5: 'placeholder_hash' });

      const recipe1 = buildRecipe({ id: 1, image_Source: '/local/file1.jpg' });
      const recipe2 = buildRecipe({ id: 2, image_Source: '/local/file2.jpg' });
      const recipe3 = buildRecipe({ id: 3, image_Source: '/local/file3.jpg' });

      await repairMissingRecipeImages([recipe1, recipe2, recipe3], editRecipe);

      expect(mockDownloadImageToCache).toHaveBeenCalledWith(PLACEHOLDER_URL);
      const placeholderDownloadCalls = mockDownloadImageToCache.mock.calls.filter(
        (call: string[]) => call[0] === PLACEHOLDER_URL
      );
      expect(placeholderDownloadCalls).toHaveLength(1);
    });

    it('skips recipe when sourceProvider is not in the registry', async () => {
      mockFindProviderById.mockReturnValue(undefined);

      const recipe = buildRecipe({ image_Source: '/local/placeholder_copy.jpg' });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('logs debug when no candidates are found', async () => {
      const quitoqueProvider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(quitoqueProvider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo
        .mockReturnValueOnce({ exists: true, md5: 'placeholder_hash' })
        .mockReturnValueOnce({ exists: true, md5: 'different_hash' });

      const recipe = buildRecipe({ image_Source: '/local/real_image.jpg' });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips provider group when placeholder file does not exist after download', async () => {
      const provider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(provider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(false);

      const recipe = buildRecipe({ image_Source: '/local/file.jpg' });
      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips provider group when placeholder file exists but md5 is undefined', async () => {
      const provider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(provider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo.mockReturnValueOnce({ exists: true });

      const recipe = buildRecipe({ image_Source: '/local/file.jpg' });
      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips provider group when file.info throws during placeholder MD5 download', async () => {
      const provider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(provider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo.mockImplementationOnce(() => {
        throw new Error('info failed');
      });

      const recipe = buildRecipe({ image_Source: '/local/file.jpg' });
      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips recipe when file.info throws during local file MD5 read', async () => {
      const provider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(provider);
      mockFindProviderForUrl.mockReturnValue(provider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo
        .mockReturnValueOnce({ exists: true, md5: 'abc123' })
        .mockImplementationOnce(() => {
          throw new Error('read error');
        });

      const recipe = buildRecipe({ image_Source: '/local/file.jpg' });
      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips recipe when local file has no md5 field', async () => {
      const provider = buildProvider('https://cdn.example.com/real.jpg', PLACEHOLDER_URL);
      mockFindProviderById.mockReturnValue(provider);

      mockDownloadImageToCache.mockResolvedValueOnce('/cache/temp_placeholder.jpg');

      mockFileExists.mockReturnValue(true);
      mockFileInfo
        .mockReturnValueOnce({ exists: true, md5: 'abc123' })
        .mockReturnValueOnce({ exists: true });

      const recipe = buildRecipe({ image_Source: '/local/file.jpg' });
      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
    });

    it('skips recipe without sourceProvider when grouping candidates', async () => {
      const recipe = buildRecipe({
        image_Source: '/local/some-image.jpg',
        sourceProvider: undefined,
      });

      await repairMissingRecipeImages([recipe], editRecipe);

      expect(editRecipe).not.toHaveBeenCalled();
      expect(mockDownloadImageToCache).not.toHaveBeenCalled();
    });
  });
});
