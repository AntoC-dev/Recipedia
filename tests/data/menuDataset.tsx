import { menuTableElement } from '@customTypes/DatabaseElementTypes';
import { testRecipes } from './recipesDataset';

export const testMenuItems: menuTableElement[] = [
  {
    id: 1,
    recipeId: testRecipes[0].id!,
    recipeTitle: testRecipes[0].title,
    imageSource: testRecipes[0].image_Source,
    isCooked: false,
    count: 1,
  },
  {
    id: 2,
    recipeId: testRecipes[1].id!,
    recipeTitle: testRecipes[1].title,
    imageSource: testRecipes[1].image_Source,
    isCooked: false,
    count: 1,
  },
  {
    id: 3,
    recipeId: testRecipes[2].id!,
    recipeTitle: testRecipes[2].title,
    imageSource: testRecipes[2].image_Source,
    isCooked: true,
    count: 1,
  },
];

export const testMenuItemUncooked: menuTableElement = {
  id: 1,
  recipeId: testRecipes[0].id!,
  recipeTitle: testRecipes[0].title,
  imageSource: testRecipes[0].image_Source,
  isCooked: false,
  count: 1,
};

export const testMenuItemCooked: menuTableElement = {
  id: 2,
  recipeId: testRecipes[1].id!,
  recipeTitle: testRecipes[1].title,
  imageSource: testRecipes[1].image_Source,
  isCooked: true,
  count: 1,
};

export const testMenuItemMultipleCount: menuTableElement = {
  id: 3,
  recipeId: testRecipes[2].id!,
  recipeTitle: testRecipes[2].title,
  imageSource: testRecipes[2].image_Source,
  isCooked: false,
  count: 3,
};

export const createMockMenuItem = (
  overrides: Partial<menuTableElement> = {}
): menuTableElement => ({
  id: 1,
  recipeId: 1,
  recipeTitle: 'Test Recipe',
  imageSource: 'test-image.png',
  isCooked: false,
  count: 1,
  ...overrides,
});
