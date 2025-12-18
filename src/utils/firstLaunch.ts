import AsyncStorage from '@react-native-async-storage/async-storage';
import { appLogger } from '@utils/logger';

const FIRST_LAUNCH_KEY = 'first_launch';

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

export async function markAsLaunched(): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    appLogger.debug('Marked app as launched');
  } catch (error) {
    appLogger.error('Failed to mark app as launched', { error });
  }
}
