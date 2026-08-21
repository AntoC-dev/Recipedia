import { padding, tabScreenBottomPadding, tabScreenEdges } from '@styles/spacing';

describe('tabScreenBottomPadding', () => {
  test('equals padding.extraLarge', () => {
    expect(tabScreenBottomPadding).toBe(padding.extraLarge);
  });
});

describe('tabScreenEdges', () => {
  test('contains top, left, right', () => {
    expect(tabScreenEdges).toEqual(expect.arrayContaining(['top', 'left', 'right']));
  });

  test('excludes bottom', () => {
    expect(tabScreenEdges).not.toContain('bottom');
  });
});
