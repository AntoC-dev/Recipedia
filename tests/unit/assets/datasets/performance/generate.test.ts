import {
  buildSeason,
  generatePerformanceIngredients,
  generatePerformanceRecipes,
  generatePerformanceTags,
  hashIndex,
  intInRange,
  pickByIndex,
} from '@assets/datasets/performance/generate';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

describe('hashIndex', () => {
  it('is deterministic for the same index and salt', () => {
    expect(hashIndex(42, 7)).toBe(hashIndex(42, 7));
  });

  it('returns a non-negative integer', () => {
    for (let i = 0; i < 1000; i++) {
      const value = hashIndex(i, 3);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('decorrelates different salts for the same index', () => {
    expect(hashIndex(10, 1)).not.toBe(hashIndex(10, 2));
  });
});

describe('intInRange', () => {
  it('stays within the inclusive bounds', () => {
    for (let i = 0; i < 1000; i++) {
      const value = intInRange(i, 5, 5, 9);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(9);
    }
  });

  it('returns the single value when min equals max', () => {
    expect(intInRange(123, 5, 4, 4)).toBe(4);
  });
});

describe('pickByIndex', () => {
  it('always returns an element of the pool', () => {
    const pool = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(pool).toContain(pickByIndex(pool, i, 9));
    }
  });
});

describe('buildSeason', () => {
  it('returns only valid month strings', () => {
    const validMonths = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    for (let i = 0; i < 50; i++) {
      const season = buildSeason(i);
      expect(season.length).toBeGreaterThan(0);
      season.forEach(month => expect(validMonths.has(month)).toBe(true));
    }
  });
});

describe('generatePerformanceIngredients', () => {
  const startId = 51;

  it('produces the requested count', () => {
    expect(generatePerformanceIngredients(950, startId)).toHaveLength(950);
  });

  it('is deterministic', () => {
    expect(generatePerformanceIngredients(200, startId)).toEqual(
      generatePerformanceIngredients(200, startId)
    );
  });

  it('assigns contiguous unique ids starting at startId', () => {
    const ingredients = generatePerformanceIngredients(300, startId);
    const ids = ingredients.map(ingredient => ingredient.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id, index) => expect(id).toBe(startId + index));
  });

  it('covers every ingredientType value', () => {
    const ingredients = generatePerformanceIngredients(950, startId);
    const presentTypes = new Set(ingredients.map(ingredient => ingredient.type));
    Object.values(ingredientType).forEach(type => expect(presentTypes.has(type)).toBe(true));
  });

  it('assigns a unit and season to every ingredient', () => {
    const ingredients = generatePerformanceIngredients(100, startId);
    ingredients.forEach(ingredient => {
      expect(ingredient.unit.length).toBeGreaterThan(0);
      expect(ingredient.season.length).toBeGreaterThan(0);
    });
  });
});

describe('generatePerformanceTags', () => {
  const startId = 21;

  it('produces the requested count', () => {
    expect(generatePerformanceTags(280, startId)).toHaveLength(280);
  });

  it('is deterministic', () => {
    expect(generatePerformanceTags(100, startId)).toEqual(generatePerformanceTags(100, startId));
  });

  it('assigns contiguous unique ids and unique names', () => {
    const tags = generatePerformanceTags(280, startId);
    const ids = tags.map(tag => tag.id);
    const names = tags.map(tag => tag.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    ids.forEach((id, index) => expect(id).toBe(startId + index));
  });
});

describe('generatePerformanceRecipes', () => {
  const ingredientPool = generatePerformanceIngredients(950, 51);
  const tagPool = generatePerformanceTags(280, 21);
  const imagePool = ['alpha.webp', 'beta.webp', 'gamma.webp'];
  const startId = 151;

  it('produces the requested count', () => {
    const recipes = generatePerformanceRecipes(1050, ingredientPool, tagPool, imagePool, startId);
    expect(recipes).toHaveLength(1050);
  });

  it('is deterministic', () => {
    const first = generatePerformanceRecipes(300, ingredientPool, tagPool, imagePool, startId);
    const second = generatePerformanceRecipes(300, ingredientPool, tagPool, imagePool, startId);
    expect(first).toEqual(second);
  });

  it('assigns contiguous unique ids starting at startId', () => {
    const recipes = generatePerformanceRecipes(500, ingredientPool, tagPool, imagePool, startId);
    const ids = recipes.map(recipe => recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id, index) => expect(id).toBe(startId + index));
  });

  it('draws every ingredient from the ingredient pool', () => {
    const poolById = new Map(ingredientPool.map(ingredient => [ingredient.id, ingredient]));
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const source = poolById.get(ingredient.id);
        expect(source).toBeDefined();
        expect(ingredient.name).toBe(source?.name);
      });
    });
  });

  it('draws every tag from the tag pool', () => {
    const poolById = new Map(tagPool.map(tag => [tag.id, tag]));
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    recipes.forEach(recipe => {
      recipe.tags.forEach(tag => {
        const source = poolById.get(tag.id);
        expect(source).toBeDefined();
        expect(tag.name).toBe(source?.name);
      });
    });
  });

  it('keeps ingredient counts within the 3 to 20 range with no duplicates', () => {
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    recipes.forEach(recipe => {
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(recipe.ingredients.length).toBeLessThanOrEqual(20);
      const ids = recipe.ingredients.map(ingredient => ingredient.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('assigns at least one tag with no duplicates', () => {
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    recipes.forEach(recipe => {
      expect(recipe.tags.length).toBeGreaterThanOrEqual(1);
      const ids = recipe.tags.map(tag => tag.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('always provides preparation steps, persons and time', () => {
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    recipes.forEach(recipe => {
      expect(recipe.preparation.length).toBeGreaterThanOrEqual(3);
      expect(recipe.persons).toBeGreaterThanOrEqual(1);
      expect(recipe.time).toBeGreaterThanOrEqual(10);
    });
  });

  it('includes recipes both with and without nutrition', () => {
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    const withNutrition = recipes.filter(recipe => recipe.nutrition !== undefined);
    expect(withNutrition.length).toBeGreaterThan(0);
    expect(withNutrition.length).toBeLessThan(recipes.length);
  });

  it('assigns every image from the supplied image pool', () => {
    const recipes = generatePerformanceRecipes(400, ingredientPool, tagPool, imagePool, startId);
    recipes.forEach(recipe => expect(imagePool).toContain(recipe.image_Source));
  });
});
