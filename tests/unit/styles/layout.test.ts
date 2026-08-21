import { StyleSheet } from 'react-native';

import { padding } from '@styles/spacing';
import { layout } from '@styles/layout';

describe('layout.flexFill', () => {
  test('fills available flex space', () => {
    expect(StyleSheet.flatten(layout.flexFill)).toEqual({ flex: 1 });
  });
});

describe('layout.dialogActions', () => {
  test('wraps and spaces row content', () => {
    expect(StyleSheet.flatten(layout.dialogActions)).toEqual({
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    });
  });
});

describe('layout.emptyState', () => {
  test('centers content in a filled container', () => {
    expect(StyleSheet.flatten(layout.emptyState)).toEqual({
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    });
  });
});

describe('layout.tutorialOverlay', () => {
  test('positions absolutely with horizontal padding and no pointer events', () => {
    expect(StyleSheet.flatten(layout.tutorialOverlay)).toEqual({
      position: 'absolute',
      left: padding.small,
      right: padding.small,
      pointerEvents: 'none',
    });
  });
});
