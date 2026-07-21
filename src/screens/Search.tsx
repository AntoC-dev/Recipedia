import React, { useEffect, useRef, useState } from 'react';
import { useResetOnChange } from '@hooks/useResetOnChange';
import { BackHandler, Keyboard, View } from 'react-native';
import type { FlashListRef, ListRenderItemInfo } from '@shopify/flash-list';
import { FlashList } from '@shopify/flash-list';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
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
import { Divider, Text } from 'react-native-paper';
import { SearchBar, SearchBarHandle } from '@components/organisms/SearchBar';
import { SearchBarResults } from '@components/organisms/SearchBarResults';
import { FiltersSelection } from '@components/organisms/FiltersSelection';
import { padding } from '@styles/spacing';
import { RecipeCard } from '@components/molecules/RecipeCard';
import { FilterAccordion } from '@components/organisms/FilterAccordion';
import { useSeasonFilter } from '@context/SeasonFilterContext';
import { useRecipes } from '@hooks/useRecipes';
import { getRecipeKey } from '@utils/listUtils';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useIsFocused } from '@react-navigation/native';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { TUTORIAL_STEPS } from '@utils/Constants';

const CopilotView = walkthroughable(View);

/**
 * Search screen component - Advanced recipe search with filtering
 *
 * @returns JSX element representing the comprehensive search interface
 */
export function Search() {
  const { t } = useI18n();

  const { seasonFilter } = useSeasonFilter();
  const { recipes } = useRecipes();
  const copilotData = useSafeCopilot();
  const stepOrder = TUTORIAL_STEPS.Search.order;
  const screenFocused = useIsFocused();
  const [toggleButtonTop, setToggleButtonTop] = useState<number | null>(null);

  // Refs
  const flashListRef = useRef<FlashListRef<recipeTableElement>>(null);
  const searchBarClearRef = useRef<SearchBarHandle>(null);
  const hasSelfAdvancedRef = useRef(false);

  // Advance the tutorial to this step once the screen is focused and its
  // spotlight target has been measured. The toggle button is in-flow, so its
  // position is only correct after focus; advancing here (rather than from the
  // tooltip) guarantees the spotlight is measured against the focused position.
  const currentStepOrder = copilotData?.currentStep?.order;
  useEffect(() => {
    if (!screenFocused) {
      hasSelfAdvancedRef.current = false;
      return;
    }
    if (
      !copilotData ||
      toggleButtonTop == null ||
      hasSelfAdvancedRef.current ||
      currentStepOrder == null ||
      currentStepOrder === stepOrder
    ) {
      return;
    }
    hasSelfAdvancedRef.current = true;
    if (currentStepOrder < stepOrder) {
      void copilotData.goToNext();
    } else {
      void copilotData.goToPrev();
    }
  }, [copilotData, screenFocused, toggleButtonTop, currentStepOrder, stepOrder]);

  // Core state
  const [filtersState, setFiltersState] = useState<Map<TListFilter, string[]>>(() => {
    const initial = new Map<TListFilter, string[]>();
    if (seasonFilter) {
      addValueToMultimap(initial, listFilter.inSeason, listFilter.inSeason);
    }
    return initial;
  });
  const [searchBarClicked, setSearchBarClicked] = useState(false);
  const [addingFilterMode, setAddingFilterMode] = useState(false);

  // Derived state - calculated from core state, not stored
  const filteredRecipes = filterFromRecipe(recipes, filtersState, t);
  const [filteredTitles, filteredIngredients, filteredTags] =
    extractFilteredRecipeDatas(filteredRecipes);

  // Sync the season filter into filter state when the global toggle changes
  useResetOnChange([seasonFilter], () => {
    setFiltersState(prevState => {
      const newState = new Map(prevState);
      const seasonFilterKey = listFilter.inSeason;
      const seasonFilterValue = listFilter.inSeason;

      if (seasonFilter && prevState.size === 0) {
        addValueToMultimap(newState, seasonFilterKey, seasonFilterValue);
        return newState;
      }

      if (!seasonFilter && prevState.size === 1 && prevState.has(seasonFilterKey)) {
        removeValueToMultimap(newState, seasonFilterKey, seasonFilterValue);
        return newState;
      }

      return prevState;
    });
  });

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (searchBarClicked) {
        Keyboard.dismiss();
        setSearchBarClicked(false);
        flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [searchBarClicked]);

  // Update search string and filter state
  const updateSearchString = (newSearchString: string) => {
    setFiltersState(prevState => {
      const newState = new Map(prevState);
      if (newSearchString === '') {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
        removeTitleInMultimap(newState);
      } else {
        editTitleInMultimap(newState, newSearchString);
      }

      return newState;
    });
  };

  // Select a search result: update both the search bar text and the filter state
  const selectSearchResult = (title: string) => {
    searchBarClearRef.current?.setText(title);
    updateSearchString(title);
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

    // Clear search bar if removing title filter
    if (filterTitle === listFilter.recipeTitleInclude) {
      searchBarClearRef.current?.clear();
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
    <ScreenWrapper testID={screenId} edges={['top', 'left', 'right']}>
      <FlashList
        ref={flashListRef}
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        data={addingFilterMode || searchBarClicked ? [] : filteredRecipes}
        keyExtractor={getRecipeKey}
        numColumns={2}
        maintainVisibleContentPosition={{ disabled: true }}
        contentContainerStyle={{ padding: padding.small }}
        ListHeaderComponent={
          <View>
            <SearchBar
              testId={screenId + '::SearchBar'}
              searchBarClicked={searchBarClicked}
              setSearchBarClicked={setSearchBarClicked}
              updateSearchString={updateSearchString}
              clearRef={searchBarClearRef}
            />

            {searchBarClicked ? (
              <SearchBarResults
                testId={screenId + '::SearchBarResults'}
                filteredTitles={filteredTitles}
                setSearchBarClicked={setSearchBarClicked}
                updateSearchString={selectSearchResult}
              />
            ) : (
              <View>
                <FiltersSelection
                  testId={screenId}
                  filters={retrieveAllFilters(filtersState)}
                  addingFilterMode={addingFilterMode}
                  setAddingAFilter={setAddingFilterMode}
                  onRemoveFilter={findFilterStringAndRemove}
                  onToggleButtonTop={setToggleButtonTop}
                  screenFocused={screenFocused}
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
          </View>
        }
        ListEmptyComponent={() => {
          if (addingFilterMode || searchBarClicked) {
            return null;
          }
          return (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: padding.large,
              }}
            >
              <Text testID={screenId + '::TextWhenEmpty'} variant={'titleMedium'}>
                {t('noRecipesFound')}
              </Text>
            </View>
          );
        }}
        renderItem={({ item }: ListRenderItemInfo<recipeTableElement>) => (
          <RecipeCard
            testId={recipeCardsId + `::${getRecipeKey(item)}`}
            size={'medium'}
            recipe={item}
          />
        )}
      />

      {copilotData && (
        <CopilotStep text={t('tutorial.search.description')} order={stepOrder} name={'Search'}>
          {/*
            Unlike the other tutorial screens (which can hardcode a percentage
            top), the toggle button sits below the search bar and a variable
            filter-chip row, and its focused window position differs from its
            unfocused one by the status-bar height. A static percentage left a
            visible vertical offset, so the top is driven by the measured
            (settled, focused) button position, falling back to '15%' until measured.
          */}
          <CopilotView
            testID={screenId + '::Tutorial'}
            style={{
              position: 'absolute',
              top: toggleButtonTop ?? '15%',
              left: padding.small,
              right: padding.small,
              height: '40%',
              pointerEvents: 'none',
            }}
          />
        </CopilotStep>
      )}
    </ScreenWrapper>
  );
}

export default Search;
