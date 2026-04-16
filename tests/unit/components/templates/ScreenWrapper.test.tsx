import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { useTheme } from 'react-native-paper';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  useTheme: jest.fn(),
}));

// Mock AppStatusBar
jest.mock('@components/atomic/AppStatusBar', () => ({
  AppStatusBar: () => null,
}));

// Mock SafeAreaView from react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style, edges, testID }: any) => (
      <View style={style} edges={edges} testID={testID}>
        {children}
      </View>
    ),
  };
});

describe('ScreenWrapper component', () => {
  const mockTheme = {
    colors: {
      background: '#FFFFFF',
    },
  };

  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <ScreenWrapper>
        <Text>Test Content</Text>
      </ScreenWrapper>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies default background color from theme', () => {
    const { getByTestId } = render(
      <ScreenWrapper testID='screen-wrapper'>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    const flatStyle = Array.isArray(safeAreaView.props.style)
      ? Object.assign({}, ...safeAreaView.props.style)
      : safeAreaView.props.style;

    expect(flatStyle.backgroundColor).toBe(mockTheme.colors.background);
  });

  it('applies custom background color when provided', () => {
    const customColor = '#FF0000';
    const { getByTestId } = render(
      <ScreenWrapper testID='screen-wrapper' backgroundColor={customColor}>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    const flatStyle = Array.isArray(safeAreaView.props.style)
      ? Object.assign({}, ...safeAreaView.props.style)
      : safeAreaView.props.style;

    expect(flatStyle.backgroundColor).toBe(customColor);
  });

  it('applies default edges', () => {
    const { getByTestId } = render(
      <ScreenWrapper testID='screen-wrapper'>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    expect(safeAreaView.props.edges).toEqual(['bottom', 'top', 'left', 'right']);
  });

  it('applies custom edges when provided', () => {
    const customEdges: any = ['top', 'left', 'right'];
    const { getByTestId } = render(
      <ScreenWrapper testID='screen-wrapper' edges={customEdges}>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    expect(safeAreaView.props.edges).toEqual(customEdges);
  });

  it('has flex: 1 by default', () => {
    const { getByTestId } = render(
      <ScreenWrapper testID='screen-wrapper'>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    const flatStyle = Array.isArray(safeAreaView.props.style)
      ? Object.assign({}, ...safeAreaView.props.style)
      : safeAreaView.props.style;

    expect(flatStyle.flex).toBe(1);
  });
});
