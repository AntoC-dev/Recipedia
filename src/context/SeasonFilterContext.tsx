/**
 * SeasonFilterContext - Global seasonal filtering state management
 *
 * React context providing global seasonal filtering functionality that affects
 * recipe search and display throughout the app. Manages persistent storage of
 * the user's seasonal preference and integrates with search/filter systems.
 *
 * Key Features:
 * - Global seasonal filter state management
 * - Persistent storage of seasonal preference
 * - Integration with search and filtering systems
 * - Type-safe context with proper error handling
 * - Automatic loading of saved preferences
 * - Real-time state synchronization across components
 *
 * Seasonal Filtering Logic:
 * When enabled, the app automatically filters recipes and search results to show
 * only items using ingredients that are currently in season, providing users with
 * more relevant and seasonally appropriate recipe suggestions.
 *
 * @example
 * ```typescript
 * // Using the context in a component
 * import { useSeasonFilter } from '@context/SeasonFilterContext';
 *
 * function SearchFilters() {
 *   const { seasonFilter, setSeasonFilter } = useSeasonFilter();
 *
 *   return (
 *     <Switch
 *       value={seasonFilter}
 *       onValueChange={setSeasonFilter}
 *       label="Show only seasonal recipes"
 *     />
 *   );
 * }
 *
 * // Provider setup (typically in App.tsx)
 * <SeasonFilterProvider>
 *   <NavigationContainer>
 *     <RootNavigator />
 *   </NavigationContainer>
 * </SeasonFilterProvider>
 *
 * // Integration with search logic
 * const { seasonFilter } = useSeasonFilter();
 * const filteredRecipes = seasonFilter
 *   ? recipes.filter(recipe => isSeasonallyAppropriate(recipe))
 *   : recipes;
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSeasonFilter, setSeasonFilter } from '@utils/settings';

/**
 * Type definition for the seasonal filter context
 */
export interface SeasonFilterContextType {
  /** Current seasonal filter state */
  seasonFilter: boolean;
  /** Function to toggle the seasonal filter */
  setSeasonFilter: () => void;
}

/**
 * React context for seasonal filter state management
 */
const SeasonFilterContext = createContext<SeasonFilterContextType | undefined>(undefined);

/**
 * Custom hook for accessing seasonal filter context
 *
 * @returns SeasonFilterContextType object with current state and toggle function
 * @throws Error if used outside of SeasonFilterProvider
 */
export const useSeasonFilter = () => {
  const context = useContext(SeasonFilterContext);
  if (!context) {
    throw new Error('useSeasonFilter must be used within SeasonFilterProvider');
  }
  return context;
};

/**
 * SeasonFilterProvider component - Provides seasonal filter context to child components
 *
 * @param props - React children to wrap with seasonal filter context
 * @returns JSX element providing seasonal filter context
 */
export const SeasonFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [seasonFilter, setSeasonFilterState] = useState(true);

  useEffect(() => {
    getSeasonFilter()
      .then(value => {
        setSeasonFilterState(value);
      })
      .catch(() => {
        setSeasonFilterState(true);
      });
  }, []);

  const setSeasonFilterContext = () => {
    const newSeasonFilter = !seasonFilter;
    setSeasonFilterState(newSeasonFilter);
    void setSeasonFilter(newSeasonFilter);
  };

  return (
    <SeasonFilterContext.Provider value={{ seasonFilter, setSeasonFilter: setSeasonFilterContext }}>
      {children}
    </SeasonFilterContext.Provider>
  );
};
