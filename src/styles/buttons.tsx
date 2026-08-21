/**
 * Button Styles - Comprehensive button styling system for all button components
 *
 * This module provides a complete styling system for all button types used throughout
 * the Recipedia app. Includes responsive sizing, press state styling, and
 * layout utilities with consistent theming.
 *
 * Key Features:
 * - Responsive button sizing with device scaling
 * - Multiple button shapes (square buttons for grid layouts)
 * - Press state styling with visual feedback
 * - Consistent color palette integration
 * - Layout utilities for button groupings
 *
 * @example
 * ```typescript
 * import {
 *   squareButtonStyles,
 *   viewButtonStyles,
 *   pressButtonStyle
 * } from '@styles/buttons';
 *
 * // Using square button styles
 * const buttonStyle = squareButtonStyles(80);
 * <TouchableOpacity style={buttonStyle.squareButton}>
 *   <Icon name="plus" />
 * </TouchableOpacity>
 *
 * // Using press state styling
 * const [isPressed, setIsPressed] = useState(false);
 * const pressStyle = pressButtonStyle(isPressed);
 * <Pressable
 *   style={[viewButtonStyles.viewContainingButton, pressStyle.pressButton]}
 *   onPressIn={() => setIsPressed(true)}
 *   onPressOut={() => setIsPressed(false)}
 * >
 *   <Text>Button</Text>
 * </Pressable>
 * ```
 */

import { padding } from './spacing';
import { StyleSheet } from 'react-native';

/** Border width for button shapes */
const shapeWidth: number = 1;

/** Responsive width for small-sized card buttons */
export const smallCardWidth = 85;

/**
 * Creates the side-dependent geometry for a square button.
 *
 * Colours come from the Paper theme and can't live in this static factory, so
 * callers compose this with `{ backgroundColor, borderColor }` in a style array
 * at render time — see `SquareButton`.
 *
 * @param side - Square side length in pixels
 * @returns StyleSheet object with the square button's geometry
 */
export const squareButtonStyles = (side: number) =>
  StyleSheet.create({
    squareButton: {
      borderWidth: shapeWidth,
      width: side,
      height: side,
      marginHorizontal: padding.small,
    },
  });

/**
 * Common view and layout styles for button containers and content
 * Provides consistent styling for button groupings and internal layouts
 */
export const viewButtonStyles = StyleSheet.create({
  viewContainingButton: {
    padding: padding.small,
  },
  viewInsideButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  wrappingListOfButton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  longVerticalButton: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  longHorizontalButton: {
    paddingLeft: padding.extraLarge,
    paddingVertical: padding.medium,
    flexWrap: 'wrap',
  },
  centeredView: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const viewInsideButtonCentered = StyleSheet.flatten([
  viewButtonStyles.viewInsideButtons,
  viewButtonStyles.centeredView,
]);
