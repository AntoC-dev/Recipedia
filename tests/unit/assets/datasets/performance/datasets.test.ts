import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { performanceRecipes } from '@assets/datasets/performance/recipes';
import { ingredientType } from '@customTypes/DatabaseElementTypes';

describe('performance dataset composition', () => {
  it('reaches the power-user scale targets', () => {
    expect(performanceIngredients.length).toBeGreaterThanOrEqual(1000);
    expect(performanceTags.length).toBeGreaterThanOrEqual(300);
    expect(performanceRecipes.length).toBeGreaterThanOrEqual(1200);
  });

  it('preserves the curated ingredient anchors at the front', () => {
    expect(performanceIngredients[0]).toMatchObject({ id: 1, name: 'Spaghetti' });
    const parmesan = performanceIngredients.find(ingredient => ingredient.name === 'Parmesan');
    expect(parmesan).toMatchObject({ id: 3, type: ingredientType.cheese });
  });

  it('preserves the curated tag anchors at the front', () => {
    const breakfast = performanceTags.find(tag => tag.name === 'Breakfast');
    expect(breakfast).toMatchObject({ id: 5 });
  });

  it('preserves the spaghetti bolognese anchor recipe at id 1', () => {
    expect(performanceRecipes[0]).toMatchObject({ id: 1, title: 'Spaghetti Bolognese' });
  });

  it('has no duplicate ingredient ids', () => {
    const ids = performanceIngredients.map(ingredient => ingredient.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate tag ids', () => {
    const ids = performanceTags.map(tag => tag.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate recipe ids', () => {
    const ids = performanceRecipes.map(recipe => recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every ingredientType in the pool', () => {
    const presentTypes = new Set(performanceIngredients.map(ingredient => ingredient.type));
    Object.values(ingredientType).forEach(type => expect(presentTypes.has(type)).toBe(true));
  });

  it('reuses the bundled image pool for every recipe instead of inventing files', () => {
    const distinctImages = new Set(performanceRecipes.map(recipe => recipe.image_Source));
    expect(distinctImages.size).toBeLessThanOrEqual(12);
    distinctImages.forEach(image => {
      expect(image).toMatch(/\.webp$/);
      expect(image).not.toContain('placeholder');
    });
  });

  it('references only existing ingredients and tags from every recipe', () => {
    const ingredientById = new Map(
      performanceIngredients.map(ingredient => [ingredient.id, ingredient])
    );
    const tagById = new Map(performanceTags.map(tag => [tag.id, tag]));

    performanceRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const source = ingredientById.get(ingredient.id);
        expect(source).toBeDefined();
        expect(ingredient.name).toBe(source?.name);
      });
      recipe.tags.forEach(tag => {
        const source = tagById.get(tag.id);
        expect(source).toBeDefined();
        expect(tag.name).toBe(source?.name);
      });
    });
  });
});
