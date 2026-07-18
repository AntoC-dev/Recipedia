import { buildDefaultsFromScrape } from '@screens/recipe/defaults/buildDefaultsFromScrape';
import { defaultValueNumber } from '@utils/Constants';
import { ingredientType, nutritionTableElement } from '@customTypes/DatabaseElementTypes';
import { ScrapedRecipeData } from '@customTypes/RecipeNavigationTypes';

const fullNutrition: nutritionTableElement = {
  energyKcal: 200,
  energyKj: 837,
  fat: 10,
  saturatedFat: 3,
  carbohydrates: 20,
  sugars: 5,
  fiber: 2,
  protein: 8,
  salt: 1,
  portionWeight: 100,
};

const fullScrape: ScrapedRecipeData = {
  image_Source: 'file://img.jpg',
  title: 'Scraped Tartiflette',
  description: 'A cheesy dish',
  tags: [{ name: 'comfort' }],
  persons: 6,
  ingredients: [
    { name: 'Potato', unit: 'g', quantity: '800', type: ingredientType.vegetable, season: [] },
  ],
  preparation: [{ title: 'Step 1', description: 'Peel the potatoes' }],
  time: 45,
  nutrition: fullNutrition,
};

describe('buildDefaultsFromScrape', () => {
  test('maps a fully populated scrape payload field-for-field', () => {
    expect(buildDefaultsFromScrape(fullScrape)).toEqual({
      recipeImage: 'file://img.jpg',
      recipeTitle: 'Scraped Tartiflette',
      recipeDescription: 'A cheesy dish',
      recipeTags: [{ name: 'comfort' }],
      recipePersons: 6,
      recipeIngredients: fullScrape.ingredients,
      recipePreparation: fullScrape.preparation,
      recipeTime: 45,
      recipeNutrition: fullNutrition,
    });
  });

  test('resolves every field to its empty fallback for an empty payload', () => {
    expect(buildDefaultsFromScrape({})).toEqual({
      recipeImage: '',
      recipeTitle: '',
      recipeDescription: '',
      recipeTags: [],
      recipePersons: defaultValueNumber,
      recipeIngredients: [],
      recipePreparation: [],
      recipeTime: defaultValueNumber,
      recipeNutrition: undefined,
    });
  });

  test('keeps provided fields and falls back on the missing ones for a partial payload', () => {
    const result = buildDefaultsFromScrape({
      title: 'Only Title',
      ingredients: [
        { name: 'Egg', unit: '', quantity: '2', type: ingredientType.dairy, season: [] },
      ],
    });
    expect(result.recipeTitle).toBe('Only Title');
    expect(result.recipeIngredients).toHaveLength(1);
    expect(result.recipeImage).toBe('');
    expect(result.recipeDescription).toBe('');
    expect(result.recipeTags).toEqual([]);
    expect(result.recipePersons).toBe(defaultValueNumber);
    expect(result.recipePreparation).toEqual([]);
    expect(result.recipeTime).toBe(defaultValueNumber);
    expect(result.recipeNutrition).toBeUndefined();
  });

  test('passes nutrition through untouched when present and undefined when absent', () => {
    expect(buildDefaultsFromScrape({ nutrition: fullNutrition }).recipeNutrition).toBe(
      fullNutrition
    );
    expect(buildDefaultsFromScrape({}).recipeNutrition).toBeUndefined();
  });
});
