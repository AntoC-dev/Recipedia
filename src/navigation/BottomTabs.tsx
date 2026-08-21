/**
 * BottomTabs - Material Design 3 bottom tab navigation
 *
 * The main navigation interface providing access to the four primary app sections.
 * Features Material Design 3 styling with adaptive icons, internationalization,
 * and theme-aware design. Includes status bar configuration and responsive layout.
 *
 * Key Features:
 * - Material Design 3 bottom navigation pattern
 * - Adaptive icon states (selected/unselected variants)
 * - Internationalized tab labels
 * - Theme-aware styling and colors
 * - Responsive sizing based on screen dimensions
 * - Status bar integration with theme colors
 * - Smooth transitions and animations
 * - Accessibility support with proper contrast
 *
 * Tab Structure:
 * - **Home**: Recipe recommendations and creation entry points
 * - **Search**: Advanced recipe search and filtering
 * - **Shopping**: Smart shopping list with recipe integration
 * - **Parameters**: App settings and configuration
 *
 * Design Patterns:
 * - Selected tabs show filled icons with background highlight
 * - Unselected tabs use outline icons for visual hierarchy
 * - Consistent spacing and sizing across all tabs
 * - Smooth color transitions following Material guidelines
 *
 * @example
 * ```typescript
 * // Used within RootNavigator
 * <Stack.Screen name="Tabs" component={BottomTabs} />
 *
 * // Navigation from any screen to specific tab
 * navigation.navigate('Tabs', { screen: 'Search' });
 * navigation.navigate('Tabs', { screen: 'Home' });
 *
 * // The BottomTabs component automatically handles:
 * // - Icon state management
 * // - Theme integration
 * // - Internationalization
 * // - Responsive layout
 * ```
 */

import { BottomNavigation, Icon, useTheme } from 'react-native-paper';
import { dictionaryIcons, Icons, iconsSize } from '@assets/Icons';
import React from 'react';
import { View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Home } from '@screens/Home';
import { Menu } from '@screens/Menu';
import { Shopping } from '@screens/Shopping';
import { Parameters } from '@screens/Parameters';
import { useI18n } from '@utils/i18n';
import { Search } from '@screens/Search';
import { Tab, TabScreenParamList } from '@customTypes/ScreenTypes';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

const testId = 'BottomTabs';

/**
 * Resolves the text shown (and announced) for a bottom tab.
 *
 * `tabBarLabel` may be a string or a render function; only a string is usable as
 * plain text, so anything else falls back to the route name. Single source for
 * both the visible label and the accessibility label so the two cannot diverge.
 *
 * @param tabBarLabel - The route's `tabBarLabel` option, if any
 * @param routeName - Fallback used when no string label is set
 * @returns The label string for display and accessibility
 */
export function resolveTabLabel(
  tabBarLabel: BottomTabNavigationOptions['tabBarLabel'],
  routeName: string
): string {
  return typeof tabBarLabel === 'string' ? tabBarLabel : routeName;
}

type TabIcons = { focused: dictionaryIcons; unfocused: dictionaryIcons };

// The `Icons` keys read inverted: `homeUnselectedIcon` is the filled glyph, shown on focus.
const TAB_ICONS: Record<keyof TabScreenParamList, TabIcons> & Record<string, TabIcons> = {
  Home: { focused: Icons.homeUnselectedIcon, unfocused: Icons.homeSelectedIcon },
  Search: { focused: Icons.searchIcon, unfocused: Icons.searchIcon },
  Menu: { focused: Icons.menuUnselectedIcon, unfocused: Icons.menuSelectedIcon },
  Shopping: { focused: Icons.shoppingUnselectedIcon, unfocused: Icons.shoppingSelectedIcon },
  Parameters: { focused: Icons.parametersUnselectedIcon, unfocused: Icons.parametersSelectedIcon },
};

function getTabIconName(routeName: string, focused: boolean): dictionaryIcons {
  const icons = TAB_ICONS[routeName];
  if (!icons) {
    return Icons.crossIcon;
  }
  return focused ? icons.focused : icons.unfocused;
}

/**
 * Material Design 3 tab bar backed by Paper's navigation bar.
 *
 * @param props - Tab bar props supplied by the bottom tab navigator
 * @returns JSX element representing the app's bottom navigation bar
 */
export function BottomTabBar({ navigation, state, descriptors, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reportTabBarHeight = React.useContext(BottomTabBarHeightCallbackContext);

  const getLabel = (route: (typeof state.routes)[number]): string =>
    resolveTabLabel(descriptors[route.key]?.options.tabBarLabel, route.name);

  return (
    <View
      testID={testId + '::Bar'}
      // Paper takes the bar out of the flow with the keyboard up, collapsing this to zero.
      onLayout={event => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) {
          reportTabBarHeight?.(height);
        }
      }}
    >
      <BottomNavigation.Bar
        navigationState={state}
        safeAreaInsets={insets}
        style={{ backgroundColor: colors.surface }}
        activeColor={colors.onPrimaryContainer}
        inactiveColor={colors.onPrimaryContainer}
        activeIndicatorStyle={{ backgroundColor: colors.primaryContainer }}
        onTabPress={({ route, preventDefault }) => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) {
            preventDefault();
          } else {
            navigation.dispatch({
              ...CommonActions.navigate(route.name, route.params),
              target: state.key,
            });
          }
        }}
        renderIcon={({ route, focused, color }) => (
          <Icon source={getTabIconName(route.name, focused)} size={iconsSize.large} color={color} />
        )}
        getLabelText={({ route }) => getLabel(route)}
        getTestID={({ route }) => descriptors[route.key]?.options.tabBarButtonTestID}
        // BottomNavigation.Bar draws two label layers (active/inactive crossfade); on iOS
        // both are exposed to accessibility and compose into a doubled name ("Home, Home").
        // An explicit accessibilityLabel collapses each tab to a single leaf, so the visible
        // label is announced once and stays queryable by E2E.
        getAccessibilityLabel={({ route }) => getLabel(route)}
      />
    </View>
  );
}

/**
 * BottomTabs component - Material Design 3 tab navigation
 *
 * @returns JSX element representing the main app tab navigation
 */
export function BottomTabs() {
  const { t } = useI18n();

  // During the tutorial every tab must stay mounted, attached and unfrozen:
  // steps have to be registered before copilot starts, detaching an inactive
  // screen mid-overlay reparents its native view and crashes Fabric's Yoga
  // layout, and freezing one stalls the step anchored to it. Outside the
  // tutorial all three revert to their cheaper defaults.
  const isTutorialActive = useSafeCopilot() != null;
  const shouldRenderLazy = !isTutorialActive;

  const labels = {
    home: t('home'),
    search: t('search'),
    menu: t('menu'),
    shopping: t('shopping'),
    parameters: t('parameters'),
  };

  return (
    <Tab.Navigator
      initialRouteName='Home'
      detachInactiveScreens={!isTutorialActive}
      screenOptions={{ headerShown: false, freezeOnBlur: !isTutorialActive }}
      tabBar={props => <BottomTabBar {...props} />}
    >
      <Tab.Screen
        name='Home'
        component={Home}
        options={{
          tabBarLabel: labels.home,
          lazy: shouldRenderLazy,
          tabBarButtonTestID: testId + '::Home',
        }}
      />
      <Tab.Screen
        name='Search'
        component={Search}
        options={{
          tabBarLabel: labels.search,
          lazy: shouldRenderLazy,
          tabBarButtonTestID: testId + '::Search',
        }}
      />
      <Tab.Screen
        name='Menu'
        component={Menu}
        options={{
          tabBarLabel: labels.menu,
          lazy: shouldRenderLazy,
          tabBarButtonTestID: testId + '::Menu',
        }}
      />
      <Tab.Screen
        name='Shopping'
        component={Shopping}
        options={{
          tabBarLabel: labels.shopping,
          lazy: shouldRenderLazy,
          tabBarButtonTestID: testId + '::Shopping',
        }}
      />
      <Tab.Screen
        name='Parameters'
        component={Parameters}
        options={{
          tabBarLabel: labels.parameters,
          lazy: shouldRenderLazy,
          tabBarButtonTestID: testId + '::Parameters',
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabs;
