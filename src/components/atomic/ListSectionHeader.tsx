/**
 * ListSectionHeader - Section header for the Menu and Shopping lists
 *
 * Shared header so both screens introduce their sections the same way: a
 * primary-colored title above the rows it groups.
 *
 * Paper's `List.Subheader` is not used because it hardcodes
 * `variant='bodyMedium'` and a fixed horizontal padding; the header takes its
 * inset from the screen's list container instead, so it lines up with the rows
 * below it.
 *
 * @example
 * ```typescript
 * <ListSectionHeader testID='MenuScreen::SectionHeader::ToCook' title={t('menuScreen.toCook')} />
 * ```
 */

import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { MD3Theme, Text, useTheme } from 'react-native-paper';
import { padding } from '@styles/spacing';

/**
 * Typography of a list section header, for the rare consumer that cannot render
 * {@link ListSectionHeader} itself — Paper's `List.Accordion` wraps its `title`
 * in its own `Text`, so the purchased block styles that text instead.
 *
 * @param colors - The active theme colors.
 * @param fonts - The active theme fonts.
 * @returns The text style shared by every list section header.
 */
export function listSectionHeaderTextStyle(
  colors: MD3Theme['colors'],
  fonts: MD3Theme['fonts']
): TextStyle {
  return { ...fonts.titleMedium, color: colors.primary };
}

/** Props for the {@link ListSectionHeader} component */
export type ListSectionHeaderProps = {
  /** Already translated header label */
  title: string;
  /** Unique identifier for testing and accessibility */
  testID: string;
};

/**
 * ListSectionHeader component
 *
 * @param props - The component props
 * @returns JSX element representing a list section header
 */
export function ListSectionHeader({ title, testID }: ListSectionHeaderProps) {
  const { colors, fonts } = useTheme();

  return (
    <Text
      testID={testID}
      variant='titleMedium'
      accessibilityRole='header'
      style={[styles.header, listSectionHeaderTextStyle(colors, fonts)]}
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: padding.large,
    paddingBottom: padding.verySmall,
  },
});
