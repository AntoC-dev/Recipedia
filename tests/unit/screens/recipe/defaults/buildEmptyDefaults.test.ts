import { buildEmptyDefaults } from '@screens/recipe/defaults/buildEmptyDefaults';
import { defaultValueNumber } from '@utils/Constants';
import { mockGetDefaultPersonsSync } from '@mocks/utils/settings-mock';

describe('buildEmptyDefaults', () => {
  afterEach(() => {
    mockGetDefaultPersonsSync.mockReturnValue(4);
  });

  test('sources recipePersons from the synchronous default-persons cache', () => {
    mockGetDefaultPersonsSync.mockReturnValue(7);
    expect(buildEmptyDefaults().recipePersons).toBe(7);
  });

  test('returns an otherwise empty form shape', () => {
    mockGetDefaultPersonsSync.mockReturnValue(4);
    expect(buildEmptyDefaults()).toEqual({
      recipeImage: '',
      recipeTitle: '',
      recipeDescription: '',
      recipeTags: [],
      recipePersons: 4,
      recipeIngredients: [],
      recipePreparation: [],
      recipeTime: defaultValueNumber,
      recipeNutrition: undefined,
    });
  });
});
