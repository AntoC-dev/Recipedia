import AsyncStorage from '@react-native-async-storage/async-storage';
import { appLogger } from '@utils/logger';

const FIRST_LAUNCH_KEY = 'first_launch';

function isPerformanceBuild(): boolean {
  return process.env.EXPO_PUBLIC_DATASET_TYPE === 'performance';
}

async function resetForPerformanceBuild(): Promise<void> {
  if (!isPerformanceBuild()) {
    return;
  }

  try {
    await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
    appLogger.info('Performance build detected - reset first launch state');
  } catch (error) {
    appLogger.error('Failed to reset first launch state for performance build', { error });
  }
}

export async function isFirstLaunch(): Promise<boolean> {
  try {
    await resetForPerformanceBuild();

    const hasLaunchedBefore = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    const isFirst = hasLaunchedBefore === null;

    appLogger.debug('First launch check', { isFirstLaunch: isFirst });
    return isFirst;
  } catch (error) {
    appLogger.error('Failed to check first launch status', { error });
    return false;
  }
}

export async function markAsLaunched(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    appLogger.debug('Marked app as launched');
  } catch (error) {
    appLogger.error('Failed to mark app as launched', { error });
  }
}
