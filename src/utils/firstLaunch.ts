/**
 * Helpers for detecting and recording the app's first-launch state.
 *
 * A single AsyncStorage flag is used as the source of truth. Reading the flag
 * before it has ever been written indicates a first launch; calling
 * {@link markAsLaunched} writes the flag so subsequent launches are not treated
 * as first launches.
 *
 * @module firstLaunch
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { appLogger } from '@utils/logger';

const FIRST_LAUNCH_KEY = 'first_launch';

/**
 * Checks whether this is the first time the app has been launched.
 *
 * Returns `true` when the launch flag has never been written to AsyncStorage.
 * Returns `false` on any storage error to avoid triggering first-launch flows
 * unexpectedly.
 *
 * @returns `true` if the app has not been launched before, `false` otherwise.
 */
export async function isFirstLaunch(): Promise<boolean> {
  try {
    const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    const isFirst = hasLaunchedBefore === null;

    appLogger.debug('First launch check', { isFirstLaunch: isFirst });
    return isFirst;
  } catch (error) {
    appLogger.error('Failed to check first launch status', { error });
    return false;
  }
}

/**
 * Persists the launch flag so that future calls to {@link isFirstLaunch} return `false`.
 *
 * Should be called once after all first-launch setup (onboarding, database
 * seeding, etc.) has completed successfully. Errors are logged and swallowed
 * so callers are not blocked if storage is unavailable.
 */
export async function markAsLaunched(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    appLogger.debug('Marked app as launched');
  } catch (error) {
    appLogger.error('Failed to mark app as launched', { error });
  }
}
