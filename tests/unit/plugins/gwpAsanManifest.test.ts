import type { AndroidManifest } from '@expo/config-plugins';
import { disableGwpAsan } from '@app/plugins/gwpAsanManifest';
import { buildAndroidManifest } from '@mocks/deps/expo-config-plugins-mock';

function buildManifest(applicationAttributes: Record<string, string> = {}): AndroidManifest {
  return buildAndroidManifest({
    $: { 'android:name': '.MainApplication', ...applicationAttributes },
  });
}

describe('disableGwpAsan', () => {
  it('sets android:gwpAsanMode to never on the application', () => {
    const manifest = disableGwpAsan(buildManifest());

    expect(manifest.manifest.application?.[0]?.$['android:gwpAsanMode']).toBe('never');
  });

  it('keeps the other application attributes', () => {
    const manifest = disableGwpAsan(buildManifest({ 'android:allowBackup': 'false' }));

    expect(manifest.manifest.application?.[0]?.$).toEqual({
      'android:name': '.MainApplication',
      'android:allowBackup': 'false',
      'android:gwpAsanMode': 'never',
    });
  });

  it('overrides an existing gwpAsanMode', () => {
    const manifest = disableGwpAsan(buildManifest({ 'android:gwpAsanMode': 'always' }));

    expect(manifest.manifest.application?.[0]?.$['android:gwpAsanMode']).toBe('never');
  });

  it('throws when the manifest has no application element', () => {
    const manifestWithoutApplication: AndroidManifest = {
      manifest: {
        $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
        queries: [],
      },
    };

    expect(() => disableGwpAsan(manifestWithoutApplication)).toThrow();
  });

  it('is idempotent', () => {
    const manifest = disableGwpAsan(disableGwpAsan(buildManifest()));

    expect(manifest.manifest.application?.[0]?.$['android:gwpAsanMode']).toBe('never');
  });
});
