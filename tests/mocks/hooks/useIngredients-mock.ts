import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';

export const mockFindSimilarIngredients = jest.fn<ingredientTableElement[], [string]>(() => []);
export const mockAddIngredient = jest.fn(async (ing: unknown) => ing);
export const mockEditIngredient = jest.fn(async () => true);
export const mockDeleteIngredient = jest.fn(async () => true);
export const mockGetRandomIngredients = jest.fn<ingredientTableElement[], [ingredientType, number]>(
  () => []
);
export const mockAddMultipleIngredients = jest.fn(async () => {});

export let mockIngredients: ingredientTableElement[] = [];

export function setMockIngredients(ingredients: ingredientTableElement[]) {
  mockIngredients = ingredients;
}

export function resetUseIngredientsMocks() {
  mockIngredients = [];
  mockFindSimilarIngredients.mockReset().mockReturnValue([]);
  mockAddIngredient.mockReset().mockImplementation(async (ing: unknown) => ing);
  mockEditIngredient.mockReset().mockResolvedValue(true);
  mockDeleteIngredient.mockReset().mockResolvedValue(true);
  mockGetRandomIngredients.mockReset().mockReturnValue([]);
  mockAddMultipleIngredients.mockReset().mockResolvedValue(undefined);
}

export function useIngredientsMock() {
  return {
    ingredients: mockIngredients,
    findSimilarIngredients: mockFindSimilarIngredients,
    addIngredient: mockAddIngredient,
    editIngredient: mockEditIngredient,
    deleteIngredient: mockDeleteIngredient,
    getRandomIngredients: mockGetRandomIngredients,
    addMultipleIngredients: mockAddMultipleIngredients,
  };
}
