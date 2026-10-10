import type { ConfigContext } from 'expo/config';
import createConfig, { resolveIosBundleId } from '@app/app.config';

describe('resolveIosBundleId', () => {
  const baseAppId = 'com.recipedia';

  it('appends the .ios suffix for the store build (production dataset, animations on)', () => {
    expect(resolveIosBundleId(baseAppId, { EXPO_PUBLIC_DATASET_TYPE: 'production' })).toBe(
      'com.recipedia.ios'
    );
  });

  it('keeps the plain id for a production-dataset automation build (animations disabled)', () => {
    expect(
      resolveIosBundleId(baseAppId, {
        EXPO_PUBLIC_DATASET_TYPE: 'production',
        EXPO_PUBLIC_DISABLE_ANIMATIONS: 'true',
      })
    ).toBe('com.recipedia');
  });

  it('keeps the plain id for the test dataset', () => {
    expect(resolveIosBundleId(baseAppId, { EXPO_PUBLIC_DATASET_TYPE: 'test' })).toBe(
      'com.recipedia'
    );
  });

  it('keeps the plain id for the performance dataset', () => {
    expect(
      resolveIosBundleId(baseAppId, {
        EXPO_PUBLIC_DATASET_TYPE: 'performance',
        EXPO_PUBLIC_DISABLE_ANIMATIONS: 'true',
      })
    ).toBe('com.recipedia');
  });

  it('keeps the plain id when the env is empty', () => {
    expect(resolveIosBundleId(baseAppId, {})).toBe('com.recipedia');
  });

  it('reads from process.env when no env is provided', () => {
    const previousDataset = process.env.EXPO_PUBLIC_DATASET_TYPE;
    const previousAnimations = process.env.EXPO_PUBLIC_DISABLE_ANIMATIONS;
    process.env.EXPO_PUBLIC_DATASET_TYPE = 'production';
    delete process.env.EXPO_PUBLIC_DISABLE_ANIMATIONS;
    try {
      expect(resolveIosBundleId(baseAppId)).toBe('com.recipedia.ios');
    } finally {
      if (previousDataset === undefined) {
        delete process.env.EXPO_PUBLIC_DATASET_TYPE;
      } else {
        process.env.EXPO_PUBLIC_DATASET_TYPE = previousDataset;
      }
      if (previousAnimations !== undefined) {
        process.env.EXPO_PUBLIC_DISABLE_ANIMATIONS = previousAnimations;
      }
    }
  });
});

describe('android back handling', () => {
  it('keeps the OnBackInvokedCallback manifest flag off so BackHandler receives system back', () => {
    const config = createConfig({ config: {} } as ConfigContext);

    expect(config.android?.predictiveBackGestureEnabled).toBe(false);
  });
});

describe('ml kit telemetry', () => {
  it('registers the plugin that disables ML Kit telemetry on Android', () => {
    const config = createConfig({ config: {} } as ConfigContext);

    expect(config.plugins).toContain('./plugins/withMlKitTelemetryDisabled');
  });
});

describe('build properties', () => {
  const getBuildProperties = () => {
    const config = createConfig({ config: {} } as ConfigContext);
    const entry = config.plugins?.find(
      plugin => Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
    );
    return (
      entry as [string, { android?: Record<string, unknown>; ios?: Record<string, unknown> }]
    )[1];
  };

  it('enables Android precompiled headers to speed up native C++ builds', () => {
    expect(getBuildProperties().android?.usePrecompiledHeaders).toBe(true);
  });

  it('keeps React Native prebuilt on iOS so precompiled XCFrameworks are used', () => {
    expect(getBuildProperties().ios?.buildReactNativeFromSource).not.toBe(true);
    expect(getBuildProperties().ios?.usePrecompiledModules).not.toBe(false);
  });
});
