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

import { palette } from './colors';
import { padding } from './spacing';
import EStyleSheet from 'react-native-extended-stylesheet';

/** Border width for button shapes */
const shapeWidth: number = 1;

/** Responsive width for small-sized card buttons */
export const smallCardWidth = 85;

/**
 * Creates responsive square button styles with specified side length
 *
 * @param side - Square side length in pixels
 * @returns EStyleSheet object with square button styling
 */
export const squareButtonStyles = (side: number) =>
  EStyleSheet.create({
    squareButton: {
      backgroundColor: palette.secondary,
      borderWidth: shapeWidth,
      borderColor: palette.bonusColor2,
      width: side,
      height: side,
      marginHorizontal: padding.small,
    },
  });

/**
 * Common view and layout styles for button containers and content
 * Provides consistent styling for button groupings and internal layouts
 */
export const viewButtonStyles = EStyleSheet.create({
  viewContainingButton: {
    padding: padding.small,
  },
  viewInsideButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  imageInsideButton: {
    width: '100%',
    height: '100%',
    contentFit: 'cover',
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

export const pressButtonStyle = (pressed: boolean) =>
  EStyleSheet.create({
    pressButton: {
      backgroundColor: pressed ? palette.progressGrey : palette.backgroundColor,
    },
  });

export const wrappingButtonWithPressed = (pressed: boolean) =>
  EStyleSheet.flatten([
    viewButtonStyles.wrappingListOfButton,
    pressButtonStyle(pressed).pressButton,
  ]);

export const viewInsideButtonCentered = EStyleSheet.flatten([
  viewButtonStyles.viewInsideButtons,
  viewButtonStyles.centeredView,
]);
