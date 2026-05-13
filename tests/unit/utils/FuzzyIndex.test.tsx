import {
  buildFuzzyIndex,
  buildItemIndex,
  buildPhraseIndex,
  fuzzyHasMatch,
  fuzzySearchIds,
  searchItems,
  searchItemsDetailed,
  wholePhraseTokenizer,
} from '@utils/FuzzyIndex';
import {
  ingredientTableElement,
  ingredientType,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { cleanIngredientName } from '@utils/NutritionUtils';

const makeTag = (id: number, name: string): tagTableElement => ({ id, name });

const makeIngredient = (id: number, name: string): ingredientTableElement => ({
  id,
  name,
  unit: 'g',
  type: ingredientType.vegetable,
  season: [],
});

const makeRecipe = (id: number, title: string): recipeTableElement => ({
  id,
  image_Source: '',
  title,
  description: '',
  tags: [],
  persons: 4,
  ingredients: [],
  season: [],
  preparation: [],
  time: 30,
});

describe('FuzzyIndex', () => {
  describe('wholePhraseTokenizer', () => {
    it('emits the input as a single token', () => {
      expect(wholePhraseTokenizer('matières grasses')).toEqual(['matières grasses']);
    });

    it('emits no tokens for an empty string', () => {
      expect(wholePhraseTokenizer('')).toEqual([]);
    });
  });

  describe('buildFuzzyIndex + fuzzySearchIds', () => {
    it('returns matching corpus indices in relevance order', () => {
      const corpus = ['Italian', 'Italian Cuisine', 'Quick Meals', 'Dessert'];
      const index = buildFuzzyIndex(corpus, { fuzzy: 0.2 });
      const ids = fuzzySearchIds(index, 'Italian');
      expect(ids).toContain(0);
      expect(ids).toContain(1);
    });

    it('returns an empty array for empty / whitespace queries', () => {
      const index = buildFuzzyIndex(['A', 'B'], { fuzzy: 0.2 });
      expect(fuzzySearchIds(index, '')).toEqual([]);
      expect(fuzzySearchIds(index, '   ')).toEqual([]);
    });

    it('returns an empty array for an unrelated query', () => {
      const index = buildFuzzyIndex(['Italian', 'Dessert'], { fuzzy: 0.2 });
      expect(fuzzySearchIds(index, 'zzqxqxqx')).toEqual([]);
    });

    it('honors a custom processTerm', () => {
      const lowerOnly = (term: string) => term.toLowerCase();
      const index = buildFuzzyIndex(['ITALIAN'], { fuzzy: 0.2, processTerm: lowerOnly });
      expect(fuzzySearchIds(index, 'italian')).toEqual([0]);
    });
  });

  describe('fuzzyHasMatch', () => {
    it('returns true when any document matches', () => {
      const index = buildFuzzyIndex(['Italian'], { fuzzy: 0.2 });
      expect(fuzzyHasMatch(index, 'Italian')).toBe(true);
    });

    it('returns false for an unrelated query', () => {
      const index = buildFuzzyIndex(['Italian'], { fuzzy: 0.2 });
      expect(fuzzyHasMatch(index, 'zzqxqxqx')).toBe(false);
    });

    it('returns false for empty / whitespace queries', () => {
      const index = buildFuzzyIndex(['Italian'], { fuzzy: 0.2 });
      expect(fuzzyHasMatch(index, '')).toBe(false);
      expect(fuzzyHasMatch(index, '   ')).toBe(false);
    });

    it('returns false when corpus is empty', () => {
      const index = buildFuzzyIndex([], { fuzzy: 0.2 });
      expect(fuzzyHasMatch(index, 'anything')).toBe(false);
    });
  });

  describe('buildFuzzyIndex options', () => {
    it('honors combineWith=AND across multi-token queries', () => {
      const index = buildFuzzyIndex(['cherry tomato', 'cherry juice', 'apple'], {
        fuzzy: 0.1,
        prefix: false,
        combineWith: 'AND',
      });
      const ids = fuzzySearchIds(index, 'cherry tomato');
      expect(ids).toEqual([0]);
    });

    it('honors prefix=false (no prefix matches)', () => {
      const index = buildFuzzyIndex(['italian', 'italiano'], {
        fuzzy: 0.1,
        prefix: false,
      });
      const ids = fuzzySearchIds(index, 'ital');
      expect(ids).toEqual([]);
    });

    it('drops indexed entries whose only tokens get filtered to null by processTerm', () => {
      const index = buildFuzzyIndex(['   ', 'Italian'], {
        fuzzy: 0.2,
        processTerm: term => term.trim() || null,
      });
      expect(fuzzySearchIds(index, 'Italian')).toEqual([1]);
      expect(fuzzySearchIds(index, '   ')).toEqual([]);
    });
  });

  describe('buildPhraseIndex', () => {
    it('matches a phrase when the indexed entry is a prefix of the query', () => {
      const index = buildPhraseIndex(['pour 100g'], 0.2);
      expect(fuzzyHasMatch(index, 'pour')).toBe(true);
      expect(fuzzyHasMatch(index, 'pour 100g')).toBe(true);
    });

    it('tolerates typos within the phrase', () => {
      const index = buildPhraseIndex(['pour 100g'], 0.2);
      expect(fuzzyHasMatch(index, 'pour 10og')).toBe(true);
    });

    it('rejects unrelated queries', () => {
      const index = buildPhraseIndex(['pour 100g'], 0.2);
      expect(fuzzyHasMatch(index, '218 kcal')).toBe(false);
    });

    it('does not match a query much longer than the indexed phrase', () => {
      const index = buildPhraseIndex(['pour 100g'], 0.2);
      expect(fuzzyHasMatch(index, 'pour 100 g 1937 kj 463 kcal')).toBe(false);
    });

    it('matches case-insensitively', () => {
      const index = buildPhraseIndex(['Matières Grasses'], 0.2);
      expect(fuzzyHasMatch(index, 'matières grasses')).toBe(true);
    });

    it('drops indexed entries that normalize to empty (whitespace-only)', () => {
      const index = buildPhraseIndex(['   ', 'Matières Grasses'], 0.2);
      expect(fuzzyHasMatch(index, '   ')).toBe(false);
      expect(fuzzyHasMatch(index, 'matières grasses')).toBe(true);
    });
  });

  describe('searchItems on tags', () => {
    const tags: tagTableElement[] = [
      makeTag(1, 'Italian'),
      makeTag(2, 'Italian Cuisine'),
      makeTag(3, 'Quick Meals'),
      makeTag(4, 'Dessert'),
      makeTag(5, 'Desert'),
      makeTag(6, 'Vegetarian'),
    ];

    it('returns the exact match alone when the query matches a tag', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'Italian')).toEqual([makeTag(1, 'Italian')]);
    });

    it('matches case-insensitively for exact match', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'DESSERT')).toEqual([makeTag(4, 'Dessert')]);
    });

    it('trims whitespace before matching', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, '  Vegetarian  ')).toEqual([makeTag(6, 'Vegetarian')]);
    });

    it('finds similar tags on a typo', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const names = searchItems(index, 'Italan').map(t => t.name);
      expect(names).toContain('Italian');
    });

    it('returns an empty array for an empty query', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, '')).toEqual([]);
      expect(searchItems(index, '   ')).toEqual([]);
    });

    it('returns an empty array for an unrelated query', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'zzqxqxqx')).toEqual([]);
    });

    it('returns an empty array when corpus is empty', () => {
      const index = buildItemIndex<tagTableElement>([], { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'anything')).toEqual([]);
    });

    it('matches NFD-encoded query against NFC-encoded tag', () => {
      const accentedTags = [makeTag(1, 'Épicé'), makeTag(2, 'Café')];
      const index = buildItemIndex(accentedTags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'Épicé'.normalize('NFD'))).toEqual([accentedTags[0]]);
    });

    it('handles items whose name normalizes to an empty string', () => {
      const taggedItems = [makeTag(1, '   '), makeTag(2, 'Italian')];
      const index = buildItemIndex(taggedItems, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'Italian').map(t => t.name)).toContain('Italian');
    });

    it("does not match short query tokens (Europe de l'Est ≠ Dessert)", () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const names = searchItems(index, "Europe de l'Est").map(t => t.name);
      expect(names).not.toContain('Dessert');
      expect(names).not.toContain('Desert');
    });

    it('does not match a query whose only meaningful token is < 3 chars', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'de')).toEqual([]);
      expect(searchItems(index, "l'")).toEqual([]);
    });

    it('still returns an exact-name match even when the name is shorter than the min token length', () => {
      const shortTags = [makeTag(1, 'Or'), makeTag(2, 'Italian')];
      const index = buildItemIndex(shortTags, { fuzzy: 0.2, getName: t => t.name });
      expect(searchItems(index, 'Or')).toEqual([shortTags[0]]);
    });
  });

  describe('searchItems on ingredients with preprocess', () => {
    const ingredients: ingredientTableElement[] = [
      makeIngredient(1, 'Tomato (canned)'),
      makeIngredient(2, 'Cherry Tomato'),
      makeIngredient(3, 'Chicken'),
      makeIngredient(4, 'Onion'),
    ];

    const makeIndex = () =>
      buildItemIndex(ingredients, {
        fuzzy: 0.2,
        getName: i => i.name,
        preprocess: cleanIngredientName,
      });

    it('matches a clean query against a parenthesized stored name', () => {
      expect(searchItems(makeIndex(), 'Tomato')).toEqual([ingredients[0]]);
    });

    it('strips parentheses from the query before searching', () => {
      const names = searchItems(makeIndex(), 'Tomato (fresh)').map(i => i.name);
      expect(names.length).toBeGreaterThan(0);
      expect(names.some(n => n.includes('Tomato'))).toBe(true);
    });

    it('handles a typo in the query', () => {
      const names = searchItems(makeIndex(), 'Tomatoe').map(i => i.name);
      expect(names.some(n => n.includes('Tomato'))).toBe(true);
    });

    it('matches an ingredient with extra qualifier words in the query', () => {
      const names = searchItems(makeIndex(), 'Fresh cherry tomatoes').map(i => i.name);
      expect(names).toContain('Cherry Tomato');
    });

    it('returns no matches for an unrelated query', () => {
      expect(searchItems(makeIndex(), 'pneumatic widget')).toEqual([]);
    });
  });

  describe('searchItemsDetailed', () => {
    const tags: tagTableElement[] = [
      makeTag(1, 'Italian'),
      makeTag(2, 'Italian Cuisine'),
      makeTag(3, 'Dessert'),
    ];

    it('returns exact match in the exact field when query matches a tag', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, 'Italian');
      expect(result.exact).toEqual(makeTag(1, 'Italian'));
      expect(result.similar).toEqual([]);
    });

    it('returns exact match case-insensitively', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, 'dessert');
      expect(result.exact).toEqual(makeTag(3, 'Dessert'));
      expect(result.similar).toEqual([]);
    });

    it('returns similar matches when no exact match', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, 'Italan');
      expect(result.exact).toBeUndefined();
      expect(result.similar.map(t => t.name)).toContain('Italian');
    });

    it('returns empty result for an empty query', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, '');
      expect(result.exact).toBeUndefined();
      expect(result.similar).toEqual([]);
    });

    it('returns empty result for an unrelated query', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, 'zzqxqxqx');
      expect(result.exact).toBeUndefined();
      expect(result.similar).toEqual([]);
    });

    it('returns empty result for a whitespace-only query', () => {
      const index = buildItemIndex(tags, { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, '   ');
      expect(result.exact).toBeUndefined();
      expect(result.similar).toEqual([]);
    });

    it('returns empty result when corpus is empty', () => {
      const index = buildItemIndex<tagTableElement>([], { fuzzy: 0.2, getName: t => t.name });
      const result = searchItemsDetailed(index, 'anything');
      expect(result.exact).toBeUndefined();
      expect(result.similar).toEqual([]);
    });

    it('returns exact match via preprocess (cleaned ingredient name)', () => {
      const ingredients: ingredientTableElement[] = [
        makeIngredient(1, 'Tomato (canned)'),
        makeIngredient(2, 'Chicken'),
      ];
      const index = buildItemIndex(ingredients, {
        fuzzy: 0.2,
        getName: i => i.name,
        preprocess: cleanIngredientName,
      });
      const result = searchItemsDetailed(index, 'Tomato (fresh)');
      expect(result.exact?.name).toBe('Tomato (canned)');
      expect(result.similar).toEqual([]);
    });
  });

  describe('searchItems on recipe titles', () => {
    const recipes: recipeTableElement[] = [
      makeRecipe(1, 'Spaghetti Bolognese'),
      makeRecipe(2, 'Chicken Tikka Masala'),
      makeRecipe(3, 'Vegetable Stir Fry'),
      makeRecipe(4, 'Beef Stew'),
    ];

    it('returns exact match alone when title matches', () => {
      const index = buildItemIndex(recipes, { fuzzy: 0.3, getName: r => r.title });
      expect(searchItems(index, 'Beef Stew')).toEqual([recipes[3]]);
    });

    it('finds permissive matches on typos and extra words', () => {
      const index = buildItemIndex(recipes, { fuzzy: 0.3, getName: r => r.title });
      const titles = searchItems(index, 'Spaghetti Bolognase').map(r => r.title);
      expect(titles).toContain('Spaghetti Bolognese');
    });

    it('returns an empty array for an empty query', () => {
      const index = buildItemIndex(recipes, { fuzzy: 0.3, getName: r => r.title });
      expect(searchItems(index, '')).toEqual([]);
    });
  });
});
