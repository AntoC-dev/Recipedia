import {
  cleanIngredientName,
  FuzzyMatchLevel,
  fuzzySearch,
  FuzzySearchResult,
} from '@utils/FuzzySearch';

type TestItem = {
  id: number;
  name: string;
};

describe('FuzzySearch', () => {
  describe('cleanIngredientName', () => {
    it('removes parenthetical content', () => {
      expect(cleanIngredientName('Tomatoes (canned)')).toBe('Tomatoes');
    });

    it('removes multiple parentheses', () => {
      expect(cleanIngredientName('Chicken (boneless) (skinless)')).toBe('Chicken');
    });

    it('handles no parentheses', () => {
      expect(cleanIngredientName('Olive Oil')).toBe('Olive Oil');
    });

    it('trims whitespace', () => {
      expect(cleanIngredientName('  Tomatoes (fresh)  ')).toBe('Tomatoes');
    });

    it('handles empty string', () => {
      expect(cleanIngredientName('')).toBe('');
    });
  });

  describe('fuzzySearch', () => {
    const testItems: TestItem[] = [
      { id: 1, name: 'Chocolate Cake' },
      { id: 2, name: 'Vanilla Cake' },
      { id: 3, name: 'Strawberry Cake' },
      { id: 4, name: 'Apple Pie' },
      { id: 5, name: 'Dessert' },
      { id: 6, name: 'Desert' },
    ];

    const searchByName = (searchValue: string, matchLevel = FuzzyMatchLevel.MODERATE) => {
      return fuzzySearch<TestItem>(testItems, searchValue, item => item.name, matchLevel);
    };

    describe('exact match detection', () => {
      it('finds exact match case-insensitive', () => {
        const result = searchByName('chocolate cake');

        expect(result.exact).toBeDefined();
        expect(result.exact?.id).toBe(1);
        expect(result.similar).toEqual([]);
      });

      it('finds exact match with different case', () => {
        const result = searchByName('VANILLA CAKE');

        expect(result.exact).toBeDefined();
        expect(result.exact?.id).toBe(2);
        expect(result.similar).toEqual([]);
      });

      it('trims whitespace before matching', () => {
        const result = searchByName('  Apple Pie  ');

        expect(result.exact).toBeDefined();
        expect(result.exact?.id).toBe(4);
      });
    });

    describe('fuzzy matching', () => {
      it('finds similar items with typo', () => {
        const result = searchByName('choclate');

        expect(result.exact).toBeUndefined();
        expect(result.similar.length).toBeGreaterThan(0);
        expect(result.similar[0].id).toBe(1);
      });

      it('finds multiple similar items', () => {
        const result = searchByName('cake');

        expect(result.exact).toBeUndefined();
        expect(result.similar.length).toBe(3);
        expect(result.similar.map(i => i.id)).toContain(1);
        expect(result.similar.map(i => i.id)).toContain(2);
        expect(result.similar.map(i => i.id)).toContain(3);
      });

      it('sorts by relevance score', () => {
        const result = searchByName('desrt');

        expect(result.exact).toBeUndefined();
        expect(result.similar.length).toBeGreaterThan(0);
      });
    });

    describe('match levels', () => {
      it('strict level matches only close typos', () => {
        const result = searchByName('choclate', FuzzyMatchLevel.STRICT);

        expect(result.similar.length).toBeLessThanOrEqual(1);
      });

      it('permissive level matches more variations', () => {
        const result = searchByName('choco', FuzzyMatchLevel.PERMISSIVE);

        expect(result.exact).toBeUndefined();
        expect(result.similar.length).toBeGreaterThan(0);
      });

      it('moderate level balances matching', () => {
        const result = searchByName('vanila');

        expect(result.exact).toBeUndefined();
        expect(result.similar.length).toBeGreaterThan(0);
        expect(result.similar[0].id).toBe(2);
      });
    });

    describe('edge cases', () => {
      it('returns empty similar array for empty search', () => {
        const result = searchByName('');

        expect(result.exact).toBeUndefined();
        expect(result.similar).toEqual([]);
      });

      it('returns empty similar array for whitespace search', () => {
        const result = searchByName('   ');

        expect(result.exact).toBeUndefined();
        expect(result.similar).toEqual([]);
      });

      it('handles empty items array', () => {
        const result = fuzzySearch<TestItem>(
          [],
          'chocolate',
          item => item.name,
          FuzzyMatchLevel.MODERATE
        );

        expect(result.exact).toBeUndefined();
        expect(result.similar).toEqual([]);
      });

      it('returns no matches for completely unrelated search', () => {
        const result = searchByName('zzzzzzzzz');

        expect(result.exact).toBeUndefined();
        expect(result.similar).toEqual([]);
      });
    });

    describe('custom getValue function', () => {
      const ingredientItems = [
        { id: 1, name: 'Tomatoes (canned)' },
        { id: 2, name: 'Tomatoes (fresh)' },
        { id: 3, name: 'Potatoes' },
      ];

      const searchIngredients = (searchValue: string, matchLevel = FuzzyMatchLevel.MODERATE) => {
        return fuzzySearch<TestItem>(
          ingredientItems,
          searchValue,
          item => cleanIngredientName(item.name),
          matchLevel
        );
      };

      it('uses getValue to extract searchable string', () => {
        const result = searchIngredients('tomatoes');

        expect(result.exact).toBeDefined();
        expect(result.exact?.name).toContain('Tomatoes');
        expect(result.similar).toEqual([]);
      });

      it('applies getValue transformation for fuzzy matching', () => {
        const result = searchIngredients('tomatoe');

        expect(result.exact).toBeUndefined();
        expect(result.similar.length).toBeGreaterThan(0);
        expect(result.similar.some(item => item.name.includes('Tomatoes'))).toBe(true);
      });
    });

    describe('return type structure', () => {
      it('returns FuzzySearchResult with exact match', () => {
        const result: FuzzySearchResult<TestItem> = searchByName('Dessert');

        expect(result).toHaveProperty('exact');
        expect(result).toHaveProperty('similar');
        expect(result.exact).toBeDefined();
        expect(result.similar).toEqual([]);
      });

      it('returns FuzzySearchResult with similar matches', () => {
        const result: FuzzySearchResult<TestItem> = searchByName('cak');

        expect(result.exact).toBeUndefined();
        expect(result.similar).toBeDefined();
        expect(result.similar.length).toBeGreaterThan(0);
        expect(Array.isArray(result.similar)).toBe(true);
      });
    });

    describe('Unicode normalization', () => {
      const accentedItems: TestItem[] = [
        { id: 1, name: 'Épicé' },
        { id: 2, name: 'Crème fraîche' },
        { id: 3, name: 'Café' },
      ];

      const searchAccented = (searchValue: string) => {
        return fuzzySearch<TestItem>(
          accentedItems,
          searchValue,
          item => item.name,
          FuzzyMatchLevel.STRICT
        );
      };

      it('finds exact match with NFC vs NFD accented characters', () => {
        const nfdSearch = 'Épicé'.normalize('NFD');

        const result = searchAccented(nfdSearch);

        expect(result.exact).toBeDefined();
        expect(result.exact?.id).toBe(1);
      });

      it('finds exact match when database has NFD and search has NFC', () => {
        const nfdItems: TestItem[] = [{ id: 1, name: 'Épicé'.normalize('NFD') }];

        const result = fuzzySearch<TestItem>(
          nfdItems,
          'Épicé',
          item => item.name,
          FuzzyMatchLevel.STRICT
        );

        expect(result.exact).toBeDefined();
      });

      it('handles multiple accented characters', () => {
        const nfdSearch = 'Crème fraîche'.normalize('NFD');

        const result = searchAccented(nfdSearch);

        expect(result.exact).toBeDefined();
        expect(result.exact?.id).toBe(2);
      });
    });
  });
});
