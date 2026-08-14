import { measureAsyncFunction } from 'reassure';
import RecipeDatabase from '@utils/RecipeDatabase';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { HEAVY_WARMUP } from './perfOptions';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const RUNS = 10;

describe('RecipeDatabase decode and cache mutation performance', () => {
  const database = RecipeDatabase.getInstance();

  const seed = async () => {
    await database.init();
    await database.addMultipleIngredients(performanceIngredients);
    await database.addMultipleTags(performanceTags);
    await database.addMultipleRecipes(performanceRecipes);
  };

  const teardown = async () => {
    await database.closeAndReset();
  };

  beforeEach(seed);
  afterEach(teardown);

  test('decode every recipe from the database', async () => {
    await measureAsyncFunction(
      async () => {
        await database['getAllRecipes']();
      },
      { runs: RUNS, ...HEAVY_WARMUP }
    );
  });

  test('editIngredient propagates to every recipe using it', async () => {
    const target = performanceIngredients[0]!;
    let rename = 0;

    await measureAsyncFunction(
      async () => {
        rename += 1;
        await database.editIngredient({ ...target, name: `${target.name} ${rename}` });
      },
      { runs: RUNS, ...HEAVY_WARMUP }
    );
  });

  test('editTag propagates to every recipe using it', async () => {
    const target = performanceTags[0]!;
    let rename = 0;

    await measureAsyncFunction(
      async () => {
        rename += 1;
        await database.editTag({ ...target, name: `${target.name} ${rename}` });
      },
      { runs: RUNS, ...HEAVY_WARMUP }
    );
  });

  test('deleteIngredient removes it from every recipe using it', async () => {
    let index = 0;

    await measureAsyncFunction(
      async () => {
        await database.deleteIngredient(performanceIngredients[index]!);
        index += 1;
      },
      { runs: RUNS, ...HEAVY_WARMUP }
    );
  });
});
