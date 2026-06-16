import {
  getNextTutorialScreen,
  getPreviousTutorialScreen,
  getTutorialScreenByOrder,
  isFirstTutorialStep,
  isLastTutorialStep,
} from '@utils/Tutorial';

describe('Tutorial step helpers', () => {
  test('identifies the first step', () => {
    expect(isFirstTutorialStep(1)).toBe(true);
    expect(isFirstTutorialStep(2)).toBe(false);
  });

  test('identifies the last step', () => {
    expect(isLastTutorialStep(5)).toBe(true);
    expect(isLastTutorialStep(4)).toBe(false);
  });

  test('resolves screen name by order', () => {
    expect(getTutorialScreenByOrder(1)).toBe('Home');
    expect(getTutorialScreenByOrder(3)).toBe('Menu');
    expect(getTutorialScreenByOrder(5)).toBe('Parameters');
  });

  test('returns undefined for an unknown order', () => {
    expect(getTutorialScreenByOrder(0)).toBeUndefined();
    expect(getTutorialScreenByOrder(6)).toBeUndefined();
  });

  test('resolves the next screen and stops after the last step', () => {
    expect(getNextTutorialScreen(1)).toBe('Search');
    expect(getNextTutorialScreen(4)).toBe('Parameters');
    expect(getNextTutorialScreen(5)).toBeUndefined();
  });

  test('resolves the previous screen and stops before the first step', () => {
    expect(getPreviousTutorialScreen(5)).toBe('Shopping');
    expect(getPreviousTutorialScreen(2)).toBe('Home');
    expect(getPreviousTutorialScreen(1)).toBeUndefined();
  });
});
