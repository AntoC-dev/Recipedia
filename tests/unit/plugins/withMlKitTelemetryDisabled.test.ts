import type { AndroidManifest } from '@expo/config-plugins';
import { CCT_BACKEND_META_DATA } from '@app/plugins/mlKitTelemetryManifest';
import withMlKitTelemetryDisabled from '@app/plugins/withMlKitTelemetryDisabled';

const manifest: AndroidManifest = {
  manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    queries: [],
    application: [{ $: { 'android:name': '.MainApplication' } }],
  },
};

jest.mock('@expo/config-plugins', () =>
  require('@mocks/deps/expo-config-plugins-mock').expoConfigPluginsMock(manifest)
);

describe('withMlKitTelemetryDisabled', () => {
  it('removes the CCT transport backend from the Android manifest and keeps the config', () => {
    const result = withMlKitTelemetryDisabled({
      name: 'Recipedia',
      slug: 'Recipedia',
    }) as unknown as { name: string; modResults: AndroidManifest };

    expect(result.name).toBe('Recipedia');
    expect(result.modResults.manifest.application?.[0]?.service?.[0]).toEqual({
      $: { 'android:name': expect.stringContaining('TransportBackendDiscovery') },
      'meta-data': [{ $: { 'android:name': CCT_BACKEND_META_DATA, 'tools:node': 'remove' } }],
    });
  });
});
