import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
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

async function layout(element: TestInstance, height: number) {
  await fireEvent(element, 'layout', { nativeEvent: { layout: { height } } });
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
  test('reports its measured height to the navigator', async () => {
    const reportHeight = jest.fn();
    const { getByTestId } = await render(
      <BottomTabBarHeightCallbackContext.Provider value={reportHeight}>
        <BottomTabBar {...buildTabBarProps()} />
      </BottomTabBarHeightCallbackContext.Provider>
    );

    await layout(getByTestId('BottomTabs::Bar'), 92);

    expect(reportHeight).toHaveBeenCalledWith(92);
  });

  test('ignores the zero height measured while the keyboard hides the bar', async () => {
    const reportHeight = jest.fn();
    const { getByTestId } = await render(
      <BottomTabBarHeightCallbackContext.Provider value={reportHeight}>
        <BottomTabBar {...buildTabBarProps()} />
      </BottomTabBarHeightCallbackContext.Provider>
    );

    await layout(getByTestId('BottomTabs::Bar'), 92);
    await layout(getByTestId('BottomTabs::Bar'), 0);

    expect(reportHeight).toHaveBeenCalledTimes(1);
    expect(reportHeight).toHaveBeenLastCalledWith(92);
  });

  test('renders without a navigator height callback', async () => {
    const { getByTestId } = await render(<BottomTabBar {...buildTabBarProps()} />);

    expect(() => layout(getByTestId('BottomTabs::Bar'), 92)).not.toThrow();
  });

  test('hands the system bar insets to the navigation bar', async () => {
    const { getByTestId } = await render(<BottomTabBar {...buildTabBarProps()} />);

    expect(getByTestId('BottomNavigation.Bar::SafeAreaInsets').props.children).toBe(
      JSON.stringify(mockInsets)
    );
  });

  test('navigates to the pressed tab', async () => {
    const props = buildTabBarProps();
    const { getByTestId } = await render(<BottomTabBar {...props} />);

    await fireEvent.press(getByTestId('BottomTabs::Search'));

    expect(props.navigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'tabs-1' })
    );
  });

  test('does not navigate when the tab press event is prevented', async () => {
    const props = buildTabBarProps();
    props.navigation.emit = jest.fn(() => ({ defaultPrevented: true }));
    const { getByTestId } = await render(<BottomTabBar {...props} />);

    await fireEvent.press(getByTestId('BottomTabs::Home'));

    expect(props.navigation.dispatch).not.toHaveBeenCalled();
  });
});
