/**
 * Recipe Component Styles - Specialized styling for recipe-related UI components
 *
 * This module provides comprehensive styling for all recipe-specific components
 * including form inputs, display sections, tag management, and number controls.
 * Designed specifically for recipe creation, editing, and viewing interfaces.
 *
 * Key Features:
 * - Consistent spacing and margins for recipe sections
 * - Form input styling for recipe creation/editing
 * - Tag container and management layouts
 * - Number input controls with stepper buttons
 * - Responsive column layouts for ingredient tables
 * - Specialized styling for recipe text rendering
 * - Flexible container systems for different recipe content types
 *
 * Style Categories:
 * - **Text Styles**: Recipe form inputs and editable content
 * - **Render Styles**: Read-only recipe display components
 * - **Tag Styles**: Tag selection and management interfaces
 * - **Number Styles**: Numeric input controls and steppers
 *
 * Layout Patterns:
 * - Section-based organization with consistent padding
 * - Three-column layouts for ingredient displays
 * - Tab-style layouts for category selection
 * - Centered button arrangements for actions
 *
 * @example
 * ```typescript
 * import {
 *   recipeTextStyles,
 *   recipeTextRenderStyles,
 *   recipeTagsStyles,
 *   recipeNumberStyles
 * } from '@styles/recipeComponents';
 *
 * // Recipe form section
 * <View style={recipeTextStyles.containerSection}>
 *   <View style={recipeTextStyles.containerElement}>
 *     <TextInput placeholder="Recipe title" />
 *   </View>
 * </View>
 *
 * // Recipe display with tags
 * <View style={recipeTextRenderStyles.containerSection}>
 *   <Text style={recipeTextRenderStyles.headlineElement}>Ingredients</Text>
 *   <View style={recipeTextRenderStyles.tagView}>
 *     {tags.map(tag => <TagButton key={tag} title={tag} />)}
 *   </View>
 * </View>
 *
 * // Number input with controls
 * <View style={recipeNumberStyles.editableView}>
 *   <Button onPress={decrease}>-</Button>
 *   <TextInput value={count.toString()} />
 *   <Button onPress={increase}>+</Button>
 * </View>
 * ```
 */

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { padding, screenViews } from '@styles/spacing';

/**
 * Internal margin and padding utilities for recipe components
 * Provides consistent spacing patterns used throughout recipe interfaces
 */
const recipeMargins = StyleSheet.create({
  padding: { paddingHorizontal: padding.medium, paddingVertical: padding.small },
  smallVerticalMargin: {
    marginVertical: padding.verySmall,
  },
  mediumVerticalMargin: {
    marginVertical: padding.medium,
  },
  largeVerticalMargin: {
    marginVertical: padding.veryLarge,
  },
});

/**
 * Styling for recipe text input and editable components
 * Used in recipe creation and editing forms
 */
export const recipeTextStyles = StyleSheet.create({
  containerSection: recipeMargins.padding as ViewStyle,
  containerElement: recipeMargins.smallVerticalMargin,
  containerTab: {
    ...recipeMargins.padding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.medium,
  } as ViewStyle,
  button: { ...recipeMargins.mediumVerticalMargin } as ViewStyle,
});

/**
 * Styling for recipe display and read-only components
 * Used in recipe viewing and presentation interfaces
 */
export const recipeTextRenderStyles = StyleSheet.create({
  containerSection: recipeMargins.padding as ViewStyle,
  headlineElement: { ...recipeMargins.smallVerticalMargin, padding: padding.small },
  readOnlyElement: { ...recipeMargins.padding, marginLeft: padding.medium } as TextStyle,
  containerElement: { padding: padding.small },
  tagView: screenViews.tabView as ViewStyle,
  firstColumn: { flex: 2, textAlign: 'center', width: '100%' } as ViewStyle,
  secondColumn: { flex: 2, textAlign: 'center', width: '100%' } as ViewStyle,
  thirdColumn: { flex: 3, flexWrap: 'wrap', textAlign: 'center', width: '100%' } as ViewStyle,
  columnContentStyle: recipeMargins.mediumVerticalMargin,
  roundButtonPadding: { ...recipeMargins.mediumVerticalMargin } as ViewStyle,
});

/**
 * Shared button styling for round buttons used across recipe components
 * Provides consistent layout and spacing for button containers and individual buttons
 */
export const recipeButtonStyles = StyleSheet.create({
  roundButtonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: padding.medium,
  } as ViewStyle,
  roundButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
});

/**
 * Styling for recipe tag management and selection components
 * Used in tag input, selection, and display interfaces
 */
export const recipeTagsStyles = StyleSheet.create({
  containerSection: { ...recipeMargins.padding } as ViewStyle,
  containerElement: { ...recipeMargins.smallVerticalMargin } as TextStyle,
  tagsContainer: { padding: padding.small } as ViewStyle,
  tab: screenViews.tabView as ViewStyle,
  textInputDropDownContainer: { padding: padding.medium } as ViewStyle,
  roundButtonsContainer: recipeButtonStyles.roundButtonsContainer,
  roundButton: recipeButtonStyles.roundButton,
});

/**
 * Styling for recipe number input and stepper components
 * Used for quantity, serving size, and timing inputs
 */
export const recipeNumberStyles = StyleSheet.create({
  editableView: { flexDirection: 'row', alignItems: 'center', gap: padding.medium } as ViewStyle,
  addView: {} as ViewStyle,
  roundButtonsContainer: {
    ...recipeButtonStyles.roundButtonsContainer,
    marginTop: padding.large,
  } as ViewStyle,
  roundButton: recipeButtonStyles.roundButton,
});

/**
 * Styling for recipe ingredient table components
 * Used by RecipePreparation for round button layouts
 */
export const recipeTableStyles = StyleSheet.create({
  roundButtonsContainer: recipeButtonStyles.roundButtonsContainer,
  roundButton: recipeButtonStyles.roundButton,
});
