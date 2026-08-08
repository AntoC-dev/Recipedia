import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import {
  ListSectionHeader,
  listSectionHeaderTextStyle,
} from '@components/atomic/ListSectionHeader';
import { padding } from '@styles/spacing';

const testID = 'Screen::SectionHeader';

describe('ListSectionHeader', () => {
  test('renders the title as a titleMedium accessibility header', () => {
    const { getByTestId } = render(<ListSectionHeader testID={testID} title='To cook' />);

    const header = getByTestId(testID);

    expect(header.props.children).toBe('To cook');
    expect(header.props.variant).toBe('titleMedium');
    expect(header.props.accessibilityRole).toBe('header');
  });

  test('colors the header with the theme primary and spaces it from the rows above', () => {
    const { getByTestId } = render(<ListSectionHeader testID={testID} title='To cook' />);

    expect(StyleSheet.flatten(getByTestId(testID).props.style)).toEqual(
      expect.objectContaining({
        color: '#6200ee',
        paddingTop: padding.large,
        paddingBottom: padding.verySmall,
      })
    );
  });

  test('carries no horizontal padding so the list container owns the inset', () => {
    const { getByTestId } = render(<ListSectionHeader testID={testID} title='Dairy' />);

    const style = StyleSheet.flatten(getByTestId(testID).props.style);

    expect(style.paddingHorizontal).toBeUndefined();
    expect(style.paddingLeft).toBeUndefined();
  });

  test('exposes the same text style for consumers that cannot render the component', () => {
    const colors = { primary: '#6200ee' } as any;
    const fonts = { titleMedium: { fontSize: 16, fontWeight: '500' } } as any;

    expect(listSectionHeaderTextStyle(colors, fonts)).toEqual({
      fontSize: 16,
      fontWeight: '500',
      color: '#6200ee',
    });
  });
});
