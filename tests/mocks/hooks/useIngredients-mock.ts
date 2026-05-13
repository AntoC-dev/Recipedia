import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';
import {
  buildItemIndex,
  DetailedSearchResult,
  searchItems,
  searchItemsDetailed,
} from '@utils/FuzzyIndex';
import { cleanIngredientName } from '@utils/NutritionUtils';

const buildIngredientIndex = () =>
  buildItemIndex(mockIngredients, {
    fuzzy: 0.2,
    getName: i => i.name,
    preprocess: cleanIngredientName,
  });

export const mockFindSimilarIngredients = jest.fn<ingredientTableElement[], [string]>(
  (name: string) => searchItems(buildIngredientIndex(), name)
);
export const mockFindSimilarIngredientsDetailed = jest.fn<
  DetailedSearchResult<ingredientTableElement>,
  [string]
>((name: string) => searchItemsDetailed(buildIngredientIndex(), name));
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
  mockFindSimilarIngredients
    .mockReset()
    .mockImplementation((name: string) => searchItems(buildIngredientIndex(), name));
  mockFindSimilarIngredientsDetailed
    .mockReset()
    .mockImplementation((name: string) => searchItemsDetailed(buildIngredientIndex(), name));
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
    findSimilarIngredientsDetailed: mockFindSimilarIngredientsDetailed,
    addIngredient: mockAddIngredient,
    editIngredient: mockEditIngredient,
    deleteIngredient: mockDeleteIngredient,
    getRandomIngredients: mockGetRandomIngredients,
    addMultipleIngredients: mockAddMultipleIngredients,
  };
}
