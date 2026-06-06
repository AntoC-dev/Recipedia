/**
 * Legacy background-task cleanup
 *
 * Background tasks registered via `expo-task-manager` / `expo-background-task`
 * persist in the OS scheduler across app upgrades. When a task is removed from
 * the codebase, its registration must be explicitly cancelled — otherwise the
 * OS keeps firing it, launching a headless JS context with no matching
 * `defineTask` handler, which can race with normal app initialization.
 *
 * Each entry in {@link LEGACY_BACKGROUND_TASK_NAMES} is the exact task name
 * that was once registered via `TaskManager.defineTask(name, ...)` and is no
 * longer defined in the current build.
 *
 * @module utils/legacyTaskCleanup
 */

import * as TaskManager from 'expo-task-manager';
import { appLogger } from '@utils/logger';

export const LEGACY_BACKGROUND_TASK_NAMES: readonly string[] = ['recipedia.image-repair'];

/**
 * Unregisters any legacy background task still registered with the OS scheduler
 *
 * Idempotent: tasks that aren't registered are silently skipped. Safe to call
 * on every app startup — once a task is unregistered, subsequent calls are
 * no-ops.
 *
 * Failures are logged but never rethrown, so a broken cleanup cannot block
 * app initialization.
 *
 * @returns Promise that resolves once every entry in
 * {@link LEGACY_BACKGROUND_TASK_NAMES} has been processed
 */
export async function unregisterLegacyBackgroundTasks(): Promise<void> {
  for (const name of LEGACY_BACKGROUND_TASK_NAMES) {
    try {
      const registered = await TaskManager.isTaskRegisteredAsync(name);
      if (!registered) continue;

      await TaskManager.unregisterTaskAsync(name);
      appLogger.info('Unregistered legacy background task', { name });
    } catch (error) {
      appLogger.warn('Failed to unregister legacy background task', { name, error });
    }
  }
}
