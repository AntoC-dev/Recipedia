// TODO: SDK 53 - Consider using React 19 Actions for form handling and pending state management
/**
 * SearchBar - Interactive recipe search component with clear functionality
 *
 * A specialized search bar component designed for recipe searching with integrated
 * state management, keyboard handling, and clear functionality. Features responsive
 * styling, internationalization support, and seamless focus/blur state management.
 *
 * Key Features:
 * - Real-time search text updates
 * - Focus state tracking for UI adjustments
 * - Clear button when text is present
 * - Responsive styling with rounded borders
 * - Keyboard management and auto-dismiss
 * - Internationalized placeholder text
 * - Submit handling for search completion
 * - Material Design search bar styling
 *
 * @example
 * ```typescript
 * // Basic search implementation
 * const [searchText, setSearchText] = useState('');
 * const [searchFocused, setSearchFocused] = useState(false);
 *
 * <SearchBar
 *   testId="recipe-search"
 *   searchPhrase={searchText}
 *   setSearchBarClicked={setSearchFocused}
 *   updateSearchString={(text) => {
 *     setSearchText(text);
 *     performSearch(text);
 *   }}
 * />
 *
 * // Integration with search results
 * <SearchBar
 *   testId="main-search"
 *   searchPhrase={query}
 *   setSearchBarClicked={setSearchActive}
 *   updateSearchString={handleSearchUpdate}
 * />
 * {searchActive && <SearchResults query={query} />}
 * ```
 */

import React from 'react';
import { padding, screenWidth } from '@styles/spacing';
import { Icons } from '@assets/Icons';
import { useI18n } from '@utils/i18n';
import { IconButton, Searchbar } from 'react-native-paper';
import { Keyboard } from 'react-native';

/**
 * Props for the SearchBar component
 */
export type SearchBarProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Current search text value */
  searchPhrase: string;
  /** Current search bar active/focused state */
  searchBarClicked: boolean;
  /** State setter for tracking search bar focus/active state */
  setSearchBarClicked: React.Dispatch<React.SetStateAction<boolean>>;
  /** Callback fired when search text changes */
  updateSearchString: (newSearchString: string) => void;
};

/**
 * SearchBar component for recipe searching
 *
 * @param props - The component props with search state management
 * @returns JSX element representing an interactive search bar with clear functionality
 */
export function SearchBar({
  testId,
  searchPhrase,
  searchBarClicked,
  setSearchBarClicked,
  updateSearchString,
}: SearchBarProps) {
  const { t } = useI18n();

  return (
    <Searchbar
      testID={testId}
      mode={'bar'}
      placeholder={t('searchRecipeTitle')}
      onChangeText={updateSearchString}
      value={searchPhrase}
      autoCorrect={false}
      style={{
        margin: padding.medium,
        marginBottom: padding.small,
        borderRadius: screenWidth / 10,
      }}
      onFocus={() => setSearchBarClicked(true)}
      onSubmitEditing={() => setSearchBarClicked(false)}
      right={props =>
        (searchPhrase.length > 0 || searchBarClicked) && (
          <IconButton
            {...props}
            testID={testId + '::RightIcon'}
            icon={Icons.crossIcon}
            onPress={() => {
              Keyboard.dismiss();
              setSearchBarClicked(false);
              updateSearchString('');
            }}
          />
        )
      }
    />
  );
}

export default SearchBar;
