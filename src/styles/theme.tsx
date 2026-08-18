/**
 * Theme Configuration - Material Design 3 theme setup for Recipedia
 *
 * This module defines the complete theming system for the Recipedia app using Material Design 3
 * principles. Provides light and dark theme configurations with custom color palettes and
 * typography optimized for the recipe management interface.
 *
 * Key Features:
 * - Material Design 3 color system with semantic color tokens
 * - Custom green-based primary palette reflecting culinary themes
 * - Comprehensive elevation and surface color system
 * - Custom typography using Lora variable font family
 * - Theme switching support for light and dark modes
 * - Accessibility-compliant contrast ratios
 * - Consistent color semantics across all components
 *
 * Color System:
 * - **Primary**: Green palette (#006D38) representing fresh ingredients
 * - **Secondary**: Orange palette (#99461D) for accent elements
 * - **Tertiary**: Blue palette (#365CA8) for informational elements
 * - **Surface**: Elevation-based surface colors for depth
 * - **Error**: Standard Material Design error colors
 *
 * Typography:
 * - **Font Family**: Lora variable font (regular, applied to every MD3 variant)
 * - **Hierarchy**: Display, headline, title, body, and label styles
 * - **Weights**: Material Design 3 default per variant (regular for display/headline/title-large/body,
 *   medium for title-medium/small and label) — no custom overrides
 * - **Sizes**: Material Design 3 default type scale, unmodified
 *
 * @example
 * ```typescript
 * import { lightTheme, darkTheme } from '@styles/theme';
 *
 * // Using in React Native Paper provider
 * <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
 *   <App />
 * </PaperProvider>
 *
 * // Accessing theme colors in components
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: theme.colors.surface,
 *     color: theme.colors.onSurface,
 *   },
 *   primaryButton: {
 *     backgroundColor: theme.colors.primary,
 *     color: theme.colors.onPrimary,
 *   }
 * });
 *
 * // Using typography variants
 * <Text variant="titleLarge">Recipe Title</Text>
 * <Text variant="bodyMedium">Recipe description</Text>
 * ```
 */

import { configureFonts, MD3LightTheme } from 'react-native-paper';
import { ThemeProp } from 'react-native-paper/lib/typescript/types';

import { FONT_FAMILY_REGULAR } from './typography';

const fonts = configureFonts({ isV3: true, config: { fontFamily: FONT_FAMILY_REGULAR } });

/**
 * Light theme configuration following Material Design 3 specifications
 * Uses a green-based color palette optimized for culinary content
 * with high contrast ratios for accessibility compliance.
 */
export const lightTheme: ThemeProp = {
  ...MD3LightTheme,
  version: 3,
  colors: {
    primary: '#006D38',
    onPrimary: '#FFFFFF',
    primaryContainer: '#95D9B0',
    onPrimaryContainer: '#00210D',
    secondary: '#99461D',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDBCD',
    onSecondaryContainer: '#360F00',
    tertiary: '#365CA8',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#D9E2FF',
    onTertiaryContainer: '#001944',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FBFDF7',
    onBackground: '#191C19',
    surface: '#FBFDF7',
    onSurface: '#191C19',
    surfaceVariant: '#DDE5DA',
    onSurfaceVariant: '#384940',
    outline: '#717971',
    outlineVariant: '#C1C9BF',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#2E312E',
    inverseOnSurface: '#F0F1EC',
    inversePrimary: '#79DB95',
    elevation: {
      level0: 'transparent',
      level1: '#EEF6ED',
      level2: '#E7F2E8',
      level3: '#DFEDE2',
      level4: '#DDECE0',
      level5: '#D8E9DC',
    },
    surfaceDisabled: '#191c191f',
    onSurfaceDisabled: '#191c1961',
    backdrop: '#2b322b66',
  },
  roundness: 0,
  fonts,
};

/**
 * Dark theme configuration extending the light theme base
 * Provides appropriate contrast and readability for low-light environments
 * while maintaining brand consistency and accessibility standards.
 */
export const darkTheme: ThemeProp = {
  ...lightTheme,
  colors: {
    primary: '#79DB95',
    onPrimary: '#00391A',
    primaryContainer: '#00391A',
    onPrimaryContainer: '#95F7B0',
    secondary: '#FFB597',
    onSecondary: '#581E00',
    secondaryContainer: '#7A2F06',
    onSecondaryContainer: '#FFDBCD',
    tertiary: '#B0C6FF',
    onTertiary: '#002D6E',
    tertiaryContainer: '#18438F',
    onTertiaryContainer: '#D9E2FF',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFB4AB',
    background: '#191C19',
    onBackground: '#E1E3DE',
    surface: '#191C19',
    onSurface: '#E1E3DE',
    surfaceVariant: '#384940',
    onSurfaceVariant: '#C1C9BF',
    outline: '#8B938A',
    outlineVariant: '#384940',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#E1E3DE',
    inverseOnSurface: '#2E312E',
    inversePrimary: '#006D38',
    elevation: {
      level0: 'transparent',
      level1: '#1E261F',
      level2: '#212B23',
      level3: '#243127',
      level4: '#253328',
      level5: '#26372A',
    },
    surfaceDisabled: '#e1e3de1f',
    onSurfaceDisabled: '#e1e3de61',
    backdrop: '#2b322b66',
  },
};
