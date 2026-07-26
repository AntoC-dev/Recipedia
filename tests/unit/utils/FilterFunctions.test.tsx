import {
  addValueToMultimap,
  editTitleInMultimap,
  extractFilteredRecipeDatas,
  filterFromRecipe,
  filterRecipesByCurrentSeason,
  fisherYatesShuffle,
  generateHomeRecommendations,
  getRandomRecipes,
  isRecipeInCurrentSeason,
  removeTitleInMultimap,
  removeValueToMultimap,
  retrieveAllFilters,
} from '@utils/FilterFunctions';
import {
  listFilter,
  prepTimeValues,
  RecommendationType,
  TListFilter,
} from '@customTypes/RecipeFiltersTypes';
import { testRecipes } from '@test-data/recipesDataset';
import {
  ingredientTableElement,
  ingredientType,
  isIngredientEqual,
  recipeTableElement,
} from '@customTypes/DatabaseElementTypes';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { useI18n } from '@utils/i18n';
import RecipeDatabase from '@utils/RecipeDatabase';

describe('FilterFunctions', () => {
  const { t } = useI18n();

  const titlesOf = (recipes: recipeTableElement[]): string[] => recipes.map(recipe => recipe.title);
  const allTitles = titlesOf(testRecipes);
  const filtersOf = (...entries: [TListFilter, string[]][]): Map<TListFilter, string[]> =>
    new Map<TListFilter, string[]>(entries);
  const filterTitles = (filters: Map<TListFilter, string[]>): string[] =>
    titlesOf(filterFromRecipe(testRecipes, filters, t));
  const cheeseIngredientNames = testIngredients
    .filter(ingredient => ingredient.type === listFilter.cheese)
    .map(ingredient => ingredient.name);
  const mixedFilters = (): Map<TListFilter, string[]> =>
    filtersOf(
      [listFilter.prepTime, [prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']]
    );

  test('extractFilteredRecipeDatas extracts and sorts data', () => {
    let [resTitles, resIngredients, resTags] = extractFilteredRecipeDatas(
      Array<recipeTableElement>(testRecipes[0]!)
    );
    let expectedTags = testRecipes[0]!.tags.map(tag => tag.name).sort();
    let expectedIngredient = [...testRecipes[0]!.ingredients].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    expect(resTitles).toEqual([testRecipes[0]!.title]);
    expect(resTags).toEqual(expectedTags);
    expect(resIngredients).toEqual(expectedIngredient);

    [resTitles, resIngredients, resTags] = extractFilteredRecipeDatas(
      Array<recipeTableElement>(testRecipes[0]!, testRecipes[8]!)
    );
    expectedTags = [
      ...testRecipes[0]!.tags.map(tag => tag.name),
      ...testRecipes[8]!.tags.map(tag => tag.name),
    ].sort();
    expectedIngredient = [...testRecipes[0]!.ingredients, ...testRecipes[8]!.ingredients]
      .filter((elem: ingredientTableElement, index: number, self: ingredientTableElement[]) => {
        return index == self.indexOf(elem);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    expect(resTitles).toEqual([testRecipes[0]!.title, testRecipes[8]!.title]);
    expect(resTags).toEqual(expectedTags);
    expect(resIngredients).toEqual(expectedIngredient);

    [resTitles, resIngredients, resTags] = extractFilteredRecipeDatas(testRecipes);
    let expectedTitles = new Array<string>();
    expectedTags.splice(0);
    expectedIngredient.splice(0);

    for (const dataset of testRecipes) {
      expectedTitles = [...expectedTitles, dataset.title];
      expectedTags = [...expectedTags, ...dataset.tags.map(tag => tag.name)];
      for (const ingredient of dataset.ingredients) {
        if (
          expectedIngredient.find(previousIng => isIngredientEqual(previousIng, ingredient)) ===
          undefined
        ) {
          expectedIngredient.push(ingredient);
        }
      }
    }

    expectedTitles.sort();
    expectedTags = expectedTags
      .filter((elem: string, index: number, self: string[]) => index == self.indexOf(elem))
      .sort();
    expectedIngredient = expectedIngredient
      .filter(
        (elem: ingredientTableElement, index: number, self: ingredientTableElement[]) =>
          index == self.indexOf(elem)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    expect(resTitles).toEqual(expectedTitles);
    expect(resTags).toEqual(expectedTags);
    expect(resIngredients).toEqual(expectedIngredient);

    [resTitles, resIngredients, resTags] = extractFilteredRecipeDatas([]);
    expect(resTitles).toEqual([]);
    expect(resTags).toEqual([]);
    expect(resIngredients).toEqual([]);
  });

  test('extractFilteredRecipeDatas returns all ingredients sorted by name', () => {
    const recipesWithMultiplePoultry: recipeTableElement[] = [
      {
        ...testRecipes[0]!,
        ingredients: [
          {
            id: 101,
            name: 'Turkey',
            unit: 'g',
            type: ingredientType.poultry,
            season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            quantity: '200',
          },
          {
            id: 102,
            name: 'Chicken',
            unit: 'g',
            type: ingredientType.poultry,
            season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            quantity: '300',
          },
          {
            id: 103,
            name: 'Duck',
            unit: 'g',
            type: ingredientType.poultry,
            season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            quantity: '150',
          },
          {
            id: 104,
            name: 'Goose',
            unit: 'g',
            type: ingredientType.poultry,
            season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            quantity: '400',
          },
          {
            id: 105,
            name: 'Pheasant',
            unit: 'g',
            type: ingredientType.poultry,
            season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            quantity: '250',
          },
        ],
      },
    ];

    const [, resIngredients] = extractFilteredRecipeDatas(recipesWithMultiplePoultry);

    expect(resIngredients).toHaveLength(5);
    expect(resIngredients.map(i => i.name)).toEqual([
      'Chicken',
      'Duck',
      'Goose',
      'Pheasant',
      'Turkey',
    ]);
  });

  test('extractFilteredRecipeDatas returns titles sorted alphabetically', () => {
    const recipesWithUnsortedTitles: recipeTableElement[] = [
      { ...testRecipes[0]!, title: 'Zucchini Soup' },
      { ...testRecipes[1]!, title: 'Apple Pie' },
      { ...testRecipes[2]!, title: 'Mango Salad' },
      { ...testRecipes[3]!, title: 'Banana Bread' },
    ];

    const [resTitles] = extractFilteredRecipeDatas(recipesWithUnsortedTitles);

    expect(resTitles).toHaveLength(4);
    expect(resTitles).toEqual(['Apple Pie', 'Banana Bread', 'Mango Salad', 'Zucchini Soup']);
  });

  test('extractFilteredRecipeDatas returns tags sorted alphabetically', () => {
    const recipesWithUnsortedTags: recipeTableElement[] = [
      {
        ...testRecipes[0]!,
        tags: [
          { id: 1, name: 'Vegetarian' },
          { id: 2, name: 'Asian' },
          { id: 3, name: 'Quick' },
        ],
      },
      {
        ...testRecipes[1]!,
        tags: [
          { id: 4, name: 'Dessert' },
          { id: 5, name: 'Breakfast' },
        ],
      },
    ];

    const [, , resTags] = extractFilteredRecipeDatas(recipesWithUnsortedTags);

    expect(resTags).toHaveLength(5);
    expect(resTags).toEqual(['Asian', 'Breakfast', 'Dessert', 'Quick', 'Vegetarian']);
  });

  test('filterFromRecipe with empty filters returns the input array unchanged', () => {
    expect(filterFromRecipe(testRecipes, filtersOf(), t)).toEqual(testRecipes);
  });

  test('filterFromRecipe with only preparation time filters', () => {
    const filters = filtersOf([listFilter.prepTime, [prepTimeValues[2]!]]);
    const selectedTimes = filters.get(listFilter.prepTime) as string[];

    expect(filterTitles(filters)).toEqual([
      'Chicken Tacos',
      'Caesar Salad',
      'Margherita Pizza',
      'Pesto Pasta',
    ]);

    selectedTimes.push(prepTimeValues[7]!);
    expect(filterTitles(filters)).toEqual([
      'Chicken Tacos',
      'Caesar Salad',
      'Margherita Pizza',
      'Chocolate Cake',
      'Pesto Pasta',
    ]);

    selectedTimes.push(prepTimeValues[0]!);
    expect(filterTitles(filters)).toEqual([
      'Chicken Tacos',
      'Caesar Salad',
      'Margherita Pizza',
      'Chocolate Cake',
      'Pesto Pasta',
    ]);

    selectedTimes.push(prepTimeValues[5]!);
    expect(filterTitles(filters)).toEqual([
      'Spaghetti Bolognese',
      'Chicken Tacos',
      'Caesar Salad',
      'Margherita Pizza',
      'Vegetable Soup',
      'Chocolate Cake',
      'Pesto Pasta',
      'Lentil Curry',
    ]);

    selectedTimes.push(prepTimeValues[3]!);
    expect(filterTitles(filters)).toEqual([
      'Spaghetti Bolognese',
      'Chicken Tacos',
      'Classic Pancakes',
      'Caesar Salad',
      'Margherita Pizza',
      'Vegetable Soup',
      'Chocolate Cake',
      'Pesto Pasta',
      'Lentil Curry',
    ]);

    selectedTimes.push(prepTimeValues[6]!);
    expect(filterTitles(filters)).toEqual(allTitles);

    selectedTimes.push(prepTimeValues[1]!);
    expect(filterTitles(filters)).toEqual(allTitles);

    selectedTimes.push(prepTimeValues[4]!);
    expect(filterTitles(filters)).toEqual(allTitles);
  });

  test('filterFromRecipe with only season filters', () => {
    const filters = filtersOf([listFilter.inSeason, ['seasonal']]);
    expect(filterFromRecipe(testRecipes, filters, t)).toEqual(
      filterRecipesByCurrentSeason(testRecipes)
    );
  });

  test('filterFromRecipe with only tags filters', () => {
    const filters = filtersOf([listFilter.tags, ['not existing']]);

    expect(filterTitles(filters)).toEqual([]);

    addValueToMultimap(filters, listFilter.tags, 'Indian');
    expect(filterTitles(filters)).toEqual(['Lentil Curry']);

    addValueToMultimap(filters, listFilter.tags, 'Italian');
    expect(filterTitles(filters)).toEqual([
      'Spaghetti Bolognese',
      'Margherita Pizza',
      'Pesto Pasta',
      'Lentil Curry',
    ]);

    testTags.forEach(tag => addValueToMultimap(filters, listFilter.tags, tag.name));
    expect(filterTitles(filters)).toEqual(allTitles);
  });

  test('filterFromRecipe with only title filters', () => {
    const filters = filtersOf([listFilter.recipeTitleInclude, ['Pesto Pasta']]);
    const titleFilter = filters.get(listFilter.recipeTitleInclude) as string[];

    expect(filterTitles(filters)).toEqual(['Pesto Pasta']);

    titleFilter.splice(0);
    titleFilter.push('Tacos');
    expect(filterTitles(filters)).toEqual(['Chicken Tacos']);

    titleFilter.splice(0);
    titleFilter.push('e');
    expect(filterTitles(filters)).toEqual([
      'Spaghetti Bolognese',
      'Chicken Tacos',
      'Classic Pancakes',
      'Caesar Salad',
      'Margherita Pizza',
      'Vegetable Soup',
      'Chocolate Cake',
      'Pesto Pasta',
      'Lentil Curry',
    ]);
  });

  test('filterFromRecipe with only ingredient type filters', () => {
    const filters = filtersOf([listFilter.cheese, cheeseIngredientNames]);

    expect(filterTitles(filters)).toEqual([
      'Spaghetti Bolognese',
      'Chicken Tacos',
      'Caesar Salad',
      'Margherita Pizza',
      'Pesto Pasta',
    ]);

    addValueToMultimap(filters, listFilter.cereal, 'Taco Shells');
    expect(filterTitles(filters)).toEqual(['Chicken Tacos']);

    addValueToMultimap(filters, listFilter.poultry, 'Chicken Breast');
    expect(filterTitles(filters)).toEqual(['Chicken Tacos']);
  });

  test('filterFromRecipe with mixed filters also exercises addValueToMultimap', () => {
    const filters = filtersOf([listFilter.cheese, cheeseIngredientNames]);

    expect(filterTitles(filters)).toEqual([
      'Spaghetti Bolognese',
      'Chicken Tacos',
      'Caesar Salad',
      'Margherita Pizza',
      'Pesto Pasta',
    ]);

    addValueToMultimap(filters, listFilter.recipeTitleInclude, 'o');
    expect(filterTitles(filters)).toEqual(['Spaghetti Bolognese', 'Chicken Tacos', 'Pesto Pasta']);

    addValueToMultimap(filters, listFilter.tags, 'Mexican');
    expect(filterTitles(filters)).toEqual(['Chicken Tacos']);

    addValueToMultimap(filters, listFilter.tags, 'Lunch');
    expect(filterTitles(filters)).toEqual(['Chicken Tacos']);
  });

  test('removeValueToMultimap shall effectively remove from the multimap the asked value', () => {
    const consoleWarningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const filtersMixed = mixedFilters();

    const workingFilters = new Map<TListFilter, string[]>(filtersMixed);
    removeValueToMultimap(workingFilters, listFilter.recipeTitleInclude, 'A title');
    expect(workingFilters).toEqual(filtersMixed);

    removeValueToMultimap(workingFilters, listFilter.recipeTitleInclude, 'Quick Meal');
    expect(workingFilters).toEqual(filtersMixed);

    consoleWarningSpy.mockReset();

    removeValueToMultimap(workingFilters, listFilter.tags, 'quick meal');
    expect(workingFilters).toEqual(filtersMixed);

    removeValueToMultimap(workingFilters, listFilter.tags, 'Quick Meal');
    let expectedMultiMap = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
    ]);
    expect(workingFilters).toEqual(expectedMultiMap);

    removeValueToMultimap(workingFilters, listFilter.purchased, 'false');
    expectedMultiMap = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!]],
      [listFilter.purchased, ['true']],
      [listFilter.cereal, ['Pasta']],
    ]);
    expect(workingFilters).toEqual(expectedMultiMap);

    removeValueToMultimap(workingFilters, listFilter.purchased, 'true');
    expectedMultiMap = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!]],
      [listFilter.cereal, ['Pasta']],
    ]);
    expect(workingFilters).toEqual(expectedMultiMap);

    removeValueToMultimap(workingFilters, listFilter.prepTime, prepTimeValues[3]);
    expectedMultiMap = new Map<TListFilter, string[]>([[listFilter.cereal, ['Pasta']]]);
    expect(workingFilters).toEqual(expectedMultiMap);

    removeValueToMultimap(workingFilters, listFilter.cereal, 'Pasta');
    expect(workingFilters.size).toEqual(0);
    expect(workingFilters).toEqual(new Map<TListFilter, string[]>());
  });

  test('retrieveAllFilters shall return an array of string filters', () => {
    const filtersMixed = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
    ]);
    const expectedResult = new Array<string>(
      prepTimeValues[3]!,
      prepTimeValues[3]!,
      'true',
      'false',
      'Pasta',
      'Quick Meal'
    );

    expect(retrieveAllFilters(filtersMixed)).toEqual(expectedResult);

    expect(retrieveAllFilters(new Map<TListFilter, string[]>())).toEqual(new Array<string>());
  });

  test('editTitleInMultimap shall do the edit it is supposed to do', () => {
    let filtersMixed = new Map<TListFilter, string[]>([
      [listFilter.recipeTitleInclude, ['First Title', 'Second Title']],
    ]);

    let expectedResult = new Map<TListFilter, string[]>([
      [listFilter.recipeTitleInclude, ['First Title', 'Second Title']],
    ]);

    editTitleInMultimap(filtersMixed, 'Edited title');
    expect(filtersMixed).toEqual(expectedResult);

    filtersMixed = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
    ]);
    expectedResult = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
      [listFilter.recipeTitleInclude, ['New title']],
    ]);

    editTitleInMultimap(filtersMixed, 'New title');
    expect(filtersMixed).toEqual(expectedResult);

    filtersMixed = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
      [listFilter.recipeTitleInclude, ['A recipe title']],
    ]);

    editTitleInMultimap(filtersMixed, 'New title');
    expect(filtersMixed).toEqual(expectedResult);
  });

  test('removeTitleInMultimap shall remove the title given  if it exist', () => {
    let filtersMixed = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
    ]);
    let expectedResult = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
    ]);

    removeTitleInMultimap(filtersMixed);
    expect(filtersMixed).toEqual(expectedResult);

    filtersMixed = new Map<TListFilter, string[]>([
      [listFilter.prepTime, [prepTimeValues[3]!, prepTimeValues[3]!]],
      [listFilter.purchased, ['true', 'false']],
      [listFilter.cereal, ['Pasta']],
      [listFilter.tags, ['Quick Meal']],
      [listFilter.recipeTitleInclude, ['A recipe title']],
    ]);

    removeTitleInMultimap(filtersMixed);
    expect(filtersMixed).toEqual(expectedResult);
  });

  describe('Seasonal filtering functions', () => {
    const currentMonth = new Date().getMonth() + 1;
    const otherMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    test('isRecipeInCurrentSeason returns true for current month recipes', () => {
      const seasonalRecipe: recipeTableElement = {
        ...testRecipes[0]!,
        season: [currentMonth.toString()],
      };

      expect(isRecipeInCurrentSeason(seasonalRecipe)).toBe(true);
    });

    test('isRecipeInCurrentSeason returns true for year-round recipes', () => {
      const yearRoundRecipe: recipeTableElement = {
        ...testRecipes[1]!,
        season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      };
      expect(isRecipeInCurrentSeason(yearRoundRecipe)).toBe(true);
    });

    test('isRecipeInCurrentSeason returns false for off-season recipes', () => {
      const offSeasonRecipe: recipeTableElement = {
        ...testRecipes[2]!,
      };

      offSeasonRecipe.season = ['0'];
      expect(isRecipeInCurrentSeason(offSeasonRecipe)).toBe(false);

      offSeasonRecipe.season = ['13'];
      expect(isRecipeInCurrentSeason(offSeasonRecipe)).toBe(false);

      offSeasonRecipe.season = ['another season'];
      expect(isRecipeInCurrentSeason(offSeasonRecipe)).toBe(false);

      offSeasonRecipe.season = [(currentMonth + 1).toString()];
      expect(isRecipeInCurrentSeason(offSeasonRecipe)).toBe(false);

      offSeasonRecipe.season = [(currentMonth - 1).toString()];
      expect(isRecipeInCurrentSeason(offSeasonRecipe)).toBe(false);
    });

    test('isRecipeInCurrentSeason handles multiple seasons', () => {
      const multiSeasonRecipe = {
        ...testRecipes[0]!,
        season: [currentMonth.toString(), otherMonth.toString()],
      };
      expect(isRecipeInCurrentSeason(multiSeasonRecipe)).toBe(true);
    });

    test('filterRecipesByCurrentSeason filters correctly', () => {
      const wildCardRecipe: recipeTableElement = {
        ...testRecipes[0]!,
        season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      };
      const offSeasonRecipe: recipeTableElement = {
        ...testRecipes[1]!,
        season: [(currentMonth - 1).toString()],
      };

      const recipes = [wildCardRecipe, offSeasonRecipe];
      const filtered = filterRecipesByCurrentSeason(recipes);

      expect(filtered).toHaveLength(1);
      expect(filtered).toContain(wildCardRecipe);
      expect(filtered).not.toContain(offSeasonRecipe);
    });

    test('filterRecipesByCurrentSeason returns empty array for empty input', () => {
      expect(filterRecipesByCurrentSeason([])).toEqual([]);
    });

    test('filterRecipesByCurrentSeason returns empty array when no recipes match', () => {
      const offSeasonOnly: recipeTableElement = {
        ...testRecipes[2]!,
        season: [(currentMonth - 1).toString()],
      };
      const recipes = [offSeasonOnly];
      expect(filterRecipesByCurrentSeason(recipes)).toEqual([]);
    });
  });

  describe('Shuffle and random selection functions', () => {
    test('fisherYatesShuffle returns shuffled array with same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = fisherYatesShuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(original).toEqual([1, 2, 3, 4, 5]);

      const uniqueItems = new Set(shuffled);
      expect(uniqueItems.size).toBe(shuffled.length);

      expect([...shuffled].sort((a, b) => a - b)).toEqual([...original].sort((a, b) => a - b));
    });

    test('fisherYatesShuffle with numberOfElementsWanted returns correct subset', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = fisherYatesShuffle(original, 3);

      expect(shuffled).toHaveLength(3);
      shuffled.forEach(item => {
        expect(original).toContain(item);
      });

      const uniqueItems = new Set(shuffled);
      expect(uniqueItems.size).toBe(shuffled.length);
    });

    test('fisherYatesShuffle handles edge cases', () => {
      expect(fisherYatesShuffle([])).toEqual([]);
      expect(fisherYatesShuffle([1])).toEqual([1]);

      const result = fisherYatesShuffle([1, 2], 0);
      expect(result).toEqual([]);

      const largeResult = fisherYatesShuffle([1, 2], 5);
      expect([...largeResult].sort((a, b) => a - b)).toEqual([1, 2]);
    });

    test('getRandomRecipes returns correct number of recipes', () => {
      const recipes = testRecipes.slice(0, 5);
      const random = getRandomRecipes(recipes, 3);

      expect(random).toHaveLength(3);
      random.forEach(recipe => {
        expect(recipes).toContain(recipe);
      });
    });

    test('getRandomRecipes handles edge cases', () => {
      expect(getRandomRecipes([], 5)).toEqual([]);
      expect(getRandomRecipes(testRecipes.slice(0, 2), 5)).toHaveLength(2);
    });

    test('getRandomRecipes comprehensive database integration test', () => {
      const allRecipes = testRecipes;

      const randomRecipe = getRandomRecipes(allRecipes, 1);
      expect(randomRecipe.length).toBe(1);
      expect(allRecipes).toContain(randomRecipe[0]);

      const anotherRandomRecipe = getRandomRecipes(allRecipes, 1);
      expect(anotherRandomRecipe.length).toBe(1);
      expect(allRecipes).toContain(anotherRandomRecipe[0]);

      const multipleRecipes = getRandomRecipes(allRecipes, 5);
      const uniqueRecipes = new Set(multipleRecipes.map(r => r.id));
      expect(multipleRecipes.length).toBe(5);
      expect(uniqueRecipes.size).toEqual(multipleRecipes.length);

      multipleRecipes.forEach(recipe => {
        expect(allRecipes).toContain(recipe);
      });

      const searchAll = getRandomRecipes(allRecipes, allRecipes.length);
      expect(searchAll.length).toBe(allRecipes.length);

      searchAll.forEach(recipe => {
        expect(allRecipes).toContain(recipe);
      });

      const allSame = searchAll.every((recipe, index) => recipe === allRecipes[index]);
      expect(allSame).toBe(false);

      const searchAllAgain = getRandomRecipes(allRecipes, allRecipes.length);
      expect(searchAllAgain.length).toBe(allRecipes.length);

      searchAllAgain.forEach(recipe => {
        expect(allRecipes).toContain(recipe);
      });

      const sameAsOriginal = searchAllAgain.every((recipe, index) => recipe === allRecipes[index]);
      const sameAsFirst = searchAllAgain.every((recipe, index) => recipe === searchAll[index]);
      expect(sameAsOriginal).toBe(false);
      expect(sameAsFirst).toBe(false);
    });
  });

  describe('Home recommendations', () => {
    const database = RecipeDatabase.getInstance();

    beforeEach(async () => {
      await database.init();
      await database.addMultipleIngredients(testIngredients);
      await database.addMultipleTags(testTags);
      await database.addMultipleRecipes(testRecipes);
    });

    afterEach(async () => {
      await database.closeAndReset();
    });

    function assertRecommendation(
      receivedRecommendations: RecommendationType[],
      isSeasonFilter: boolean
    ) {
      const expectedNumberOfElementsMinimum = isSeasonFilter ? 4 : 3;
      expect(receivedRecommendations.length).toBeGreaterThanOrEqual(
        expectedNumberOfElementsMinimum
      );

      const randomRecommendation = receivedRecommendations[0];
      expect(randomRecommendation!.id).toBe('random');
      expect(randomRecommendation!.type).toBe('random');
      expect(randomRecommendation!.recipes.length).toBeGreaterThan(0);
      expect(randomRecommendation!.titleKey).toBe('recommendations.randomSelection');
      expect(randomRecommendation!.titleParams).toBeUndefined();

      if (!isSeasonFilter) {
        const seasonRecommendation = receivedRecommendations[1];
        expect(seasonRecommendation!.id).toBe('seasonal');
        expect(seasonRecommendation!.type).toBe('seasonal');
        expect(seasonRecommendation!.recipes.length).toBeGreaterThan(0);
        expect(seasonRecommendation!.titleKey).toBe('recommendations.perfectForCurrentSeason');
        expect(seasonRecommendation!.titleParams).toBeUndefined();
      }

      const ingredientRecommendation = receivedRecommendations[isSeasonFilter ? 1 : 2];
      expect(ingredientRecommendation!.id.split('-')[0]).toBe('grain');
      expect(ingredientRecommendation!.type).toBe('ingredient');
      expect(ingredientRecommendation!.recipes.length).toBeGreaterThan(0);
      expect(ingredientRecommendation!.titleKey).toBe('recommendations.basedOnIngredient');
      expect(ingredientRecommendation!.titleParams).toBeDefined();

      const tagRecommendation = receivedRecommendations[receivedRecommendations.length - 1];
      expect(tagRecommendation!.id.split('-')[0]).toBe('tag');
      expect(tagRecommendation!.type).toBe('tag');
      expect(tagRecommendation!.recipes.length).toBeGreaterThan(0);
      expect(tagRecommendation!.titleKey).toBe('recommendations.tagRecipes');
      expect(tagRecommendation!.titleParams).toBeDefined();
    }

    test('generateHomeRecommendations creates recommendations when season filter disabled', () => {
      const recipes = database.get_recipes();
      const ingredients = database.get_ingredients();
      const tags = database.get_tags();
      const recommendations = generateHomeRecommendations(recipes, ingredients, tags, false, 4);
      assertRecommendation(recommendations, false);
    });

    test('generateHomeRecommendations respects season filter when enabled', () => {
      const recipes = database.get_recipes();
      const ingredients = database.get_ingredients();
      const tags = database.get_tags();
      const recommendations = generateHomeRecommendations(recipes, ingredients, tags, true, 4);
      assertRecommendation(recommendations, true);
    });

    test('generateHomeRecommendations handles empty database', async () => {
      await database.closeAndReset();
      await database.init();
      const recipes = database.get_recipes();
      const ingredients = database.get_ingredients();
      const tags = database.get_tags();
      const recommendations = generateHomeRecommendations(recipes, ingredients, tags, false, 4);
      expect(recommendations).toHaveLength(0);
    });

    test('generateHomeRecommendations skips empty tag and ingredient candidates', () => {
      const recipes = database.get_recipes();
      const ingredients = database.get_ingredients();
      const tags = database.get_tags();

      const nonExistingGrain: ingredientTableElement = {
        id: 99999,
        name: 'NonExistentGrainCandidate',
        unit: 'g',
        type: ingredientType.cereal,
        season: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      };

      const nonExistingTag = { name: 'NonExistentTagCandidate' };

      // Place empty candidates first to ensure they are skipped
      const ingredientsWithEmptyFirst = [nonExistingGrain, ...ingredients];
      const tagsWithEmptyFirst = [nonExistingTag, ...tags];

      const recommendations = generateHomeRecommendations(
        recipes,
        ingredientsWithEmptyFirst,
        tagsWithEmptyFirst as any,
        false,
        4
      );

      // No tag or ingredient recommendation should be empty
      const tagRecs = recommendations.filter(r => r.type === 'tag');
      const grainRecs = recommendations.filter(r => r.type === 'ingredient');

      expect(tagRecs.length).toBeGreaterThan(0);
      expect(tagRecs.length).toBeLessThanOrEqual(3);
      tagRecs.forEach((rec, idx) => {
        expect(rec.recipes.length).toBeGreaterThan(0);
        expect(rec.id).toBe(`tag-${idx + 1}`);
        expect(rec.titleParams?.tagName).not.toBe(nonExistingTag.name);
      });

      expect(grainRecs.length).toBeGreaterThan(0);
      expect(grainRecs.length).toBeLessThanOrEqual(2);
      grainRecs.forEach((rec, idx) => {
        expect(rec.recipes.length).toBeGreaterThan(0);
        expect(rec.id).toBe(`grain-${idx + 1}`);
        expect(rec.titleParams?.ingredientName).not.toBe(nonExistingGrain.name);
      });
    });
  });
});
