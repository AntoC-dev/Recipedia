/**
 * Spacing and Layout System - Responsive spacing and layout utilities
 *
 * This module provides a comprehensive spacing and layout system for the Recipedia app.
 * Implements responsive design principles with device-aware scaling and consistent
 * spacing values throughout the application.
 *
 * Key Features:
 * - Device-aware scaling based on screen dimensions
 * - Responsive rem units for consistent spacing
 * - Predefined padding scales for consistent UI
 * - Screen-specific layout styles and containers
 * - Split-screen and flex layout utilities
 * - Standardized view containers for different content types
 *
 * Responsive System:
 * - **Base Width**: 390px reference for rem calculation
 * - **Scale Factor**: Adapts to device pixel density
 * - **Dynamic Sizing**: All spacing scales with screen size
 * - **Cross-Platform**: Works consistently on iOS and Android
 *
 * Spacing Scale:
 * - **verySmall**: 3px - Minimal spacing for tight layouts
 * - **small**: 7px - Standard component padding
 * - **medium**: 12px - Section spacing
 * - **large**: 15px - Container padding
 * - **veryLarge**: 20px - Screen margins
 * - **extraLarge**: 30px - Major section spacing
 *
 * @example
 * ```typescript
 * import { padding, screenViews, viewsSplitScreen, remValue } from '@styles/spacing';
 *
 * // Using predefined padding values
 * const styles = StyleSheet.create({
 *   container: {
 *     padding: padding.medium,
 *     margin: padding.large,
 *   },
 *   section: {
 *     paddingVertical: padding.small,
 *     paddingHorizontal: padding.veryLarge,
 *   }
 * });
 *
 * // Using screen view containers
 * <View style={screenViews.tabView}>
 *   <Text>Tab content</Text>
 * </View>
 *
 * // Using split screen layout
 * <View style={viewsSplitScreen.viewInRow}>
 *   <View style={viewsSplitScreen.splitIn2View}>
 *     <Text>Left side</Text>
 *   </View>
 *   <View style={viewsSplitScreen.splitIn2View}>
 *     <Text>Right side</Text>
 *   </View>
 * </View>
 *
 * // Using responsive scroll margins
 * const scrollStyles = scrollView(80);
 * <ScrollView style={scrollStyles.view}>
 *   <Text>Scrollable content</Text>
 * </ScrollView>
 * ```
 */

import { Dimensions, StyleSheet } from 'react-native';
import { Edge } from 'react-native-safe-area-context';

/** Device scale factor for responsive calculations */
const scaleFactor = Dimensions.get('screen').scale / Dimensions.get('window').scale;

/** Responsive screen width adjusted for device scaling */
export const screenWidth = Dimensions.get('window').width * scaleFactor;

/** Responsive screen height adjusted for device scaling */
export const screenHeight = Dimensions.get('window').height * scaleFactor;

/**
 * Responsive rem unit value based on 390px reference width
 * Ensures consistent scaling across different device sizes
 */
export const remValue = screenWidth / 390;

/**
 * Standardized padding scale for consistent spacing throughout the app
 * All values are in pixels and scale appropriately on different devices
 */
export const padding = {
  verySmall: 3,
  small: 7,
  medium: 12,
  large: 15,
  veryLarge: 20,
  extraLarge: 30,
};

/**
 * Border-radius scale for consistent rounded corners throughout the app
 * All values are in pixels
 */
export const radius = {
  /** Subtle rounding for small thumbnails */
  small: 8,
  /** Standard rounding for cards and images */
  medium: 12,
  /** Fully rounded corners for pills and circular badges */
  full: 999,
};

/**
 * Card-related size constants for consistent card layouts
 */
export const cardSizes = {
  /** Size for inline recipe thumbnails in list views */
  thumbnailSize: 56,
};

/**
 * Progress bar height - 1% of screen height for responsive design
 * Ensures consistent progress indicator sizing across different devices
 */
export const progressBarHeight = screenHeight * 0.01;

/** Maximum height for dialogs to prevent overflow on small screens */
export const dialogMaxHeight = Dimensions.get('window').height;

/** Space to reserve behind a pinned BottomActionButton, minus the safe-area strip it spans */
export const bottomActionButtonHeight = 48 + padding.small * 2;

/**
 * Bottom padding reserved by tab-hosted screens above the bottom TabNavigator.
 *
 * The tab bar (`BottomNavigation.Bar` in `src/navigation/BottomTabs.tsx`) already
 * consumes the bottom safe-area inset via its `safeAreaInsets` prop, so this value
 * is pure breathing room between a screen's scrollable content and the tab bar —
 * not inset compensation. Every tab-hosted screen must use this single constant
 * instead of re-deriving its own bottom padding, which is what produced the
 * inconsistent white space above the tab bar across screens.
 */
export const tabScreenBottomPadding = padding.extraLarge;

/**
 * Safe-area edges a tab-hosted screen passes to `ScreenWrapper`.
 *
 * Deliberately excludes `'bottom'`: the tab bar already spans and accounts for
 * the bottom safe-area inset, so applying it again would double-count that
 * inset and produce a visible white strip above the tab bar.
 */
export const tabScreenEdges: Edge[] = ['top', 'left', 'right'];

/**
 * Standard screen and section view styles for consistent layout
 * Provides common container styles used throughout the application
 */
export const screenViews = StyleSheet.create({
  tabView: {
    flexDirection: 'row',
  },
});
