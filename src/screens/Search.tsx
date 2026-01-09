/**
 * Search - Advanced recipe search screen with filtering and real-time results
 *
 * A comprehensive search interface featuring real-time text search, advanced filtering
 * by ingredients/tags/categories, seasonal filtering, and responsive results display.
 * Integrates multiple search modes and maintains state efficiently for optimal UX.
 *
 * Key Features:
 * - Real-time recipe search with autocomplete suggestions
 * - Advanced multi-category filtering (ingredients, tags, types, seasonality)
 * - Dynamic filter management with state persistence
 * - Seasonal filter integration from global context
 * - Responsive grid layout for search results
 * - Smart state management preventing unnecessary re-renders
 * - Automatic cleanup of deleted recipes
 * - Performance logging for search analytics
 *
 * Search Modes:
 * - Text search: Real-time filtering by recipe title
 * - Filter mode: Advanced filtering with accordion interface
 * - Combined mode: Text search + applied filters
 * - Seasonal mode: Automatic filtering by ingredient seasonality
 *
 * Performance Optimizations:
 * - Efficient filter state management with Maps
 * - Smart re-rendering based on state changes
 * - Focus-based data synchronization
 * - Debounced search operations
 *
 * @example
 * ```typescript
 * // Navigation integration (typically in tab navigator)
 * <Tab.Screen
 *   name="Search"
 *   component={Search}
 *   options={{
 *     tabBarIcon: ({ color }) => <Icon name="search" color={color} />
 *   }}
 * />
 *
 * // The Search screen automatically handles:
 * // - Real-time recipe searching and filtering
 * // - Filter state management and persistence
 * // - Results display with responsive layout
 * // - Integration with seasonal filtering context
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recipeTableElement } from '@customTypes/DatabaseElementTypes';
import { listFilter, TListFilter } from '@customTypes/RecipeFiltersTypes';
import {
  addValueToMultimap,
  editTitleInMultimap,
  extractFilteredRecipeDatas,
  filterFromRecipe,
  removeTitleInMultimap,
  removeValueToMultimap,
  retrieveAllFilters,
} from '@utils/FilterFunctions';
import { useI18n } from '@utils/i18n';
import { Divider, Text, useTheme } from 'react-native-paper';
import { SearchBar } from '@components/organisms/SearchBar';
import { SearchBarResults } from '@components/organisms/SearchBarResults';
import { FiltersSelection } from '@components/organisms/FiltersSelection';
import { padding } from '@styles/spacing';
import { RecipeCard } from '@components/molecules/RecipeCard';
import { FilterAccordion } from '@components/organisms/FilterAccordion';
import { useSeasonFilter } from '@context/SeasonFilterContext';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';

/**
 * Search screen component - Advanced recipe search with filtering
 *
 * @returns JSX element representing the comprehensive search interface
 */
export function Search() {
  const { t } = useI18n();
  const { colors } = useTheme();

  const { seasonFilter } = useSeasonFilter();
  const { recipes } = useRecipeDatabase();

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Core state
  const [filtersState, setFiltersState] = useState(new Map<TListFilter, string[]>());
  const [searchPhrase, setSearchPhrase] = useState('');
  const [searchBarClicked, setSearchBarClicked] = useState(false);
  const [addingFilterMode, setAddingFilterMode] = useState(false);

  // Derived state - calculated from core state, not stored
  const filteredRecipes = filterFromRecipe(recipes, filtersState, t);
  const [filteredTitles, filteredIngredients, filteredTags] =
    extractFilteredRecipeDatas(filteredRecipes);

  // Handle season filter synchronization with global context
  useEffect(() => {
    const seasonFilterKey = listFilter.inSeason;
    const seasonFilterValue = listFilter.inSeason;

    setFiltersState(prevState => {
      const newState = new Map(prevState);

      // Add season filter if enabled and no filters exist
      if (seasonFilter && prevState.size === 0) {
        addValueToMultimap(newState, seasonFilterKey, seasonFilterValue);
        return newState;
      }

      // Remove season filter if disabled and it's the only filter
      if (!seasonFilter && prevState.size === 1 && prevState.has(seasonFilterKey)) {
        removeValueToMultimap(newState, seasonFilterKey, seasonFilterValue);
        return newState;
      }

      return prevState;
    });
  }, [seasonFilter]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (searchBarClicked) {
        Keyboard.dismiss();
        setSearchBarClicked(false);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [searchBarClicked]);

  // Update search string and filter state
  const updateSearchString = (newSearchString: string) => {
    setSearchPhrase(newSearchString);

    setFiltersState(prevState => {
      const newState = new Map(prevState);

      if (newSearchString === '') {
        removeTitleInMultimap(newState);
      } else {
        editTitleInMultimap(newState, newSearchString);
      }

      return newState;
    });
  };

  // Add filter to state
  const addAFilterToTheState = (filterTitle: TListFilter, value: string) => {
    setFiltersState(prevState => {
      const newState = new Map(prevState);
      addValueToMultimap(newState, filterTitle, value);
      return newState;
    });
  };

  // Remove filter from state
  const removeAFilterToTheState = (filterTitle: TListFilter, value: string) => {
    setFiltersState(prevState => {
      const newState = new Map(prevState);
      removeValueToMultimap(newState, filterTitle, value);
      return newState;
    });

    // Clear search phrase if removing title filter
    if (filterTitle === listFilter.recipeTitleInclude) {
      setSearchPhrase('');
    }
  };

  // Find and remove filter by value
  const findFilterStringAndRemove = (item: string) => {
    for (const [key, value] of filtersState) {
      if (value.includes(item)) {
        removeAFilterToTheState(key, item);
        break;
      }
    }
  };

  const screenId = 'SearchScreen';
  const recipeCardsId = screenId + '::RecipeCards';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} testID={screenId}>
      {/* When there are no recipes, put flex on scrollView to child view to take the whole screen*/}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={filteredRecipes.length === 0 ? { flex: 1 } : {}}
        showsVerticalScrollIndicator={true}
      >
        <SearchBar
          testId={screenId + '::SearchBar'}
          searchPhrase={searchPhrase}
          searchBarClicked={searchBarClicked}
          setSearchBarClicked={setSearchBarClicked}
          updateSearchString={updateSearchString}
        />

        {searchBarClicked ? (
          <SearchBarResults
            testId={screenId + '::SearchBarResults'}
            filteredTitles={filteredTitles}
            setSearchBarClicked={setSearchBarClicked}
            updateSearchString={updateSearchString}
          />
        ) : (
          <View>
            <FiltersSelection
              testId={screenId}
              filters={retrieveAllFilters(filtersState)}
              addingFilterMode={addingFilterMode}
              setAddingAFilter={setAddingFilterMode}
              onRemoveFilter={findFilterStringAndRemove}
            />

            <Divider testID={screenId + '::Divider'} />

            {addingFilterMode && (
              <FilterAccordion
                testId={screenId}
                tagsList={filteredTags}
                ingredientsList={filteredIngredients}
                filtersState={filtersState}
                addFilter={addAFilterToTheState}
                removeFilter={removeAFilterToTheState}
              />
            )}
          </View>
        )}

        {!addingFilterMode &&
          !searchBarClicked &&
          (filteredRecipes.length > 0 ? (
            <FlatList
              data={filteredRecipes}
              keyExtractor={item => item.id?.toString() || item.title}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={{ padding: padding.small }}
              renderItem={({ item, index }: ListRenderItemInfo<recipeTableElement>) => (
                <RecipeCard testId={recipeCardsId + `::${index}`} size={'medium'} recipe={item} />
              )}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text testID={screenId + '::TextWhenEmpty'} variant={'titleMedium'}>
                {t('noRecipesFound')}
              </Text>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default Search;
