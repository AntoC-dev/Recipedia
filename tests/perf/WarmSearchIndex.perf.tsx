import { measureFunction } from 'reassure';
import { buildItemIndex, ITEM_FUZZY } from '@utils/FuzzyIndex';
import { cleanIngredientName } from '@utils/NutritionUtils';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { HEAVY_WARMUP } from './perfOptions';

const largeIngredients = Array.from({ length: 1200 }, (_, i) => ({
  id: i + 1,
  name: `LargeIngredient${i + 1}`,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [] as string[],
}));

const indexConfig = {
  fuzzy: ITEM_FUZZY,
  getName: (ingredient: (typeof largeIngredients)[number]) => ingredient.name,
  preprocess: cleanIngredientName,
};

describe('Warm search index performance - 1200 ingredients', () => {
  test('buildItemIndex is the cost the idle warm defers off the first keystroke', async () => {
    await measureFunction(() => buildItemIndex(largeIngredients, indexConfig), {
      runs: 20,
      ...HEAVY_WARMUP,
    });
  });
});
