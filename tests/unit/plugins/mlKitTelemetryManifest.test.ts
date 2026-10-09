import type { AndroidManifest } from '@expo/config-plugins';
import {
  CCT_BACKEND_META_DATA,
  removeCctTransportBackend,
  TRANSPORT_BACKEND_DISCOVERY_SERVICE,
} from '@app/plugins/mlKitTelemetryManifest';

type ManifestService = NonNullable<
  NonNullable<AndroidManifest['manifest']['application']>[number]['service']
>[number] & { 'meta-data'?: { $: Record<string, string> }[] };

const CCT_BACKEND_REMOVAL = {
  $: { 'android:name': CCT_BACKEND_META_DATA, 'tools:node': 'remove' },
};

function buildManifest(services: ManifestService[] = []): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [],
      application: [{ $: { 'android:name': '.MainApplication' }, service: services }],
    },
  };
}

function findTransportServices(manifest: AndroidManifest): ManifestService[] {
  return (manifest.manifest.application?.[0]?.service ?? []).filter(
    service => service.$['android:name'] === TRANSPORT_BACKEND_DISCOVERY_SERVICE
  );
}

describe('removeCctTransportBackend', () => {
  it('adds the TransportBackendDiscovery service with a removal entry for the CCT backend', () => {
    const services = findTransportServices(removeCctTransportBackend(buildManifest()));

    expect(services).toHaveLength(1);
    expect(services[0]?.['meta-data']).toEqual([CCT_BACKEND_REMOVAL]);
  });

  it('declares the tools namespace', () => {
    const manifest = removeCctTransportBackend(buildManifest());

    expect(manifest.manifest.$['xmlns:tools']).toBe('http://schemas.android.com/tools');
  });

  it('keeps the other application services', () => {
    const otherService = { $: { 'android:name': 'com.example.OtherService' } };

    const manifest = removeCctTransportBackend(buildManifest([otherService]));

    expect(manifest.manifest.application?.[0]?.service).toContainEqual(otherService);
    expect(findTransportServices(manifest)).toHaveLength(1);
  });

  it('reuses an existing TransportBackendDiscovery service and keeps its meta-data', () => {
    const otherMetaData = { $: { 'android:name': 'backend:other', 'android:value': 'other' } };
    const existingService: ManifestService = {
      $: { 'android:name': TRANSPORT_BACKEND_DISCOVERY_SERVICE },
      'meta-data': [otherMetaData],
    };

    const services = findTransportServices(
      removeCctTransportBackend(buildManifest([existingService]))
    );

    expect(services).toHaveLength(1);
    expect(services[0]?.['meta-data']).toEqual([otherMetaData, CCT_BACKEND_REMOVAL]);
  });

  it('throws when the manifest has no application element', () => {
    const manifestWithoutApplication: AndroidManifest = {
      manifest: {
        $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
        queries: [],
      },
    };

    expect(() => removeCctTransportBackend(manifestWithoutApplication)).toThrow();
  });

  it('is idempotent', () => {
    const services = findTransportServices(
      removeCctTransportBackend(removeCctTransportBackend(buildManifest()))
    );

    expect(services).toHaveLength(1);
    expect(services[0]?.['meta-data']).toEqual([CCT_BACKEND_REMOVAL]);
  });
});
