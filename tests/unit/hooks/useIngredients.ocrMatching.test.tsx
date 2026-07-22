import { renderHook } from '@testing-library/react-native';
import { useIngredients } from '@hooks/useIngredients';
import RecipeDatabase from '@utils/RecipeDatabase';
import { IngredientDraft, ingredientType } from '@customTypes/DatabaseElementTypes';

const makeIngredient = (name: string): IngredientDraft => ({
  name,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [],
});

const quitoqueIngredients: IngredientDraft[] = [
  'Carotte',
  'Cumin',
  'Merguez',
  'Navet',
  'Pommes de terre jaunes',
  'Sauce soja',
  'Huile de sésame',
  'Filet de poulet',
  'Gomasio',
  'Épices Cachemire',
  'Pois chiches',
  'Purée de tomates',
  'Riz basmati Bio',
].map(makeIngredient);

describe('useIngredients OCR fuzzy matching for French ingredient names', () => {
  let database: RecipeDatabase;

  beforeEach(async () => {
    database = RecipeDatabase.getInstance();
    await database.init();
    await database.addMultipleIngredients(quitoqueIngredients);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('exact-name matches (canonical OCR output)', () => {
    test.each([
      ['pommes de terre jaunes', 'Pommes de terre jaunes'],
      ['sauce soja', 'Sauce soja'],
      ['huile de sésame', 'Huile de sésame'],
      ['filet de poulet', 'Filet de poulet'],
      ['gomasio', 'Gomasio'],
      ['pois chiches', 'Pois chiches'],
      ['purée de tomates', 'Purée de tomates'],
      ['riz basmati bio', 'Riz basmati Bio'],
      ['épices cachemire', 'Épices Cachemire'],
    ])('matches "%s" → "%s" via detailed exact', (query, expected) => {
      const { result } = renderHook(() => useIngredients());
      const detailed = result.current.findSimilarIngredientsDetailed(query);
      expect(detailed.exact?.name).toBe(expected);
    });
  });

  describe('OCR noise tolerance', () => {
    test('matches name with trailing iOS OCR garbage', () => {
      const { result } = renderHook(() => useIngredients());
      const matches = result.current.findSimilarIngredients('pommes de terre jaunes (g');
      expect(matches.map(i => i.name)).toContain('Pommes de terre jaunes');
    });

    test('matches accented name when OCR dropped diacritics', () => {
      const { result } = renderHook(() => useIngredients());
      const matches = result.current.findSimilarIngredients('puree de tomates');
      expect(matches.map(i => i.name)).toContain('Purée de tomates');
    });

    test('matches accented name when OCR dropped diacritics on capital', () => {
      const { result } = renderHook(() => useIngredients());
      const matches = result.current.findSimilarIngredients('epices cachemire');
      expect(matches.map(i => i.name)).toContain('Épices Cachemire');
    });

    test('matches single-token name with minor OCR typo', () => {
      const { result } = renderHook(() => useIngredients());
      const matches = result.current.findSimilarIngredients('gomasio');
      expect(matches.map(i => i.name)).toContain('Gomasio');
    });
  });

  describe('discrimination', () => {
    test('does not return unrelated ingredients for an unknown query', () => {
      const { result } = renderHook(() => useIngredients());
      const matches = result.current.findSimilarIngredients('xyz unrelated string');
      expect(matches).toEqual([]);
    });

    test('returns Riz basmati Bio for partial query "basmati"', () => {
      const { result } = renderHook(() => useIngredients());
      const matches = result.current.findSimilarIngredients('basmati');
      expect(matches.map(i => i.name)).toContain('Riz basmati Bio');
    });
  });
});
