import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { useTheme } from 'react-native-paper';
import { tabScreenEdges } from '@styles/spacing';

jest.mock('@components/atomic/AppStatusBar', () =>
  require('@mocks/components/atomic/AppStatusBar-mock')
);

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

  it('renders children correctly', async () => {
    const { getByText } = await render(
      <ScreenWrapper>
        <Text>Test Content</Text>
      </ScreenWrapper>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies default background color from theme', async () => {
    const { getByTestId } = await render(
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

  it('applies custom background color when provided', async () => {
    const customColor = '#FF0000';
    const { getByTestId } = await render(
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

  it('applies default edges', async () => {
    const { getByTestId } = await render(
      <ScreenWrapper testID='screen-wrapper'>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    expect(safeAreaView.props.edges).toEqual({
      top: 'additive',
      bottom: 'additive',
      left: 'additive',
      right: 'additive',
    });
  });

  it('applies custom edges when provided', async () => {
    const customEdges: any = ['top', 'left', 'right'];
    const { getByTestId } = await render(
      <ScreenWrapper testID='screen-wrapper' edges={customEdges}>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    expect(safeAreaView.props.edges).toEqual({
      top: 'additive',
      bottom: 'off',
      left: 'additive',
      right: 'additive',
    });
  });

  it('turns the bottom edge off when given the shared tab screen edges', async () => {
    const { getByTestId } = await render(
      <ScreenWrapper testID='screen-wrapper' edges={tabScreenEdges}>
        <Text>Test</Text>
      </ScreenWrapper>
    );

    const safeAreaView = getByTestId('screen-wrapper');
    expect(safeAreaView.props.edges).toEqual({
      top: 'additive',
      bottom: 'off',
      left: 'additive',
      right: 'additive',
    });
  });

  it('has flex: 1 by default', async () => {
    const { getByTestId } = await render(
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
