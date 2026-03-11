import i18n from '@utils/i18n';
import { act, renderHook } from '@testing-library/react-native';
import { useFiltersCategories, useShoppingCategories } from '@hooks/useCategories';
import { ingredientType } from '@customTypes/DatabaseElementTypes';
import { listFilter } from '@customTypes/RecipeFiltersTypes';

jest.unmock('@utils/i18n');

beforeAll(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

beforeEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

describe('useShoppingCategories', () => {
  test('returns all ingredient types', () => {
    const { result } = renderHook(() => useShoppingCategories());
    expect(result.current).toHaveLength(Object.values(ingredientType).length);
    expect(result.current).toEqual(expect.arrayContaining(Object.values(ingredientType)));
  });

  test('sorts by English translated name in English', () => {
    const { result } = renderHook(() => useShoppingCategories());
    const categories = result.current;
    expect(categories.indexOf(ingredientType.baking)).toBeLessThan(
      categories.indexOf(ingredientType.bread)
    );
    expect(categories.indexOf(ingredientType.sauce)).toBeLessThan(
      categories.indexOf(ingredientType.seafood)
    );
  });

  test('re-sorts by French translated name when language changes', async () => {
    const { result } = renderHook(() => useShoppingCategories());

    expect(result.current.indexOf(ingredientType.sauce)).toBeLessThan(
      result.current.indexOf(ingredientType.seafood)
    );

    await act(async () => {
      await i18n.changeLanguage('fr');
    });

    expect(result.current.indexOf(ingredientType.seafood)).toBeLessThan(
      result.current.indexOf(ingredientType.sauce)
    );
  });
});

describe('useFiltersCategories', () => {
  test('returns all list filter values', () => {
    const { result } = renderHook(() => useFiltersCategories());
    expect(result.current).toHaveLength(Object.values(listFilter).length);
    expect(result.current).toEqual(expect.arrayContaining(Object.values(listFilter)));
  });

  test('sorts by English translated name in English', () => {
    const { result } = renderHook(() => useFiltersCategories());
    const categories = result.current;
    expect(categories.indexOf(ingredientType.baking)).toBeLessThan(
      categories.indexOf(ingredientType.bread)
    );
    expect(categories.indexOf(ingredientType.sauce)).toBeLessThan(
      categories.indexOf(ingredientType.seafood)
    );
  });

  test('re-sorts by French translated name when language changes', async () => {
    const { result } = renderHook(() => useFiltersCategories());

    expect(result.current.indexOf(ingredientType.sauce)).toBeLessThan(
      result.current.indexOf(ingredientType.seafood)
    );

    await act(async () => {
      await i18n.changeLanguage('fr');
    });

    expect(result.current.indexOf(ingredientType.seafood)).toBeLessThan(
      result.current.indexOf(ingredientType.sauce)
    );
  });
});
