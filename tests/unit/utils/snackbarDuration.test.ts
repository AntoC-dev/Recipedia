import { snackbarDuration, snackbarDurationsFor, SnackbarDurations } from '@utils/snackbarDuration';
import { animationsDisabled } from '@utils/Constants';

describe('snackbarDuration', () => {
  const productionDurations: SnackbarDurations = { message: 4000, action: 7000 };
  const automationDurations: SnackbarDurations = { message: 10000, action: 10000 };

  describe('snackbarDurationsFor', () => {
    test('returns longer durations for Maestro builds', () => {
      expect(snackbarDurationsFor(true)).toEqual(automationDurations);
    });

    test('returns Material Design durations for other builds', () => {
      expect(snackbarDurationsFor(false)).toEqual(productionDurations);
    });
  });

  describe('snackbarDuration', () => {
    const buildDurations = snackbarDurationsFor(animationsDisabled);

    test('uses the message duration without action', () => {
      expect(snackbarDuration(false)).toBe(buildDurations.message);
    });

    test('uses the action duration with an action', () => {
      expect(snackbarDuration(true)).toBe(buildDurations.action);
    });
  });
});
