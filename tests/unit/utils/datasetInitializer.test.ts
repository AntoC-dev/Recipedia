import { loadFirstLaunchDataset } from '@utils/datasetInitializer';
import { DEFAULT_CHUNK_SIZE } from '@utils/chunk';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { copyDatasetImages, transformDatasetRecipeImages } from '@utils/FileGestion';
import { getDataset } from '@utils/DatasetLoader';
import i18n from '@utils/i18n';
import { getDefaultPersons } from '@utils/settings';

jest.mock('@utils/RecipeDatabase', () => {
  const mockAddMultipleIngredients = jest.fn().mockResolvedValue(undefined);
  const mockAddMultipleTags = jest.fn().mockResolvedValue(undefined);
  const mockAddMultipleRecipes = jest.fn().mockResolvedValue(undefined);
  const mockScaleRecipeToPersons = jest.fn((recipe: any) => ({ ...recipe }));

  const mockInstance = {
    addMultipleIngredients: mockAddMultipleIngredients,
    addMultipleTags: mockAddMultipleTags,
    addMultipleRecipes: mockAddMultipleRecipes,
  };

  return {
    RecipeDatabase: {
      getInstance: jest.fn(() => mockInstance),
      scaleRecipeToPersons: mockScaleRecipeToPersons,
    },
  };
});

jest.mock('@utils/FileGestion', () => ({
  copyDatasetImages: jest.fn().mockResolvedValue(undefined),
  transformDatasetRecipeImages: jest.fn((recipes: any[]) => recipes),
}));

jest.mock('@utils/DatasetLoader', () => ({
  getDataset: jest.fn(() => ({
    ingredients: [{ id: 1, name: 'Carrot', unit: 'g', type: 'vegetable', season: [] }],
    tags: [{ id: 1, name: 'Italian' }],
    recipes: [
      {
        id: 1,
        title: 'Pasta',
        ingredients: [],
        tags: [],
        persons: 2,
        time: 30,
        preparation: [],
        image_Source: '',
        description: '',
        season: [],
      },
    ],
  })),
}));

jest.mock('@utils/i18n', () => ({
  __esModule: true,
  default: { language: 'en' },
  SUPPORTED_LANGUAGES: { en: { name: 'English' }, fr: { name: 'Français' } },
  DEFAULT_LANGUAGE: 'en',
}));

jest.mock('@utils/settings', () => ({
  getDefaultPersons: jest.fn().mockResolvedValue(4),
}));

const getDbInstance = () => RecipeDatabase.getInstance() as any;

describe('loadFirstLaunchDataset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDefaultPersons as jest.Mock).mockResolvedValue(4);
    (copyDatasetImages as jest.Mock).mockResolvedValue(undefined);
    (transformDatasetRecipeImages as jest.Mock).mockImplementation((recipes: any[]) => recipes);
    (RecipeDatabase.scaleRecipeToPersons as jest.Mock).mockImplementation((recipe: any) => ({
      ...recipe,
    }));
    (getDataset as jest.Mock).mockReturnValue({
      ingredients: [{ id: 1, name: 'Carrot', unit: 'g', type: 'vegetable', season: [] }],
      tags: [{ id: 1, name: 'Italian' }],
      recipes: [
        {
          id: 1,
          title: 'Pasta',
          ingredients: [],
          tags: [],
          persons: 2,
          time: 30,
          preparation: [],
          image_Source: '',
          description: '',
          season: [],
        },
      ],
    });
  });

  test('calls addMultipleIngredients, addMultipleTags and addMultipleRecipes with dataset data', async () => {
    await loadFirstLaunchDataset();

    const db = getDbInstance();
    expect(db.addMultipleIngredients).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Carrot' })])
    );
    expect(db.addMultipleTags).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Italian' })])
    );
    expect(db.addMultipleRecipes).toHaveBeenCalled();
  });

  test('continues loading dataset even when copyDatasetImages rejects', async () => {
    (copyDatasetImages as jest.Mock).mockRejectedValueOnce(new Error('Image copy failed'));

    await loadFirstLaunchDataset();

    const db = getDbInstance();
    expect(db.addMultipleIngredients).toHaveBeenCalled();
    expect(db.addMultipleTags).toHaveBeenCalled();
    expect(db.addMultipleRecipes).toHaveBeenCalled();
  });

  test('passes defaultPersons from getDefaultPersons to scaleRecipeToPersons', async () => {
    (getDefaultPersons as jest.Mock).mockResolvedValue(6);

    await loadFirstLaunchDataset();

    expect(RecipeDatabase.scaleRecipeToPersons).toHaveBeenCalledWith(expect.anything(), 6);
  });

  test('uses i18n.language to select the dataset language', async () => {
    (i18n as any).language = 'fr';

    await loadFirstLaunchDataset();

    expect(getDataset).toHaveBeenCalledWith('fr');

    (i18n as any).language = 'en';
  });

  test('chunks recipe scaling and insertion across default-size batches', async () => {
    const total = DEFAULT_CHUNK_SIZE * 2 + 1;
    const manyRecipes = Array.from({ length: total }, (_, i) => ({
      id: i + 1,
      title: `Recipe ${i}`,
      ingredients: [],
      tags: [],
      persons: 2,
      time: 30,
      preparation: [],
      image_Source: '',
      description: '',
      season: [],
    }));
    (getDataset as jest.Mock).mockReturnValue({
      ingredients: [{ id: 1, name: 'Carrot', unit: 'g', type: 'vegetable', season: [] }],
      tags: [{ id: 1, name: 'Italian' }],
      recipes: manyRecipes,
    });

    await loadFirstLaunchDataset();

    const db = getDbInstance();
    expect(RecipeDatabase.scaleRecipeToPersons).toHaveBeenCalledTimes(total);
    expect(db.addMultipleRecipes).toHaveBeenCalledTimes(3);
    const insertedCount = db.addMultipleRecipes.mock.calls.reduce(
      (sum: number, call: unknown[]) => sum + (call[0] as unknown[]).length,
      0
    );
    expect(insertedCount).toBe(total);
    expect((db.addMultipleRecipes.mock.calls[0][0] as unknown[]).length).toBe(DEFAULT_CHUNK_SIZE);
    expect((db.addMultipleRecipes.mock.calls[2][0] as unknown[]).length).toBe(1);
  });

  test('calls transformDatasetRecipeImages before scaling recipes', async () => {
    const callOrder: string[] = [];
    (transformDatasetRecipeImages as jest.Mock).mockImplementationOnce((recipes: any[]) => {
      callOrder.push('transform');
      return recipes;
    });
    (RecipeDatabase.scaleRecipeToPersons as jest.Mock).mockImplementationOnce((recipe: any) => {
      callOrder.push('scale');
      return { ...recipe };
    });

    await loadFirstLaunchDataset();

    expect(callOrder[0]).toBe('transform');
    expect(callOrder[1]).toBe('scale');
  });
});
