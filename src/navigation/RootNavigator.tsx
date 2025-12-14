/**
 * RootNavigator - Main stack navigator for the Recipedia app
 *
 * The root-level navigation container that defines the app's primary navigation structure.
 * Features a stack-based navigation pattern with the bottom tabs as the initial route
 * and modal-style screens for detailed interactions like recipe editing and settings.
 *
 * Key Features:
 * - Stack-based navigation with bottom tabs as the root
 * - Modal-style presentation for focused interactions
 * - Comprehensive navigation logging for analytics
 * - Header-less design for custom UI control
 * - Type-safe navigation with TypeScript integration
 * - Efficient screen management and memory usage
 *
 * Navigation Structure:
 * ```
 * RootNavigator (Stack)
 * ├── Tabs (BottomTabs) - Main app navigation
 * │   ├── Home - Recipe recommendations and FAB menu
 * │   ├── Search - Recipe search and filtering
 * │   ├── Shopping - Shopping list management
 * │   └── Parameters - App settings hub
 * ├── Recipe - Recipe viewing/editing/creation
 * └── Settings Screens:
 *     ├── LanguageSettings - Language selection
 *     ├── DefaultPersonsSettings - Default serving count
 *     ├── IngredientsSettings - Ingredient database management
 *     └── TagsSettings - Tag system management
 * ```
 *
 * Navigation Patterns:
 * - **Tab Navigation**: Primary app sections (Home, Search, Shopping, Parameters)
 * - **Modal Navigation**: Focused tasks (Recipe editing, Settings screens)
 * - **Deep Linking**: Support for direct navigation to specific recipes
 * - **Back Navigation**: Automatic handling with proper state management
 *
 * @example
 * ```typescript
 * // Usage in App.tsx or similar root component
 * import { NavigationContainer } from '@react-navigation/native';
 * import RootNavigator from './navigation/RootNavigator';
 *
 * export default function App() {
 *   return (
 *     <NavigationContainer>
 *       <RootNavigator />
 *     </NavigationContainer>
 *   );
 * }
 *
 * // Navigation from any screen
 * navigation.navigate('Recipe', { mode: 'readOnly', recipe: selectedRecipe });
 * navigation.navigate('LanguageSettings');
 * ```
 */

import React from 'react';
import { Recipe } from '@screens/Recipe';
import { LanguageSettings } from '@screens/LanguageSettings';
import { DefaultPersonsSettings } from '@screens/DefaultPersonsSettings';
import { IngredientsSettings } from '@screens/IngredientsSettings';
import { TagsSettings } from '@screens/TagsSettings';
import { BulkImportSettings } from '@screens/BulkImportSettings';
import { BulkImportDiscovery } from '@screens/BulkImportDiscovery';
import { BulkImportValidation } from '@screens/BulkImportValidation';
import { Stack } from '@customTypes/ScreenTypes';
import { BottomTabs } from '@navigation/BottomTabs';
import { navigationLogger } from '@utils/logger';

/**
 * RootNavigator component - Main app navigation container
 *
 * @returns JSX element representing the complete app navigation structure
 */
export function RootNavigator() {
  const screenOptions = {
    headerShown: false,
    // Add navigation logging
    listeners: {
      focus: (e: { target?: string }) => {
        navigationLogger.debug('Screen focused', { screenName: e.target?.split('-')[0] });
      },
      blur: (e: { target?: string }) => {
        navigationLogger.debug('Screen blurred', { screenName: e.target?.split('-')[0] });
      },
    },
  };

  return (
    <Stack.Navigator initialRouteName='Tabs' screenOptions={screenOptions}>
      <Stack.Screen name='Tabs' component={BottomTabs} />
      <Stack.Screen name='Recipe' component={Recipe} />
      <Stack.Screen name='LanguageSettings' component={LanguageSettings} />
      <Stack.Screen name='DefaultPersonsSettings' component={DefaultPersonsSettings} />
      <Stack.Screen name='IngredientsSettings' component={IngredientsSettings} />
      <Stack.Screen name='TagsSettings' component={TagsSettings} />
      <Stack.Screen name='BulkImportSettings' component={BulkImportSettings} />
      <Stack.Screen name='BulkImportDiscovery' component={BulkImportDiscovery} />
      <Stack.Screen name='BulkImportValidation' component={BulkImportValidation} />
    </Stack.Navigator>
  );
}

export default RootNavigator;
