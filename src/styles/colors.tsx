/**
 * Color System - Comprehensive color palette and design tokens
 *
 * This module defines the complete color system for the Recipedia app.
 * Provides semantic color tokens, categorized color palettes, and specialized
 * color schemes for different UI contexts and features.
 *
 * Key Features:
 * - Comprehensive color palette with semantic naming
 * - UI design palette with role-based color assignments
 * - Camera interface specific color scheme
 * - Accessibility-compliant color combinations
 * - Brand-consistent color hierarchy
 * - Cross-platform color compatibility
 *
 * Color Categories:
 * - **Base Colors**: White, grey, and black variations
 * - **Brand Colors**: Primary brand identity colors
 * - **Semantic Colors**: Success, warning, error states
 * - **UI Palette**: Application-specific design tokens
 * - **Camera Palette**: Specialized colors for camera interface
 *
 * Design Principles:
 * - High contrast ratios for accessibility
 * - Consistent color semantics across components
 * - Brand identity alignment with culinary themes
 * - Material Design color system compatibility
 *
 * @example
 * ```typescript
 * import { colors, palette, cameraPalette } from '@styles/colors';
 *
 * // Using base colors
 * const styles = StyleSheet.create({
 *   background: {
 *     backgroundColor: colors.white,
 *   },
 *   text: {
 *     color: colors.darkGrey,
 *   }
 * });
 *
 * // Using semantic UI palette
 * const uiStyles = StyleSheet.create({
 *   primaryButton: {
 *     backgroundColor: palette.primary,
 *   },
 *   textPrimary: {
 *     color: palette.textPrimary,
 *   },
 *   borderColor: {
 *     borderColor: palette.borderColor,
 *   }
 * });
 *
 * // Using camera interface colors
 * const cameraStyles = StyleSheet.create({
 *   overlay: {
 *     backgroundColor: cameraPalette.overlayColor,
 *   },
 *   button: {
 *     color: cameraPalette.buttonsColor,
 *   }
 * });
 * ```
 */

/**
 * Base color palette with descriptive names and hex values
 * Organized by color families for easy selection and maintenance
 */
export const colors = {
  // White and grey color palette
  white: '#FFFFFF',
  ghostWhite: '#F8F8FF',
  floralWhite: '#FFFAF0',
  grey: '#F9F9F9',
  athensGrey: '#DCDDDD',
  faddedGrey: '#EAE8E4',
  greyGhost: '#DDDCDA',
  overdueGrey: '#C7C3BE',
  sharpGrey: '#C9CAD1',
  paleDull: '#ADADAD',
  blackOlive: '#484538',
  darkGrey: '#444444',
  DavyGrey: '#525252',

  // Soft black color palette
  black1: '#414a4c',
  black2: '#3b444b',
  black3: '#353839',
  black4: '#232b2b',
  black5: '#0e1111',
  pureBlack: '#000000',

  // Other color palette
  byzantium: '#6B2D5C',
  purpureus: '#9D44B5',
  verdigris: '#50A2A7',
  blueMunsell: '#62929E',
  pictonBlue: '#3FA7D6',
  DodgerBlue: '#0197F6',

  darkPastelGris: '#0CCA4A',
  emerald: '#6FD08C',
  pigmentGreen: '#3FA34D',
  forestGreen: '#2A9134',
  darkSpringGreen: '#137547',
  britishRacingGreen: '#054A29',

  jonquil: '#F0C808',
  darkPurple: '#381D2A',
  atomicTangerine: '#F39B6D',
  UTOrange: '#FB8B24',
  burntSienna: '#E26D5A',
  redPantone: '#EF233C',
};

/**
 * UI design palette with semantic color assignments
 * Maps base colors to specific UI roles and component states
 * for consistent application design and theming
 */
export const palette = {
  // Colors of the UI design
  primary: colors.emerald,
  secondary: colors.blueMunsell,
  accent: colors.burntSienna,
  bonusColor1: colors.blackOlive,
  bonusColor2: colors.byzantium,

  textPrimary: '#0F0A39',
  textTertiary: '#7B7B7B',
  textGrey: '#B4B4B4',

  textBackground: colors.greyGhost,

  borderColor: '#D4D4D4',
  backgroundColor: '#E4E4E4',
  modalBackground: '#404040d5',
  white: '#F8F8FF',
  ratingColor: '#ebc307',
  progressGrey: '#C1C1C1',
};
