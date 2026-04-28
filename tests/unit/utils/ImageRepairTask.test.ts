import {
  IMAGE_REPAIR_TASK_NAME,
  registerImageRepairTask,
  runImageRepairTask,
  unregisterImageRepairTask,
} from '@utils/ImageRepairTask';
import {
  BackgroundTaskResult,
  BackgroundTaskStatus,
  mockGetStatusAsync,
  mockRegisterTaskAsync,
  mockUnregisterTaskAsync,
} from '@mocks/deps/expo-background-task-mock';
import { mockIsTaskRegisteredAsync } from '@mocks/deps/expo-task-manager-mock';
import { mockRepairMissingRecipeImages } from '@mocks/utils/ImageRepair-mock';
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
jest.mock('@utils/ImageRepair', () => require('@mocks/utils/ImageRepair-mock').imageRepairMock());

const mockCleanupOrphanedImages = jest.fn().mockResolvedValue(0);
jest.mock('@utils/FileGestion', () => ({
  ...jest.requireActual('@utils/FileGestion'),
  cleanupOrphanedImages: (...args: unknown[]) => mockCleanupOrphanedImages(...args),
}));

describe('ImageRepairTask', () => {
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

  describe('registerImageRepairTask', () => {
    it('registers the task with a daily minimum interval', async () => {
      await registerImageRepairTask();

      expect(mockRegisterTaskAsync).toHaveBeenCalledWith(IMAGE_REPAIR_TASK_NAME, {
        minimumInterval: 24 * 60,
      });
    });

    it('does nothing when background tasks are restricted', async () => {
      mockGetStatusAsync.mockResolvedValue(BackgroundTaskStatus.Restricted);

      await registerImageRepairTask();

      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the task is already registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await registerImageRepairTask();

      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
    });

    it('swallows errors from registerTaskAsync', async () => {
      mockRegisterTaskAsync.mockRejectedValueOnce(new Error('boom'));

      await expect(registerImageRepairTask()).resolves.toBeUndefined();
    });

    it('swallows errors from getStatusAsync', async () => {
      mockGetStatusAsync.mockRejectedValueOnce(new Error('status failed'));

      await expect(registerImageRepairTask()).resolves.toBeUndefined();
      expect(mockRegisterTaskAsync).not.toHaveBeenCalled();
    });
  });

  describe('unregisterImageRepairTask', () => {
    it('unregisters when the task is registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);

      await unregisterImageRepairTask();

      expect(mockUnregisterTaskAsync).toHaveBeenCalledWith(IMAGE_REPAIR_TASK_NAME);
    });

    it('does nothing when the task is not registered', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(false);

      await unregisterImageRepairTask();

      expect(mockUnregisterTaskAsync).not.toHaveBeenCalled();
    });

    it('swallows errors from unregisterTaskAsync', async () => {
      mockIsTaskRegisteredAsync.mockResolvedValue(true);
      mockUnregisterTaskAsync.mockRejectedValueOnce(new Error('boom'));

      await expect(unregisterImageRepairTask()).resolves.toBeUndefined();
    });
  });

  describe('runImageRepairTask', () => {
    async function seedTestRecipes() {
      await database.addMultipleIngredients(testIngredients);
      await database.addMultipleTags(testTags);
      await database.addMultipleRecipes(testRecipes);
    }

    it('returns Success and invokes the repair routine with all recipes', async () => {
      await seedTestRecipes();

      const result = await runImageRepairTask();

      expect(result).toBe(BackgroundTaskResult.Success);
      expect(mockRepairMissingRecipeImages).toHaveBeenCalledTimes(1);
      const passedRecipes = mockRepairMissingRecipeImages.mock.calls[0][0];
      expect(passedRecipes.length).toBe(testRecipes.length);
    });

    it('returns Success and calls repair with empty array when no recipes', async () => {
      const result = await runImageRepairTask();

      expect(result).toBe(BackgroundTaskResult.Success);
      expect(mockRepairMissingRecipeImages).toHaveBeenCalledWith([], expect.any(Function));
    });

    it('returns Failed when repair throws', async () => {
      await seedTestRecipes();
      mockRepairMissingRecipeImages.mockRejectedValueOnce(new Error('repair exploded'));

      const result = await runImageRepairTask();

      expect(result).toBe(BackgroundTaskResult.Failed);
    });

    it('runs orphan cleanup with the full recipe list after repair', async () => {
      await seedTestRecipes();

      await runImageRepairTask();

      expect(mockCleanupOrphanedImages).toHaveBeenCalledTimes(1);
      const passedUris = mockCleanupOrphanedImages.mock.calls[0][0];
      expect(passedUris.length).toBe(testRecipes.length);
    });

    it('runs orphan cleanup even when there are no recipes', async () => {
      await runImageRepairTask();

      expect(mockCleanupOrphanedImages).toHaveBeenCalledWith([]);
    });

    it('returns Failed when orphan cleanup throws', async () => {
      await seedTestRecipes();
      mockCleanupOrphanedImages.mockRejectedValueOnce(new Error('cleanup failed'));

      const result = await runImageRepairTask();

      expect(result).toBe(BackgroundTaskResult.Failed);
    });
  });
});
