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

import { Icon, useTheme } from 'react-native-paper';
import { Icons, iconsSize } from '@assets/Icons';
import React, { useContext } from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home } from '@screens/Home';
import { Menu } from '@screens/Menu';
import { Shopping } from '@screens/Shopping';
import { Parameters } from '@screens/Parameters';
import { padding, screenHeight } from '@styles/spacing';
import { useI18n } from '@utils/i18n';
import { Search } from '@screens/Search';
import { Tab } from '@customTypes/ScreenTypes';
import { DarkModeContext } from '@context/DarkModeContext';
import { useSafeCopilot } from '@hooks/useSafeCopilot';

const testId = 'BottomTabs';

/**
 * BottomTabs component - Material Design 3 tab navigation
 *
 * @returns JSX element representing the main app tab navigation
 */
export function BottomTabs() {
  const { colors, fonts } = useTheme();
  const { isDarkMode } = useContext(DarkModeContext);
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  /**
   * Returns the appropriate icon for active (selected) tab states
   * @param routeName - Name of the route/tab
   * @returns Icon name for the active state
   */
  function getActiveIconName(routeName: string): string {
    switch (routeName) {
      case 'Home':
        return Icons.homeUnselectedIcon;
      case 'Search':
        return Icons.searchIcon;
      case 'Menu':
        return Icons.menuUnselectedIcon;
      case 'Shopping':
        return Icons.shoppingUnselectedIcon;
      case 'Plannification':
        return Icons.plannerUnselectedIcon;
      case 'Parameters':
        return Icons.parametersUnselectedIcon;
      default:
        return Icons.crossIcon;
    }
  }

  /**
   * Returns the appropriate icon for inactive (unselected) tab states
   * @param routeName - Name of the route/tab
   * @returns Icon name for the inactive state
   */
  function getInactiveIconName(routeName: string): string {
    switch (routeName) {
      case 'Home':
        return Icons.homeSelectedIcon;
      case 'Search':
        return Icons.searchIcon;
      case 'Menu':
        return Icons.menuSelectedIcon;
      case 'Shopping':
        return Icons.shoppingSelectedIcon;
      case 'Plannification':
        return Icons.plannerSelectedIcon;
      case 'Parameters':
        return Icons.parametersSelectedIcon;
      default:
        return Icons.crossIcon;
    }
  }

  // Only disable lazy loading during tutorial mode (when copilot is active)
  // to ensure all tutorial steps are registered before copilot starts.
  // In normal operation, enable lazy loading for better performance.
  const copilotData = useSafeCopilot();
  const shouldRenderLazy = !copilotData;

  const labels = {
    home: t('home'),
    search: t('search'),
    menu: t('menu'),
    shopping: t('shopping'),
    parameters: t('parameters'),
  };

  return (
    <>
      <StatusBar
        backgroundColor={colors.primaryContainer}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <Tab.Navigator
        initialRouteName='Home'
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => {
            // Use different icon variants for focused/unfocused states (MD3 pattern)
            const iconName = focused
              ? getActiveIconName(route.name)
              : getInactiveIconName(route.name);
            const iconSize = iconsSize.medium;

            return (
              <View
                accessible={false} // Allow tabBarTestID to be accessible on iOS
                style={[
                  {
                    paddingHorizontal: padding.medium,
                    paddingVertical: padding.verySmall,
                  },
                  focused
                    ? {
                        borderRadius: iconSize * 0.6,
                        backgroundColor: colors.primaryContainer,
                      }
                    : {},
                ]}
              >
                <Icon source={iconName} size={iconSize} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: colors.onPrimaryContainer,
          tabBarInactiveTintColor: colors.onPrimaryContainer,
          tabBarStyle: {
            height: screenHeight / 9 + insets.bottom,
            backgroundColor: colors.surface,
            elevation: 2,
            shadowOpacity: 0.1,
            borderTopWidth: 0,
            paddingBottom: insets.bottom,
          },
          tabBarItemStyle: {
            paddingVertical: padding.small,
          },
          tabBarLabelStyle: fonts.bodyMedium,
        })}
      >
        <Tab.Screen
          name='Home'
          component={Home}
          options={{
            tabBarLabel: labels.home,
            tabBarAccessibilityLabel: labels.home,
            lazy: shouldRenderLazy,
            tabBarTestID: testId + '::Home',
          }}
        />
        <Tab.Screen
          name='Search'
          component={Search}
          options={{
            tabBarLabel: labels.search,
            tabBarAccessibilityLabel: labels.search,
            lazy: shouldRenderLazy,
            tabBarTestID: testId + '::Search',
          }}
        />
        <Tab.Screen
          name='Menu'
          component={Menu}
          options={{
            tabBarLabel: labels.menu,
            tabBarAccessibilityLabel: labels.menu,
            lazy: shouldRenderLazy,
            tabBarTestID: testId + '::Menu',
          }}
        />
        <Tab.Screen
          name='Shopping'
          component={Shopping}
          options={{
            tabBarLabel: labels.shopping,
            tabBarAccessibilityLabel: labels.shopping,
            lazy: shouldRenderLazy,
            tabBarTestID: testId + '::Shopping',
          }}
        />
        <Tab.Screen
          name='Parameters'
          component={Parameters}
          options={{
            tabBarLabel: labels.parameters,
            tabBarAccessibilityLabel: labels.parameters,
            lazy: shouldRenderLazy,
            tabBarTestID: testId + '::Parameters',
          }}
        />
      </Tab.Navigator>
    </>
  );
}

export default BottomTabs;
