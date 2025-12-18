import { isFirstLaunch, markAsLaunched } from '@utils/firstLaunch';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.unmock('@utils/firstLaunch');

const originalDatasetType = process.env.EXPO_PUBLIC_DATASET_TYPE;

describe('firstLaunch Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_DATASET_TYPE;
  });

  afterAll(() => {
    if (originalDatasetType !== undefined) {
      process.env.EXPO_PUBLIC_DATASET_TYPE = originalDatasetType;
    } else {
      delete process.env.EXPO_PUBLIC_DATASET_TYPE;
    }
  });

  describe('isFirstLaunch', () => {
    test('returns true when first_launch key is null (first launch)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await isFirstLaunch();

      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('first_launch');
    });

    test('returns false when first_launch key exists (not first launch)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      const result = await isFirstLaunch();

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('first_launch');
    });

    test('returns false when AsyncStorage getItem throws error', async () => {
      const error = new Error('AsyncStorage error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(error);

      const result = await isFirstLaunch();

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('first_launch');
    });

    test('handles various truthy values as not first launch', async () => {
      const truthyValues = ['true', 'false', '1', '0', 'any-string'];

      for (const value of truthyValues) {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(value);

        const result = await isFirstLaunch();

        expect(result).toBe(false);
      }
    });

    test('only treats null as first launch', async () => {
      const nonNullValues = [null, '', '0', 'false'];

      for (const value of nonNullValues) {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(value);

        const result = await isFirstLaunch();

        if (value === null) {
          expect(result).toBe(true);
        } else {
          expect(result).toBe(false);
        }
      }
    });
  });

  describe('markAsLaunched', () => {
    test('successfully marks app as launched', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await markAsLaunched();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('first_launch', 'true');
    });

    test('handles AsyncStorage setItem error gracefully', async () => {
      const error = new Error('AsyncStorage setItem error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await markAsLaunched();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('first_launch', 'true');
    });

    test('does not throw error when AsyncStorage fails', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(markAsLaunched()).resolves.toBeUndefined();
    });
  });

  describe('performance build behavior', () => {
    test('resets first launch state in performance build', async () => {
      process.env.EXPO_PUBLIC_DATASET_TYPE = 'performance';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await isFirstLaunch();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('first_launch');
    });

    test('does not reset first launch state in non-performance build', async () => {
      process.env.EXPO_PUBLIC_DATASET_TYPE = 'test';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      await isFirstLaunch();

      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    test('handles removeItem error gracefully in performance build', async () => {
      process.env.EXPO_PUBLIC_DATASET_TYPE = 'performance';
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      const result = await isFirstLaunch();

      expect(result).toBe(false);
    });
  });
});
