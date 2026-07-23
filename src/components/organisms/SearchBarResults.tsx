/**
 * SearchBarResults - Dropdown list component for search suggestions
 *
 * A specialized list component that displays filtered search results as selectable items.
 * Features keyboard management, automatic state updates, and responsive styling for
 * optimal search experience.
 *
 * Key Features:
 * - Flat list rendering of search suggestions
 * - Automatic keyboard dismissal on selection
 * - Search state management integration
 * - Responsive padding and spacing
 * - Material Design list item styling
 * - Disabled scrolling for overlay behavior
 * - Touch-friendly item selection
 *
 * @example
 * ```typescript
 * // Basic search results dropdown
 * const [searchActive, setSearchActive] = useState(false);
 * const [searchQuery, setSearchQuery] = useState('');
 * const [suggestions, setSuggestions] = useState([]);
 *
 * <SearchBarResults
 *   testId="recipe-search-results"
 *   filteredTitles={suggestions}
 *   setSearchBarClicked={setSearchActive}
 *   updateSearchString={(title) => {
 *     setSearchQuery(title);
 *     performSearch(title);
 *   }}
 * />
 *
 * // Integration with search bar
 * {searchActive && (
 *   <SearchBarResults
 *     testId="search-dropdown"
 *     filteredTitles={filteredRecipes}
 *     setSearchBarClicked={setSearchFocused}
 *     updateSearchString={handleSearchSelection}
 *   />
 * )}
 * ```
 */

import React from 'react';
import { List } from 'react-native-paper';
import { FlatList, Keyboard, ListRenderItemInfo } from 'react-native';
import { padding } from '@styles/spacing';
import { useI18n } from '@utils/i18n';

/**
 * Props for the SearchBarResults component
 */
export type SearchBarResultsProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Array of filtered result titles to display */
  filteredTitles: string[];
  /** State setter for managing search bar focus/active state */
  setSearchBarClicked: React.Dispatch<React.SetStateAction<boolean>>;
  /** Callback fired when a search result is selected */
  updateSearchString: (newSearchString: string) => void;
};

/**
 * SearchBarResults component for search suggestion dropdown
 *
 * @param props - The component props with search results and state management
 * @returns JSX element representing a dropdown list of selectable search suggestions
 */
export function SearchBarResults({
  testId,
  filteredTitles,
  setSearchBarClicked,
  updateSearchString,
}: SearchBarResultsProps) {
  const { t } = useI18n();

  const renderTitle = ({ item, index }: ListRenderItemInfo<string>) => {
    return (
      <List.Item
        testID={testId + '::Item::' + index}
        key={index}
        title={item}
        onPress={() => {
          Keyboard.dismiss();
          setSearchBarClicked(false);
          updateSearchString(item);
        }}
        style={{ padding: padding.veryLarge }}
      />
    );
  };

  return (
    <List.Section>
      <FlatList
        testID={testId}
        data={filteredTitles}
        renderItem={renderTitle}
        scrollEnabled={false}
        keyboardShouldPersistTaps={'handled'}
        ListEmptyComponent={
          <List.Item
            testID={testId + '::Empty'}
            title={t('noRecipesFound')}
            disabled
            style={{ padding: padding.veryLarge }}
          />
        }
      />
    </List.Section>
  );
}
