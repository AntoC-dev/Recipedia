/**
 * FilterFunctions - Utility functions for recipe filtering and search operations
 *
 * This module provides comprehensive filtering capabilities for recipes based on various criteria
 * such as ingredients, tags, preparation time, and seasonal availability. It includes functions
 * for building filter categories, applying filters to recipe collections, and managing
 * filter state using Maps and multimaps.
 */

import {
  arrayOfType,
  ingredientTableElement,
  ingredientType,
  recipeTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import {
  FiltersAppliedToDatabase,
  filtersCategories,
  listFilter,
  prepTimeValues,
  RecommendationType,
  TListFilter,
} from '@customTypes/RecipeFiltersTypes';
import { TFunction } from 'i18next';
import { homeLogger, searchLogger } from '@utils/logger';

/**
 * Creates filter categories with available values for UI display
 *
 * Processes different filter types (tags, ingredients by type, prep time, seasonal)
 * and returns structured data for filter UI components. Returns raw values (translation
 * keys for translatable filters, user data for others) without translation.
 *
 * @param tagsList - Array of available tag names
 * @param ingredientsList - Array of available ingredients
 * @returns Array of filter categories with their available values (untranslated)
 *
 * @example
 * ```typescript
 * const filters = selectFilterCategoriesValuesToDisplay(
 *   ["Dessert", "Main Course"],
 *   ingredients
 * );
 * ```
 */
export function selectFilterCategoriesValuesToDisplay(
  tagsList: string[],
  ingredientsList: ingredientTableElement[]
): FiltersAppliedToDatabase[] {
  return filtersCategories.map(category => {
    const filterApplyToDatabase: FiltersAppliedToDatabase = {
      title: category as TListFilter,
      data: [],
    };
    switch (category) {
      case listFilter.inSeason:
        filterApplyToDatabase.data = [listFilter.inSeason];
        break;
      case listFilter.tags:
        filterApplyToDatabase.data = tagsList;
        break;
      case listFilter.prepTime:
        filterApplyToDatabase.data = prepTimeValues;
        break;
      case listFilter.recipeTitleInclude:
      case listFilter.purchased:
      case listFilter.cereal:
      case listFilter.legumes:
      case listFilter.vegetable:
      case listFilter.plantProtein:
      case listFilter.condiment:
      case listFilter.sauce:
      case listFilter.meat:
      case listFilter.poultry:
      case listFilter.fish:
      case listFilter.seafood:
      case listFilter.dairy:
      case listFilter.cheese:
      case listFilter.sugar:
      case listFilter.spice:
      case listFilter.fruit:
      case listFilter.oilAndFat:
      case listFilter.nutsAndSeeds:
      case listFilter.sweetener:
        filterApplyToDatabase.data = arrayOfType(ingredientsList, category).map(ing => ing.name);
        break;
      default:
        searchLogger.warn('selectFilterValuesToDisplay:: default shall not be reach');
        filterApplyToDatabase.data = [];
    }

    return filterApplyToDatabase;
  });
}

/**
 * Extracts unique ingredients, tags, and titles from a recipe collection
 *
 * Processes an array of recipes to extract all unique ingredients, tags, and titles
 * for use in filter dropdowns and search suggestions.
 *
 * @param recipeArray - Array of recipes to process
 * @returns Tuple containing [sorted titles, unique ingredients, sorted tags]
 *
 * @example
 * ```typescript
 * const [titles, ingredients, tags] = extractFilteredRecipeDatas(recipes);
 * console.log(`Found ${ingredients.length} unique ingredients`);
 * ```
 */
export function extractFilteredRecipeDatas(
  recipeArray: recipeTableElement[]
): [string[], ingredientTableElement[], string[]] {
  // TODO is set really faster in this case ? To profile
  const ingredientsUniqueCollection: ingredientTableElement[] = [];
  const tagsUniqueCollection = new Set<string>();

  for (const element of recipeArray) {
    for (const ing of element.ingredients) {
      if (
        ingredientsUniqueCollection.find(ingredient => ingredient.name === ing.name) === undefined
      ) {
        ingredientsUniqueCollection.push(ing);
      }
    }
    for (const tag of element.tags) {
      tagsUniqueCollection.add(tag.name);
    }
  }

  const titleSortedArray = recipeArray.map(({ title }) => title).sort();

  return [
    titleSortedArray,
    ingredientsUniqueCollection.sort((a, b) => a.name.localeCompare(b.name)),
    Array.from(tagsUniqueCollection).sort(),
  ];
}

/**
 * Filters recipes based on multiple criteria using a multimap structure
 *
 * Applies various filters to a recipe collection including preparation time,
 * title search, seasonal availability, tags, and ingredient types.
 *
 * @param recipeArray - Array of recipes to filter
 * @param filter - Map of filter criteria (multimap: filter type -> array of values)
 * @param t - Translation function for internationalization
 * @returns Filtered array of recipes that match ALL specified criteria
 *
 * @example
 * ```typescript
 * const filters = new Map();
 * filters.set(listFilter.tags, ["Dessert", "Quick"]);
 * filters.set(listFilter.prepTime, ["15-30"]);
 *
 * const filtered = filterFromRecipe(allRecipes, filters, t);
 * ```
 */
export function filterFromRecipe(
  recipeArray: recipeTableElement[],
  filter: Map<TListFilter, string[]>,
  t: TFunction<'translation', undefined>
): recipeTableElement[] {
  if (filter.size === 0) {
    return recipeArray;
  }
  return recipeArray.filter(recipe => {
    let elementToKeep = true;
    for (const [key, value] of filter) {
      switch (key) {
        case listFilter.prepTime:
          elementToKeep = elementToKeep && applyToRecipeFilterPrepTime(recipe, value, t);
          break;
        case listFilter.recipeTitleInclude:
          elementToKeep = elementToKeep && isTheElementContainsTheFilter(recipe.title, value);
          break;
        case listFilter.inSeason:
          elementToKeep = elementToKeep && isRecipeInCurrentSeason(recipe);
          break;
        case listFilter.tags:
          elementToKeep =
            elementToKeep &&
            isTheElementContainsTheFilter(
              recipe.tags.map(tag => tag.name),
              value
            );
          break;
        case listFilter.purchased:
          // Nothing to do so break
          break;
        case listFilter.cereal:
        case listFilter.legumes:
        case listFilter.vegetable:
        case listFilter.plantProtein:
        case listFilter.condiment:
        case listFilter.sauce:
        case listFilter.meat:
        case listFilter.poultry:
        case listFilter.fish:
        case listFilter.seafood:
        case listFilter.dairy:
        case listFilter.cheese:
        case listFilter.sugar:
        case listFilter.spice:
        case listFilter.fruit:
        case listFilter.oilAndFat:
        case listFilter.nutsAndSeeds:
        case listFilter.sweetener:
          elementToKeep =
            elementToKeep &&
            isTheElementContainsTheFilter(
              recipe.ingredients.map(ing => ing.name),
              value
            );
          break;
        default:
          searchLogger.error('filterFromRecipe:: Impossible to reach');
          break;
      }
    }
    return elementToKeep;
  });
}

/**
 * Adds a value to a multimap (Map with Array values)
 *
 * Creates a new array for the key if it doesn't exist, or adds the value
 * to the existing array if the value isn't already present.
 *
 * @param multimap - The multimap to modify
 * @param key - The key to add the value under
 * @param value - The value to add
 *
 * @example
 * ```typescript
 * const filters = new Map();
 * addValueToMultimap(filters, listFilter.tags, "Dessert");
 * addValueToMultimap(filters, listFilter.tags, "Quick");
 * ```
 */
export function addValueToMultimap<TKey, TValue>(
  multimap: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue
) {
  const values = multimap.get(key);
  if (values === undefined) {
    multimap.set(key, [value]);
  } else {
    if (!values.includes(value)) {
      values.push(value);
    }
  }
}

/**
 * Removes a value from a multimap (Map with Array values)
 *
 * Removes the specified value from the array associated with the key.
 * If the array becomes empty, removes the key entirely.
 *
 * @param multimap - The multimap to modify
 * @param key - The key containing the value to remove
 * @param value - The value to remove
 *
 * @example
 * ```typescript
 * removeValueToMultimap(filters, listFilter.tags, "Dessert");
 * ```
 */
export function removeValueToMultimap<TKey, TValue>(
  multimap: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue
) {
  const values = multimap.get(key);
  if (values !== undefined) {
    const valueIndex = values.indexOf(value);
    if (valueIndex !== -1) {
      values.splice(valueIndex, 1);
      if (values.length === 0) {
        multimap.delete(key);
      }
    } else {
      searchLogger.warn(
        `removeValueFromMultimap: Trying to remove value ${value} at key ${key} from multimap but value finding fails`
      );
    }
  } else {
    searchLogger.warn(
      `removeValueFromMultimap: Trying to remove value ${value} at key ${key} from multimap but key finding fails`
    );
  }
}

/**
 * Updates the recipe title search filter in a multimap
 *
 * Sets or updates the title search string in the filter multimap.
 * Used for real-time search as the user types.
 *
 * @param multimap - The filter multimap to modify
 * @param newSearchString - The new search string for recipe titles
 *
 * @example
 * ```typescript
 * editTitleInMultimap(filters, "chocolate cake");
 * ```
 */
export function editTitleInMultimap(multimap: Map<TListFilter, string[]>, newSearchString: string) {
  // TODO to refactor to a direct modification of the Multimap
  const value = multimap.get(listFilter.recipeTitleInclude);
  if (multimap.size === 0 || value === undefined) {
    multimap.set(listFilter.recipeTitleInclude, [newSearchString]);
  } else {
    if (value.length > 1) {
      searchLogger.warn('updateSearchString:: Not possible');
    } else {
      value[0] = newSearchString;
    }
  }
}

/**
 * Removes the recipe title search filter from a multimap
 *
 * @param multimap - The filter multimap to modify
 *
 * @example
 * ```typescript
 * removeTitleInMultimap(filters); // Clear search text
 * ```
 */
export function removeTitleInMultimap(multimap: Map<TListFilter, string[]>) {
  multimap.delete(listFilter.recipeTitleInclude);
}

// TODO in case of creating a multimap
/*
        const tmp = new Map<string, string[]>();
        for (const filter of filterMultimap) {
            switch (filter.title) {
                case listFilter.prepTime:
                    addValueToMultimap(tmp, listFilter.prepTime, filter.value);
                    break;
                case listFilter.recipeTitleInclude:
                    addValueToMultimap(tmp, listFilter.recipeTitleInclude, filter.value);
                    break;
                case listFilter.inSeason:
                    addValueToMultimap(tmp, listFilter.inSeason, filter.value);
                    break;
                case listFilter.tags:
                    addValueToMultimap(tmp, listFilter.tags, filter.value);
                    break;
                case listFilter.grainOrCereal:
                case listFilter.legumes:
                case listFilter.vegetable:
                case listFilter.plantProtein:
                case listFilter.condiment:
                case listFilter.sauce:
                case listFilter.meat:
                case listFilter.poultry:
                case listFilter.fish:
                case listFilter.seafood:
                case listFilter.dairy:
                case listFilter.cheese:
                case listFilter.sugar:
                case listFilter.spice:
                case listFilter.fruit:
                case listFilter.oilAndFat:
                case listFilter.nutsAndSeeds:
                case listFilter.sweetener:
                    // TODO for now use grainOrCereal but not that a good idea
                    addValueToMultimap(tmp, listFilter.grainOrCereal, filter.value);
                    break;
                case listFilter.undefined:
                default:
                    searchLogger.error(`filterFromRecipe:: Unknown type `, filter.title);
            }
        }
        */

/**
 * Retrieves all filter values from a multimap as a flat array
 *
 * Extracts all values from all filter categories and combines them
 * into a single array for display or processing.
 *
 * @param filters - The filter multimap
 * @returns Flat array of all filter values
 *
 * @example
 * ```typescript
 * const allValues = retrieveAllFilters(filters);
 * console.log(`Total active filters: ${allValues.length}`);
 * ```
 */
export function retrieveAllFilters(filters: Map<TListFilter, string[]>): string[] {
  const allFilters: string[] = [];
  for (const value of filters.values()) {
    allFilters.push(...value);
  }
  return allFilters;
}

/**
 * Checks if an element (string or array) contains any of the specified filter values
 *
 * Handles both string and array inputs with different matching logic:
 * - For arrays: Uses strict equality for element matching
 * - For strings: Uses substring matching (includes)
 *
 * @param elementToTest - The element to test (recipe title, tags array, etc.)
 * @param filters - The filter values to search for
 * @returns True if any filter value is found in the element
 */
export function isTheElementContainsTheFilter(
  elementToTest: string | string[],
  filters: string[] | string
): boolean {
  if (filters instanceof Array) {
    for (const filterValue of filters) {
      if (filterValue === '*') {
        return true;
      }
      // Careful here because includes does not lean the same for array and string
      // For array, we want s strict equality while a string not
      // string case will happen on title only and we won't have strict equality here
      if (elementToTest.includes(filterValue)) {
        return true;
      }
    }
  } else {
    return elementToTest.includes(filters);
  }

  return false;
}

/**
 * Applies preparation time filters to a recipe
 *
 * Checks if a recipe's preparation time falls within any of the specified time intervals.
 * Handles both range intervals (e.g., "15-30") and open-ended intervals (e.g., "60+").
 *
 * @param recipe - The recipe to test
 * @param filterTimeIntervals - Array of time interval strings to check against
 * @param t - Translation function for internationalization
 * @returns True if recipe time matches any of the filter intervals
 */
function applyToRecipeFilterPrepTime(
  recipe: recipeTableElement,
  filterTimeIntervals: string[],
  t: TFunction<'translation', undefined>
): boolean {
  for (const curFilter of filterTimeIntervals) {
    const translatedTimeFilter = t(curFilter);
    const minutesTranslated = t('timeSuffixEdit');
    if (curFilter === prepTimeValues[prepTimeValues.length - 1]) {
      if (
        Number(translatedTimeFilter.replace(minutesTranslated, '').replace('+', '')) <= recipe.time
      ) {
        return true;
      }
    } else {
      const [beginTime, endTime] = translatedTimeFilter.replace(minutesTranslated, '').split(`-`);
      if (Number(beginTime) <= recipe.time && recipe.time <= Number(endTime)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Filters recipes to only include those that are in season for the current month
 *
 * Uses the same seasonal logic as the main filtering system, checking if recipes
 * contain the current month or are available year-round ('*').
 *
 * @param recipes - Array of recipes to filter
 * @returns Array of recipes that are currently in season
 *
 * @example
 * ```typescript
 * const seasonalRecipes = filterRecipesByCurrentSeason(allRecipes);
 * console.log(`Found ${seasonalRecipes.length} seasonal recipes`);
 * ```
 */
export function filterRecipesByCurrentSeason(recipes: recipeTableElement[]): recipeTableElement[] {
  return recipes.filter(recipe => isRecipeInCurrentSeason(recipe));
}

/**
 * Checks if a single recipe is in season for the current month
 *
 * @param recipe - The recipe to check
 * @returns True if the recipe is in season, false otherwise
 */
export function isRecipeInCurrentSeason(recipe: recipeTableElement): boolean {
  const currentMonth = new Date().getMonth() + 1;
  const monthString = currentMonth.toString();

  // Check if recipe season contains current month or wildcard
  return recipe.season.includes(monthString) || recipe.season.includes('*');
}

/**
 * Shuffles an array using the Fisher-Yates algorithm and optionally returns a subset
 *
 * This function creates a shuffled copy of the input array without modifying the original.
 * Optionally returns only the first N elements from the shuffled array.
 *
 * @param arrayToShuffle - The array to shuffle
 * @param numberOfElementsWanted - Optional number of elements to return from shuffled array
 * @returns Shuffled array or subset of shuffled array
 *
 * @example
 * ```typescript
 * const recipes = [recipe1, recipe2, recipe3, recipe4, recipe5];
 * const shuffled = fisherYatesShuffle(recipes, 3); // Returns 3 random recipes
 * ```
 */
export function fisherYatesShuffle<T>(arrayToShuffle: T[], numberOfElementsWanted?: number): T[] {
  if (numberOfElementsWanted === 0) {
    return [];
  }

  const shuffled = [...arrayToShuffle]; // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Pick a random index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  if (numberOfElementsWanted === undefined || numberOfElementsWanted >= arrayToShuffle.length) {
    return shuffled;
  } else {
    return shuffled.slice(0, numberOfElementsWanted);
  }
}

/**
 * Retrieves a random selection of recipes from the provided array
 *
 * @param recipes - Array of recipes to select from
 * @param numOfElements - Number of random recipes to return
 * @returns Array of random recipes
 *
 * @example
 * ```typescript
 * const randomRecipes = getRandomRecipes(allRecipes, 5);
 * console.log(`Got ${randomRecipes.length} random recipes`);
 * ```
 */
export function getRandomRecipes(
  recipes: recipeTableElement[],
  numOfElements: number
): recipeTableElement[] {
  if (recipes.length === 0) {
    return [];
  }
  return fisherYatesShuffle(recipes, numOfElements);
}

/**
 * Generates smart recommendations for the home screen
 *
 * Creates diverse recipe recommendations using various filtering strategies
 * including random selection, seasonal filtering, ingredient-based filtering,
 * and tag-based filtering. Respects user preferences for seasonal filtering.
 *
 * @param recipes - Array of all recipes to generate recommendations from
 * @param ingredients - Array of all ingredients for ingredient-based recommendations
 * @param tags - Array of all tags for tag-based recommendations
 * @param seasonFilterEnabled - Whether the user has global seasonal filtering enabled
 * @param recipesPerRecommendation - Number of recipes per recommendation (default: 20)
 * @returns Array of recommendation objects with titles and recipes
 *
 * @example
 * ```typescript
 * const recommendations = generateHomeRecommendations(
 *   allRecipes,
 *   allIngredients,
 *   allTags,
 *   false,
 *   20
 * );
 * console.log(`Generated ${recommendations.length} recommendations`);
 * ```
 */
export function generateHomeRecommendations(
  recipes: recipeTableElement[],
  ingredients: ingredientTableElement[],
  tags: tagTableElement[],
  seasonFilterEnabled: boolean,
  recipesPerRecommendation: number
): RecommendationType[] {
  const recommendations: RecommendationType[] = [];

  if (recipes.length === 0) {
    return recommendations;
  }

  const seasonalRecipes = filterRecipesByCurrentSeason(recipes);

  const recipesForFiltering = seasonFilterEnabled ? seasonalRecipes : recipes;

  recommendations.push({
    id: 'random',
    titleKey: 'recommendations.randomSelection',
    recipes: getRandomRecipes(recipesForFiltering, recipesPerRecommendation),
    type: 'random' as const,
  });

  // Only add dedicated seasonal recommendation when season filter is disabled
  if (!seasonFilterEnabled && seasonalRecipes.length > 0) {
    const shuffledSeasonalRecipes = fisherYatesShuffle(seasonalRecipes, recipesPerRecommendation);
    recommendations.push({
      id: 'seasonal',
      titleKey: 'recommendations.perfectForCurrentSeason',
      recipes: shuffledSeasonalRecipes,
      type: 'seasonal' as const,
    });
  }

  const grainIngredients = ingredients.filter(ing => ing.type === ingredientType.cereal);
  const shuffledGrainIngredients = fisherYatesShuffle(grainIngredients);
  let grainCount = 0;
  for (const ingredient of shuffledGrainIngredients) {
    if (grainCount >= 2) {
      break;
    }
    const ingredientRecipes = recipesForFiltering.filter(recipe =>
      isTheElementContainsTheFilter(
        recipe.ingredients.map(ing => ing.name),
        ingredient.name
      )
    );
    if (ingredientRecipes.length === 0) {
      continue;
    }
    const shuffledIngredientRecipes = fisherYatesShuffle(
      ingredientRecipes,
      recipesPerRecommendation
    );
    recommendations.push({
      id: `grain-${grainCount + 1}`,
      titleKey: `recommendations.basedOnIngredient`,
      titleParams: { ingredientName: ingredient.name },
      recipes: shuffledIngredientRecipes,
      type: 'ingredient' as const,
    });
    grainCount++;
  }

  const shuffledTags = fisherYatesShuffle(tags);
  let tagCount = 0;
  for (const tag of shuffledTags) {
    if (tagCount >= 3) {
      break;
    }
    const tagRecipes = recipesForFiltering.filter(recipe =>
      isTheElementContainsTheFilter(
        recipe.tags.map(t => t.name),
        tag.name
      )
    );
    if (tagRecipes.length === 0) {
      continue;
    }
    const shuffledTagRecipes = fisherYatesShuffle(tagRecipes, recipesPerRecommendation);
    recommendations.push({
      id: `tag-${tagCount + 1}`,
      titleKey: `recommendations.tagRecipes`,
      titleParams: { tagName: tag.name },
      recipes: shuffledTagRecipes,
      type: 'tag' as const,
    });
    tagCount++;
  }

  homeLogger.info('Generated home recommendations', {
    count: recommendations.length,
    seasonFilterEnabled,
    recipesPerRecommendation,
  });

  return recommendations;
}
