import type { AndroidManifest } from '@expo/config-plugins';

type ModAction<T> = (config: T & { modResults: unknown }) => T & { modResults: unknown };

type ManifestApplication = NonNullable<AndroidManifest['manifest']['application']>[number];

export function expoConfigPluginsMock(androidManifest: unknown, gradleProperties: unknown = []) {
  return {
    withAndroidManifest: jest.fn(<T extends object>(config: T, action: ModAction<T>) =>
      action({ ...config, modResults: androidManifest })
    ),
    withGradleProperties: jest.fn(<T extends object>(config: T, action: ModAction<T>) =>
      action({ ...config, modResults: gradleProperties })
    ),
  };
}

export function buildAndroidManifest(
  applicationOverrides: Partial<ManifestApplication> = {}
): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [
        {
          ...applicationOverrides,
          $: { 'android:name': '.MainApplication', ...applicationOverrides.$ },
        },
      ],
    },
  };
}
