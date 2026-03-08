import { repairMissingRecipeImages } from '@utils/ImageRepair';
import { findProviderForUrl } from '@providers/ProviderRegistry';
import {
  mockDownloadImageToCache,
  mockDownloadImageToCacheSuccess,
} from '@mocks/utils/FileGestion-mock';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';

jest.mock('@providers/ProviderRegistry', () => ({
  findProviderForUrl: jest.fn(),
}));

const mockFindProviderForUrl = findProviderForUrl as jest.Mock;

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

function buildProvider(imageUrl: string | null = 'https://cdn.example.com/image.jpg') {
  return {
    fetchImageUrlForRecipe: jest.fn().mockResolvedValue(imageUrl),
  };
}

describe('repairMissingRecipeImages', () => {
  let editRecipe: jest.Mock;

  beforeEach(() => {
    editRecipe = jest.fn().mockResolvedValue(true);
    mockDownloadImageToCacheSuccess('/local/path/image.jpg');
  });

  it('does not call editRecipe when recipe list is empty', async () => {
    await repairMissingRecipeImages([], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe with non-empty image_Source', async () => {
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

  it('treats recipe with placeholder image_Source as a candidate', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    const recipe = buildRecipe({ image_Source: 'https://example.com/placeholder/image.jpg' });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).toHaveBeenCalledWith({ ...recipe, image_Source: '/local/path/image.jpg' });
  });

  it('skips recipe with placeholder image_Source but invalid sourceUrl', async () => {
    const recipe = buildRecipe({
      image_Source: 'https://example.com/placeholder/image.jpg',
      sourceUrl: 'not-a-url',
    });

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('repairs all candidates when all succeed', async () => {
    const recipe1 = buildRecipe({ id: 1, title: 'Recipe 1' });
    const recipe2 = buildRecipe({ id: 2, title: 'Recipe 2' });
    const recipe3 = buildRecipe({ id: 3, title: 'Recipe 3' });
    mockFindProviderForUrl.mockReturnValue(buildProvider());

    await repairMissingRecipeImages([recipe1, recipe2, recipe3], editRecipe);

    expect(editRecipe).toHaveBeenCalledTimes(3);
  });

  it('skips recipe when no provider matches the URL', async () => {
    mockFindProviderForUrl.mockReturnValue(undefined);
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when provider returns null image URL', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider(null));
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when provider returns empty string image URL', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider(''));
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when downloadImageToCache returns empty string', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockDownloadImageToCache.mockResolvedValue('');
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('skips recipe when downloadImageToCache returns null', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockDownloadImageToCache.mockResolvedValue(null);
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('catches downloadImageToCache error and does not call editRecipe', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    mockDownloadImageToCache.mockRejectedValue(new Error('disk full'));
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('catches provider fetchImageUrlForRecipe error and does not call editRecipe', async () => {
    const failingProvider = {
      fetchImageUrlForRecipe: jest.fn().mockRejectedValue(new Error('network')),
    };
    mockFindProviderForUrl.mockReturnValue(failingProvider);
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
    expect(editRecipe).not.toHaveBeenCalled();
  });

  it('does not throw when editRecipe returns false', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    editRecipe.mockResolvedValue(false);
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
  });

  it('catches editRecipe error and resolves normally', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    editRecipe.mockRejectedValue(new Error('db error'));
    const recipe = buildRecipe();

    await expect(repairMissingRecipeImages([recipe], editRecipe)).resolves.toBeUndefined();
  });

  it('calls editRecipe with updated image_Source on full success', async () => {
    mockFindProviderForUrl.mockReturnValue(buildProvider());
    const recipe = buildRecipe();

    await repairMissingRecipeImages([recipe], editRecipe);

    expect(editRecipe).toHaveBeenCalledWith({ ...recipe, image_Source: '/local/path/image.jpg' });
  });

  it('processes successful recipe and skips failing one independently', async () => {
    const goodRecipe = buildRecipe({ id: 1, title: 'Good Recipe' });
    const badRecipe = buildRecipe({ id: 2, title: 'Bad Recipe' });

    mockFindProviderForUrl.mockReturnValueOnce(buildProvider()).mockReturnValueOnce({
      fetchImageUrlForRecipe: jest.fn().mockRejectedValue(new Error('fail')),
    });

    await repairMissingRecipeImages([goodRecipe, badRecipe], editRecipe);

    expect(editRecipe).toHaveBeenCalledTimes(1);
    expect(editRecipe).toHaveBeenCalledWith({
      ...goodRecipe,
      image_Source: '/local/path/image.jpg',
    });
  });
});
