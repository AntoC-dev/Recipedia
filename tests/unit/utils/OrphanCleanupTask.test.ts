import {
  ORPHAN_CLEANUP_TASK_NAME,
  registerOrphanCleanupTask,
  runOrphanCleanupTask,
  unregisterOrphanCleanupTask,
} from '@utils/OrphanCleanupTask';
import {
  BackgroundTaskResult,
  BackgroundTaskStatus,
  mockGetStatusAsync,
  mockRegisterTaskAsync,
  mockUnregisterTaskAsync,
} from '@mocks/deps/expo-background-task-mock';
import { mockIsTaskRegisteredAsync } from '@mocks/deps/expo-task-manager-mock';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';

jest.mock('expo-background-task', () =>
  require('@mocks/deps/expo-background-task-mock').expoBackgroundTaskMock()
);
jest.mock('expo-task-manager', () =>
  require('@mocks/deps/expo-task-manager-mock').expoTaskManagerMock()
);

const mockCleanupOrphanedImages = jest.fn().mockResolvedValue(0);
jest.mock('@utils/FileGestion', () => ({
  ...jest.requireActual('@utils/FileGestion'),
  cleanupOrphanedImages: (...args: unknown[]) => mockCleanupOrphanedImages(...args),
}));

describe('OrphanCleanupTask', () => {
  const database = RecipeDatabase.getInstance();

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetStatusAsync.mockResolvedValue(BackgroundTaskStatus.Available);
    mockIsTaskRegisteredAsync.mockResolvedValue(false);
    mockCleanupOrphanedImages.mockResolvedValue(0);
    await database.init();
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  describe('registerOrphanCleanupTask', () => {
    it('registers the task with a daily minimum interval', async () => {
      await registerOrphanCleanupTask();

      expect(mockRegisterTaskAsync).toHaveBeenCalledWith(ORPHAN_CLEANUP_TASK_NAME, {
        minimumInterval: 24 * 60,
      });
    });

    it('does nothing when background tasks are restricted', async () => {
      mockGetStatusAsync.mockResolvedValue(BackgroundTaskStatus.Restricted);

      await registerOrphanCleanupTask();

      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the task is already registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await registerOrphanCleanupTask();

      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
    });

    it('swallows errors from registerTaskAsync', async () => {
      mockRegisterTaskAsync.mockRejectedValueOnce(new Error('boom'));

      await expect(registerOrphanCleanupTask()).resolves.toBeUndefined();
    });

    it('swallows errors from getStatusAsync', async () => {
      mockGetStatusAsync.mockRejectedValueOnce(new Error('status failed'));

      await expect(registerOrphanCleanupTask()).resolves.toBeUndefined();
      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
    });
  });

  describe('unregisterOrphanCleanupTask', () => {
    it('unregisters when the task is registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await unregisterOrphanCleanupTask();

      expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(ORPHAN_CLEANUP_TASK_NAME);
    });

    it('does nothing when the task is not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      await unregisterOrphanCleanupTask();

      expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('swallows errors from unregisterTaskAsync', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      mockUnregisterTaskAsync.mockRejectedValueOnce(new Error('boom'));

      await expect(unregisterOrphanCleanupTask()).resolves.toBeUndefined();
    });
  });

  describe('runOrphanCleanupTask', () => {
    async function seedTestRecipes() {
      await database.addMultipleIngredients(testIngredients);
      await database.addMultipleTags(testTags);
      await database.addMultipleRecipes(testRecipes);
    }

    it('returns Success and runs orphan cleanup with the full recipe list', async () => {
      await seedTestRecipes();

      const result = await runOrphanCleanupTask();

      expect(result).toBe(BackgroundTaskResult.Success);
      expect(mockCleanupOrphanedImages).toHaveBeenCalledTimes(1);
      const passedUris = mockCleanupOrphanedImages.mock.calls[0][0];
      expect(passedUris.length).toBe(testRecipes.length);
    });

    it('runs orphan cleanup with an empty list when there are no recipes', async () => {
      const result = await runOrphanCleanupTask();

      expect(result).toBe(BackgroundTaskResult.Success);
      expect(mockCleanupOrphanedImages).toHaveBeenCalledWith([]);
    });

    it('returns Failed when orphan cleanup throws', async () => {
      await seedTestRecipes();
      mockCleanupOrphanedImages.mockRejectedValueOnce(new Error('cleanup failed'));

      const result = await runOrphanCleanupTask();

      expect(result).toBe(BackgroundTaskResult.Failed);
    });
  });
});
