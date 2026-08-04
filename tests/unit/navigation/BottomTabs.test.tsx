import { resolveTabLabel } from '@navigation/BottomTabs';

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
