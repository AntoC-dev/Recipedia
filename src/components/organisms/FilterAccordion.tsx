/**
 * FilterAccordion - Expandable filter selection component with categorized options
 *
 * A comprehensive filtering interface that organizes filter options into collapsible
 * accordion sections. Features checkbox-based multi-selection, automatic categorization
 * of tags and ingredients, and responsive two-column layout for optimal space usage.
 *
 * Key Features:
 * - Accordion-based organization of filter categories
 * - Multi-selection with checkbox UI
 * - Two-column responsive layout for filter items
 * - Automatic categorization of ingredients by type
 * - Real-time filter state management
 * - Theme-aware styling and colors
 * - Internationalization support for category titles
 * - Dynamic section visibility based on available data
 *
 * @example
 * ```typescript
 * // Basic filter accordion for recipe search
 * const [filters, setFilters] = useState(new Map());
 *
 * <FilterAccordion
 *   testId="recipe-filters"
 *   tagsList={availableTags}
 *   ingredientsList={availableIngredients}
 *   filtersState={filters}
 *   addFilter={(type, value) => {
 *     const current = filters.get(type) || [];
 *     setFilters(new Map(filters.set(type, [...current, value])));
 *   }}
 *   removeFilter={(type, value) => {
 *     const current = filters.get(type) || [];
 *     setFilters(new Map(filters.set(type, current.filter(v => v !== value))));
 *   }}
 * />
 *
 * // Integration with search functionality
 * <FilterAccordion
 *   testId="advanced-search"
 *   tagsList={tags}
 *   ingredientsList={ingredients}
 *   filtersState={activeFilters}
 *   addFilter={handleFilterAdd}
 *   removeFilter={handleFilterRemove}
 * />
 * ```
 */

import React from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import { Checkbox, Divider, List, useTheme } from 'react-native-paper';
import { ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { FiltersAppliedToDatabase, listFilter, TListFilter } from '@customTypes/RecipeFiltersTypes';
import { useI18n } from '@utils/i18n';
import { padding } from '@styles/spacing';
import { selectFilterCategoriesValuesToDisplay } from '@utils/FilterFunctions';
import { useFiltersCategories } from '@hooks/useCategories';

/**
 * Props for the FilterAccordion component
 */
export type FilterAccordionProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Array of available tag names for filtering */
  tagsList: string[];
  /** Array of available ingredients for filtering */
  ingredientsList: ingredientTableElement[];
  /** Current state of applied filters organized by filter type */
  filtersState: Map<TListFilter, string[]>;
  /** Callback fired when a filter option is selected */
  addFilter: (filterTitle: TListFilter, value: string) => void;
  /** Callback fired when a filter option is deselected */
  removeFilter: (filterTitle: TListFilter, value: string) => void;
};

/**
 * FilterAccordion component for categorized filter selection
 *
 * @param props - The component props with filter data and state management
 * @returns JSX element representing an accordion-based filter selection interface
 */
export function FilterAccordion({
  testId,
  tagsList,
  ingredientsList,
  filtersState,
  addFilter,
  removeFilter,
}: FilterAccordionProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const filtersCategories = useFiltersCategories();

  const ingredientSections = selectFilterCategoriesValuesToDisplay(
    filtersCategories,
    tagsList,
    ingredientsList
  ).filter(section => section.data.length > 0);

  /**
   * Handles filter selection/deselection with intelligent state management
   *
   * This function manages the complex logic of adding or removing filter values
   * based on current selection state. It determines whether to add or remove
   * a filter value and calls the appropriate callback function.
   *
   * @param filterType - The category of filter being modified (e.g., vegetables, tags)
   * @param value - The specific filter value being toggled (e.g., "tomato", "vegetarian")
   *
   * Logic Flow:
   * 1. Retrieves current filter values for the specified filter type
   * 2. Checks if the value is already selected
   * 3. If selected: calls removeFilter to deselect
   * 4. If not selected: calls addFilter to select
   *
   * State Management:
   * - Safely handles missing filter types (defaults to empty array)
   * - Maintains immutable filter state through parent callbacks
   * - Provides immediate visual feedback through checkbox state
   *
   * Side Effects:
   * - Triggers addFilter or removeFilter callbacks
   * - Updates parent component's filter state
   * - Causes re-render of filter UI and search results
   */
  const handlePress = (filterType: TListFilter, value: string) => {
    const currentFilters = filtersState.get(filterType) || [];
    if (currentFilters.includes(value)) {
      removeFilter(filterType, value);
    } else {
      addFilter(filterType, value);
    }
  };

  /**
   * Determines if a specific filter value is currently selected
   *
   * This utility function checks the current filter state to determine
   * whether a specific filter value is active. Used primarily for
   * rendering checkbox states in the UI.
   *
   * @param filterType - The filter category to check
   * @param value - The specific filter value to check
   * @returns boolean - True if the filter value is currently selected
   *
   * Safety Features:
   * - Uses optional chaining to handle missing filter types
   * - Returns false by default if filter type doesn't exist
   * - Provides safe array includes check
   *
   * UI Integration:
   * - Drives checkbox state (checked/unchecked)
   * - Provides immediate visual feedback
   * - Updates automatically with filter state changes
   */
  const isSelected = (filterType: TListFilter, value: string) => {
    return filtersState.get(filterType)?.includes(value) ?? false;
  };

  const accordionId = testId + '::FilterAccordion';

  const renderAccordion = ({ item, index }: ListRenderItemInfo<FiltersAppliedToDatabase>) => {
    const filterId = accordionId + `::Accordion::${index}`;
    const filter = item.title;

    const renderItems = ({ item, index }: ListRenderItemInfo<string>) => {
      const testId = filterId + `::Item::${index}`;
      const shouldTranslate = filter === listFilter.prepTime || filter === listFilter.inSeason;
      const displayText = shouldTranslate ? t(item) : item;

      return (
        <View key={item} style={{ width: '50%' }}>
          <List.Item
            testID={testId}
            title={displayText}
            titleNumberOfLines={2}
            style={{ paddingHorizontal: padding.verySmall }}
            onPress={() => handlePress(filter, item)}
            left={props => (
              <Checkbox
                testID={testId + '::CheckBox'}
                {...props}
                status={isSelected(filter, item) ? 'checked' : 'unchecked'}
              />
            )}
          />
        </View>
      );
    };

    return (
      <View key={item.title}>
        <List.Accordion
          testID={filterId}
          title={t(item.title)}
          id={`${item.title}`}
          style={{ backgroundColor: colors.primaryContainer }}
        >
          <FlatList
            data={item.data}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            numColumns={2}
            renderItem={renderItems}
          />
        </List.Accordion>
        <Divider />
      </View>
    );
  };

  return (
    <List.AccordionGroup>
      <FlatList
        data={ingredientSections}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderAccordion}
      />
    </List.AccordionGroup>
  );
}

export default FilterAccordion;
