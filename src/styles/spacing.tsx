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
 * - Extended StyleSheet integration for dynamic values
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
 * <View style={screenViews.screenView}>
 *   <View style={screenViews.sectionView}>
 *     <Text>Section content</Text>
 *   </View>
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
import EStyleSheet from 'react-native-extended-stylesheet';
import { palette } from './colors';

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

/** Initialize Extended StyleSheet with dynamic rem value */
EStyleSheet.build({ $rem: remValue });

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

/**
 * Standard screen and section view styles for consistent layout
 * Provides common container styles used throughout the application
 */
export const screenViews = StyleSheet.create({
  screenView: {
    backgroundColor: palette.backgroundColor,
  },
  sectionView: {
    margin: padding.verySmall,
  },
  listView: {
    padding: padding.small,
  },
  clickableListView: {
    paddingVertical: padding.small,
    paddingLeft: padding.extraLarge,
    paddingRight: padding.small,
  },
  tabView: {
    flexDirection: 'row',
  },
});

/**
 * Dynamic scroll view style generator with responsive margins
 * Creates scroll container styles with device-scaled bottom margins
 *
 * @param margin - Margin value in pixels to be scaled with remValue
 * @returns EStyleSheet object with responsive margin
 */
export const scrollView = (margin: number) =>
  EStyleSheet.create({
    view: {
      marginBottom: margin * remValue,
    },
  });

/**
 * Split-screen and flex layout utilities for responsive design
 * Provides common layout patterns for two-column and row-based layouts
 */
export const viewsSplitScreen = StyleSheet.create({
  splitIn2View: {
    width: '50%',
    padding: padding.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewInRow: {
    flexDirection: 'row',
  },
});
