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

import { StyleSheet } from 'react-native';
import { padding, screenViews } from '@styles/spacing';

/**
 * Internal margin and padding fragments for recipe components
 * Provides consistent spacing patterns used throughout recipe interfaces.
 * Kept as a plain object (not `StyleSheet.create`) so its fragments spread
 * cleanly into other `StyleSheet.create` calls without widening their
 * inferred style type.
 */
const recipeMargins = {
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
};

/**
 * Styling for recipe text input and editable components
 * Used in recipe creation and editing forms
 */
export const recipeTextStyles = StyleSheet.create({
  containerSection: recipeMargins.padding,
  containerElement: recipeMargins.smallVerticalMargin,
  containerTab: {
    ...recipeMargins.padding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.medium,
  },
  button: { ...recipeMargins.mediumVerticalMargin },
});

/**
 * Styling for recipe display and read-only components
 * Used in recipe viewing and presentation interfaces
 */
export const recipeTextRenderStyles = StyleSheet.create({
  containerSection: recipeMargins.padding,
  headlineElement: { ...recipeMargins.smallVerticalMargin, padding: padding.small },
  readOnlyElement: { ...recipeMargins.padding, marginLeft: padding.medium },
  containerElement: { padding: padding.small },
  tagView: screenViews.tabView,
  firstColumn: { flex: 2, textAlign: 'center', width: '100%' },
  secondColumn: { flex: 2, textAlign: 'center', width: '100%' },
  thirdColumn: { flex: 3, flexWrap: 'wrap', textAlign: 'center', width: '100%' },
  columnContentStyle: recipeMargins.mediumVerticalMargin,
  roundButtonPadding: { ...recipeMargins.mediumVerticalMargin },
});

/**
 * Shared button styling for round buttons used across recipe components.
 * The single source of truth for round-button layout — consumers that need
 * a variant (e.g. extra top margin) compose it via a style array instead of
 * re-exporting an aliased copy under a feature-specific name.
 */
export const recipeButtonStyles = StyleSheet.create({
  roundButtonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: padding.medium,
  },
  roundButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * Styling for recipe tag management and selection components
 * Used in tag input, selection, and display interfaces
 */
export const recipeTagsStyles = StyleSheet.create({
  containerSection: { ...recipeMargins.padding },
  containerElement: { ...recipeMargins.smallVerticalMargin },
  tagsContainer: { padding: padding.small },
  tab: screenViews.tabView,
  textInputDropDownContainer: { padding: padding.medium },
});

/**
 * Styling for recipe number input and stepper components
 * Used for quantity, serving size, and timing inputs
 */
export const recipeNumberStyles = StyleSheet.create({
  editableView: { flexDirection: 'row', alignItems: 'center', gap: padding.medium },
  /** Extra top margin composed onto `recipeButtonStyles.roundButtonsContainer` for this screen's layout. */
  roundButtonsMargin: { marginTop: padding.large },
});
