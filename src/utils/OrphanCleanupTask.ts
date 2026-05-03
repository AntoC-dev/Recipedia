/**
 * OrphanCleanupTask - Background task wrapper for periodic orphan-image cleanup
 *
 * Registers a system-scheduled background task that runs roughly once per day.
 * Each fire deletes cached image files no longer referenced by any recipe in
 * the database. The OS controls actual execution timing — the configured
 * interval is a minimum delay, not a guarantee.
 *
 * @module utils/OrphanCleanupTask
 */

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { RecipeDatabase } from '@utils/RecipeDatabase';
import { cleanupOrphanedImages } from '@utils/FileGestion';
import { appLogger } from '@utils/logger';

export const ORPHAN_CLEANUP_TASK_NAME = 'recipedia.image-repair';

const ONE_DAY_IN_MINUTES = 24 * 60;

/**
 * Executes one orphan-image cleanup pass against the local database
 *
 * Deletes cached image files that no longer correspond to any recipe in the
 * database. Returns a `BackgroundTaskResult` so the OS scheduler can track
 * success/failure.
 */
export async function runOrphanCleanupTask(): Promise<BackgroundTask.BackgroundTaskResult> {
  appLogger.info('OrphanCleanupTask: background task fired');
  try {
    const db = RecipeDatabase.getInstance();
    await db.init();

    const recipes = db.get_recipes();
    const orphansDeleted = await cleanupOrphanedImages(recipes.map(recipe => recipe.image_Source));
    appLogger.info('OrphanCleanupTask: orphan cleanup complete', { orphansDeleted });

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    appLogger.error('OrphanCleanupTask: background task failed', { error });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}

TaskManager.defineTask(ORPHAN_CLEANUP_TASK_NAME, runOrphanCleanupTask);

/**
 * Registers the orphan cleanup background task with the OS scheduler
 *
 * Idempotent: re-registering an already-registered task is a no-op. The task
 * runs at most once per day, but the OS may delay execution based on battery,
 * network, and usage patterns.
 */
export async function registerOrphanCleanupTask(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      appLogger.warn('OrphanCleanupTask: background tasks are restricted, skipping registration');
      return;
    }

    const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(ORPHAN_CLEANUP_TASK_NAME);
    if (alreadyRegistered) {
      appLogger.debug('OrphanCleanupTask: already registered, skipping');
      return;
    }

    await BackgroundTask.registerTaskAsync(ORPHAN_CLEANUP_TASK_NAME, {
      minimumInterval: ONE_DAY_IN_MINUTES,
    });
    appLogger.info('OrphanCleanupTask: registered with scheduler', {
      minimumIntervalMinutes: ONE_DAY_IN_MINUTES,
    });
  } catch (error) {
    appLogger.warn('OrphanCleanupTask: failed to register background task', { error });
  }
}

/**
 * Unregisters the orphan cleanup background task from the OS scheduler
 */
export async function unregisterOrphanCleanupTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(ORPHAN_CLEANUP_TASK_NAME);
    if (!isRegistered) {
      return;
    }
    await BackgroundTask.unregisterTaskAsync(ORPHAN_CLEANUP_TASK_NAME);
    appLogger.info('OrphanCleanupTask: unregistered from scheduler');
  } catch (error) {
    appLogger.warn('OrphanCleanupTask: failed to unregister background task', { error });
  }
}
