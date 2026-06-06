import {
  LEGACY_BACKGROUND_TASK_NAMES,
  unregisterLegacyBackgroundTasks,
} from '@utils/legacyTaskCleanup';
import {
  mockIsTaskRegisteredAsync,
  mockUnregisterTaskAsync,
} from '@mocks/deps/expo-task-manager-mock';
import { appLogger } from '@utils/logger';

jest.mock('expo-task-manager', () =>
  require('@mocks/deps/expo-task-manager-mock').expoTaskManagerMock()
);

describe('legacyTaskCleanup', () => {
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockIsTaskRegisteredAsync.mockReset().mockResolvedValue(false);
    mockUnregisterTaskAsync.mockReset().mockResolvedValue(undefined);
    infoSpy = jest.spyOn(appLogger, 'info').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(appLogger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('LEGACY_BACKGROUND_TASK_NAMES', () => {
    it('includes the removed orphan image cleanup task', () => {
      expect(LEGACY_BACKGROUND_TASK_NAMES).toContain('recipedia.image-repair');
    });
  });

  describe('unregisterLegacyBackgroundTasks', () => {
    it('unregisters every legacy task that is still registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await unregisterLegacyBackgroundTasks();

      for (const name of LEGACY_BACKGROUND_TASK_NAMES) {
        expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(name);
      }
      expect(mockUnregisterTaskAsync).toHaveBeenCalledTimes(LEGACY_BACKGROUND_TASK_NAMES.length);
    });

    it('skips unregistration when the task is not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      await unregisterLegacyBackgroundTasks();

      expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('continues processing remaining tasks when one fails to be checked', async () => {
      if (LEGACY_BACKGROUND_TASK_NAMES.length < 2) {
        mockIsTaskRegisteredAsync.mockRejectedValueOnce(new Error('boom'));
        await expect(unregisterLegacyBackgroundTasks()).resolves.toBeUndefined();
        return;
      }

      mockIsTaskRegisteredAsync.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(true);

      await unregisterLegacyBackgroundTasks();

      expect(mockUnregisterTaskAsync).toHaveBeenCalledTimes(
        LEGACY_BACKGROUND_TASK_NAMES.length - 1
      );
    });

    it('does not throw when unregisterTaskAsync rejects', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      mockUnregisterTaskAsync.mockRejectedValue(new Error('os error'));

      await expect(unregisterLegacyBackgroundTasks()).resolves.toBeUndefined();
    });

    it('processes tasks in declared order', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await unregisterLegacyBackgroundTasks();

      const calledNames = mockUnregisterTaskAsync.mock.calls.map(call => call[0]);
      expect(calledNames).toEqual([...LEGACY_BACKGROUND_TASK_NAMES]);
    });

    it('logs an info entry for each successfully unregistered task', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await unregisterLegacyBackgroundTasks();

      for (const name of LEGACY_BACKGROUND_TASK_NAMES) {
        expect(infoSpy).toHaveBeenCalledWith('Unregistered legacy background task', { name });
      }
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does not log an info entry when the task is not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      await unregisterLegacyBackgroundTasks();

      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('logs a warning with the error when isTaskRegisteredAsync rejects', async () => {
      const failure = new Error('registry read failure');
      mockIsTaskRegisteredAsync.mockRejectedValue(failure);

      await unregisterLegacyBackgroundTasks();

      for (const name of LEGACY_BACKGROUND_TASK_NAMES) {
        expect(warnSpy).toHaveBeenCalledWith('Failed to unregister legacy background task', {
          name,
          error: failure,
        });
      }
      expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('logs a warning with the error when unregisterTaskAsync rejects', async () => {
      const failure = new Error('os error');
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      mockUnregisterTaskAsync.mockRejectedValue(failure);

      await unregisterLegacyBackgroundTasks();

      for (const name of LEGACY_BACKGROUND_TASK_NAMES) {
        expect(warnSpy).toHaveBeenCalledWith('Failed to unregister legacy background task', {
          name,
          error: failure,
        });
      }
    });
  });
});
