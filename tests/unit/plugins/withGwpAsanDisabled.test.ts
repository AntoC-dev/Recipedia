import type { AndroidManifest } from '@expo/config-plugins';
import withGwpAsanDisabled from '@app/plugins/withGwpAsanDisabled';

jest.mock('@expo/config-plugins', () => {
  const {
    buildAndroidManifest,
    expoConfigPluginsMock,
  } = require('@mocks/deps/expo-config-plugins-mock');
  return expoConfigPluginsMock(buildAndroidManifest());
});

describe('withGwpAsanDisabled', () => {
  it('sets android:gwpAsanMode to never in the Android manifest and keeps the config', () => {
    const result = withGwpAsanDisabled({
      name: 'Recipedia',
      slug: 'Recipedia',
    }) as unknown as { name: string; modResults: AndroidManifest };

    expect(result.name).toBe('Recipedia');
    expect(result.modResults.manifest.application?.[0]?.$['android:gwpAsanMode']).toBe('never');
  });
});
