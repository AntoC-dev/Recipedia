import { resolveIosBundleId } from '@app/app.config';

describe('resolveIosBundleId', () => {
  const baseAppId = 'com.recipedia';

  it('appends the .ios suffix for production store builds', () => {
    expect(resolveIosBundleId(baseAppId, { EXPO_PUBLIC_DATASET_TYPE: 'production' })).toBe(
      'com.recipedia.ios'
    );
  });

  it('keeps the plain id for the test dataset', () => {
    expect(resolveIosBundleId(baseAppId, { EXPO_PUBLIC_DATASET_TYPE: 'test' })).toBe(
      'com.recipedia'
    );
  });

  it('keeps the plain id for the performance dataset', () => {
    expect(resolveIosBundleId(baseAppId, { EXPO_PUBLIC_DATASET_TYPE: 'performance' })).toBe(
      'com.recipedia'
    );
  });

  it('keeps the plain id when the dataset type is unset', () => {
    expect(resolveIosBundleId(baseAppId, {})).toBe('com.recipedia');
  });

  it('reads from process.env when no env is provided', () => {
    const previous = process.env.EXPO_PUBLIC_DATASET_TYPE;
    process.env.EXPO_PUBLIC_DATASET_TYPE = 'production';
    try {
      expect(resolveIosBundleId(baseAppId)).toBe('com.recipedia.ios');
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PUBLIC_DATASET_TYPE;
      } else {
        process.env.EXPO_PUBLIC_DATASET_TYPE = previous;
      }
    }
  });
});
