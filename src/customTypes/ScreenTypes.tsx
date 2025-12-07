/**
 * ScreenTypes - Type-safe navigation definitions for React Navigation
 *
 * This module provides comprehensive TypeScript type definitions for React Navigation,
 * ensuring type safety across all navigation operations in the Recipedia app.
 * Includes parameter lists, screen props, and navigation utilities.
 *
 * Key Features:
 * - Type-safe navigation with compile-time parameter validation
 * - Comprehensive screen prop definitions
 * - Stack and tab navigation type support
 * - Parameter passing validation
 * - Integration with React Navigation v6
 * - Auto-completion and IntelliSense support
 *
 * Navigation Architecture:
 * - **Stack Navigation**: Modal-style screens (Recipe, Settings)
 * - **Tab Navigation**: Primary app sections (Home, Search, Shopping, Parameters)
 * - **Nested Navigation**: Tabs nested within stack for proper back behavior
 *
 * @example
 * ```typescript
 * // Type-safe navigation calls
 * navigation.navigate('Recipe', {
 *   mode: 'readOnly',
 *   recipe: selectedRecipe
 * }); // ✅ Type-safe
 *
 * navigation.navigate('Recipe', {
 *   invalidProp: 'value'
 * }); // ❌ TypeScript error
 *
 * // Screen component with proper typing
 * function HomeScreen({ navigation, route }: HomeScreenProp) {
 *   // navigation and route are fully typed
 *   return <View>...</View>;
 * }
 *
 * // Custom hook with navigation typing
 * function useTypedNavigation() {
 *   return useNavigation<StackScreenNavigation>();
 * }
 * ```
 */

import { NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { BottomTabScreenProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RecipePropType } from '@customTypes/RecipeNavigationTypes';

/**
 * Recipe screen mode types
 * Defines the different operational states for the Recipe screen
 */
export enum recipeStateType {
  /** View-only mode for existing recipes */
  readOnly,
  /** Edit mode for modifying existing recipes */
  edit,
  /** Manual entry mode for creating new recipes */
  addManual,
  /** OCR-based mode for creating recipes from images */
  addOCR,
}

/**
 * Stack navigator parameter list defining all modal-style screens
 * Maps screen names to their required parameters
 */
export type StackScreenParamList = {
  /** Main tab navigator (no parameters) */
  Tabs: React.JSX.Element;
  /** Recipe screen with mode and data parameters */
  Recipe: RecipePropType;
  /** Language selection screen (no parameters) */
  LanguageSettings: undefined;
  /** Default persons setting screen (no parameters) */
  DefaultPersonsSettings: undefined;
  /** Ingredient management screen (no parameters) */
  IngredientsSettings: undefined;
  /** Tag management screen (no parameters) */
  TagsSettings: undefined;
};

/**
 * Tab navigator parameter list defining main app sections
 * All tab screens currently require no parameters
 */
export type TabScreenParamList = {
  /** Home dashboard screen */
  Home: undefined;
  /** Recipe search and filtering screen */
  Search: undefined;
  /** Shopping list management screen */
  Shopping: undefined;
  /** App settings and configuration screen */
  Parameters: undefined;
};

/** Type-safe stack navigator instance */
export const Stack = createNativeStackNavigator<StackScreenParamList>();

/** Type-safe tab navigator instance */
export const Tab = createBottomTabNavigator<TabScreenParamList>();

/** Navigation prop type for stack navigation usage */
export type StackScreenNavigation = NavigationProp<StackScreenParamList>;

export type TabScreenNavigation = NavigationProp<TabScreenParamList>;

// =============================================================================
// TAB SCREEN PROP TYPES
// =============================================================================

/** Props for Home tab screen component */
export type HomeScreenProp = BottomTabScreenProps<TabScreenParamList, 'Home'>;

/** Props for Search tab screen component */
export type SearchScreenProp = BottomTabScreenProps<TabScreenParamList, 'Search'>;

/** Props for Shopping tab screen component */
export type ShoppingScreenProp = BottomTabScreenProps<TabScreenParamList, 'Shopping'>;

/** Props for Parameters tab screen component */
export type ParametersScreenProp = BottomTabScreenProps<TabScreenParamList, 'Parameters'>;

// =============================================================================
// STACK SCREEN PROP TYPES
// =============================================================================

/** Props for Recipe stack screen component */
export type RecipeScreenProp = NativeStackScreenProps<StackScreenParamList, 'Recipe'>;

/** Props for Language Settings stack screen component */
export type LanguageSettingsProp = NativeStackScreenProps<StackScreenParamList, 'LanguageSettings'>;

/** Props for Default Persons Settings stack screen component */
export type DefaultPersonsSettingsProp = NativeStackScreenProps<
  StackScreenParamList,
  'DefaultPersonsSettings'
>;

/** Props for Ingredients Settings stack screen component */
export type IngredientsSettingProp = NativeStackScreenProps<
  StackScreenParamList,
  'IngredientsSettings'
>;

/** Props for Tags Settings stack screen component */
export type TagsSettingsProp = NativeStackScreenProps<StackScreenParamList, 'TagsSettings'>;
