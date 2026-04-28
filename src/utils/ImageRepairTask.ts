/**
 * ImageRepairTask - Background task wrapper for periodic image repair
 *
 * Registers a system-scheduled background task that runs roughly once per day.
 * Each fire repairs recipes with empty image sources and then runs orphan-image
 * cleanup against the full recipe list. The OS controls actual execution
 * timing — the configured interval is a minimum delay, not a guarantee.
 *
 * @module utils/ImageRepairTask
 */

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { repairMissingRecipeImages } from '@utils/ImageRepair';
import { cleanupOrphanedImages } from '@utils/FileGestion';
import { appLogger } from '@utils/logger';

export const IMAGE_REPAIR_TASK_NAME = 'recipedia.image-repair';

const ONE_DAY_IN_MINUTES = 24 * 60;

/**
 * Executes one image repair pass against the local database
 *
 * Repairs recipes with missing images, then runs orphan-image cleanup over
 * the full recipe list. Returns a `BackgroundTaskResult` so the OS scheduler
 * can track success/failure.
 */
export async function runImageRepairTask(): Promise<BackgroundTask.BackgroundTaskResult> {
  appLogger.info('ImageRepairTask: background task fired');
  try {
    const db = RecipeDatabase.getInstance();
    await db.init();

    const recipes = db.get_recipes();
    appLogger.info('ImageRepairTask: starting repair pass', { totalRecipes: recipes.length });

    await repairMissingRecipeImages(recipes, recipe => db.editRecipe(recipe));

    const refreshedRecipes = db.get_recipes();
    const orphansDeleted = await cleanupOrphanedImages(
      refreshedRecipes.map(recipe => recipe.image_Source)
    );
    appLogger.info('ImageRepairTask: orphan cleanup complete', { orphansDeleted });

    appLogger.info('ImageRepairTask: background task completed');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    appLogger.error('ImageRepairTask: background task failed', { error });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}

TaskManager.defineTask(IMAGE_REPAIR_TASK_NAME, runImageRepairTask);

/**
 * Registers the image repair background task with the OS scheduler
 *
 * Idempotent: re-registering an already-registered task is a no-op. The task
 * runs at most once per day, but the OS may delay execution based on battery,
 * network, and usage patterns.
 */
export async function registerImageRepairTask(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      appLogger.warn('ImageRepairTask: background tasks are restricted, skipping registration');
      return;
    }

    const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(IMAGE_REPAIR_TASK_NAME);
    if (alreadyRegistered) {
      appLogger.debug('ImageRepairTask: already registered, skipping');
      return;
    }

    await BackgroundTask.registerTaskAsync(IMAGE_REPAIR_TASK_NAME, {
      minimumInterval: ONE_DAY_IN_MINUTES,
    });
    appLogger.info('ImageRepairTask: registered with scheduler', {
      minimumIntervalMinutes: ONE_DAY_IN_MINUTES,
    });
  } catch (error) {
    appLogger.warn('ImageRepairTask: failed to register background task', { error });
  }
}

/**
 * Unregisters the image repair background task from the OS scheduler
 */
export async function unregisterImageRepairTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(IMAGE_REPAIR_TASK_NAME);
    if (!isRegistered) {
      return;
    }
    await BackgroundTask.unregisterTaskAsync(IMAGE_REPAIR_TASK_NAME);
    appLogger.info('ImageRepairTask: unregistered from scheduler');
  } catch (error) {
    appLogger.warn('ImageRepairTask: failed to unregister background task', { error });
  }
}
