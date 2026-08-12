import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { BottomTabBar, resolveTabLabel } from '@navigation/BottomTabs';
import { mockInsets } from '@mocks/deps/safe-area-context-mock';

function buildTabBarProps() {
  const routes = [
    { key: 'Home-1', name: 'Home', params: undefined },
    { key: 'Search-1', name: 'Search', params: undefined },
  ];
  return {
    state: { index: 0, key: 'tabs-1', routes },
    descriptors: {
      'Home-1': { options: { tabBarLabel: 'Accueil', tabBarButtonTestID: 'BottomTabs::Home' } },
      'Search-1': {
        options: { tabBarLabel: 'Recherche', tabBarButtonTestID: 'BottomTabs::Search' },
      },
    },
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), dispatch: jest.fn() },
    insets: mockInsets,
  } as any;
}

function layout(element: ReactTestInstance, height: number) {
  fireEvent(element, 'layout', { nativeEvent: { layout: { height } } });
}

describe('resolveTabLabel', () => {
  it('returns the string tabBarLabel when set', () => {
    expect(resolveTabLabel('Home', 'HomeRoute')).toBe('Home');
  });

  it('falls back to the route name when tabBarLabel is undefined', () => {
    expect(resolveTabLabel(undefined, 'Search')).toBe('Search');
  });

  it('falls back to the route name when tabBarLabel is a render function', () => {
    expect(resolveTabLabel(() => null, 'Menu')).toBe('Menu');
  });

  it('returns an empty string label verbatim without falling back', () => {
    expect(resolveTabLabel('', 'Shopping')).toBe('');
  });
});

describe('BottomTabBar', () => {
  test('reports its measured height to the navigator', () => {
    const reportHeight = jest.fn();
    const { getByTestId } = render(
      <BottomTabBarHeightCallbackContext.Provider value={reportHeight}>
        <BottomTabBar {...buildTabBarProps()} />
      </BottomTabBarHeightCallbackContext.Provider>
    );

    layout(getByTestId('BottomTabs::Bar'), 92);

    expect(reportHeight).toHaveBeenCalledWith(92);
  });

  test('ignores the zero height measured while the keyboard hides the bar', () => {
    const reportHeight = jest.fn();
    const { getByTestId } = render(
      <BottomTabBarHeightCallbackContext.Provider value={reportHeight}>
        <BottomTabBar {...buildTabBarProps()} />
      </BottomTabBarHeightCallbackContext.Provider>
    );

    layout(getByTestId('BottomTabs::Bar'), 92);
    layout(getByTestId('BottomTabs::Bar'), 0);

    expect(reportHeight).toHaveBeenCalledTimes(1);
    expect(reportHeight).toHaveBeenLastCalledWith(92);
  });

  test('renders without a navigator height callback', () => {
    const { getByTestId } = render(<BottomTabBar {...buildTabBarProps()} />);

    expect(() => layout(getByTestId('BottomTabs::Bar'), 92)).not.toThrow();
  });

  test('hands the system bar insets to the navigation bar', () => {
    const { getByTestId } = render(<BottomTabBar {...buildTabBarProps()} />);

    expect(getByTestId('BottomNavigation.Bar::SafeAreaInsets').props.children).toBe(
      JSON.stringify(mockInsets)
    );
  });

  test('navigates to the pressed tab', () => {
    const props = buildTabBarProps();
    const { getByTestId } = render(<BottomTabBar {...props} />);

    fireEvent.press(getByTestId('BottomTabs::Search'));

    expect(props.navigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'tabs-1' })
    );
  });

  test('does not navigate when the tab press event is prevented', () => {
    const props = buildTabBarProps();
    props.navigation.emit = jest.fn(() => ({ defaultPrevented: true }));
    const { getByTestId } = render(<BottomTabBar {...props} />);

    fireEvent.press(getByTestId('BottomTabs::Home'));

    expect(props.navigation.dispatch).not.toHaveBeenCalled();
  });
});
