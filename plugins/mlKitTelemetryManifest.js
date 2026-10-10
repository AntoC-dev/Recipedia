// Deep import: the package root pulls an ESM-only `uuid` that Jest cannot load.
const {ensureToolsAvailable, getMainApplicationOrThrow} = require('@expo/config-plugins/build/android/Manifest');

const TRANSPORT_BACKEND_DISCOVERY_SERVICE =
    'com.google.android.datatransport.runtime.backends.TransportBackendDiscovery';
const CCT_BACKEND_META_DATA = 'backend:com.google.android.datatransport.cct.CctBackendFactory';

/**
 * Marks the DataTransport CCT backend meta-data `tools:node="remove"` in the app manifest. Idempotent.
 *
 * @param {import('@expo/config-plugins').AndroidManifest} manifest
 * @returns {import('@expo/config-plugins').AndroidManifest}
 */
const removeCctTransportBackend = (manifest) => {
    ensureToolsAvailable(manifest);
    const application = getMainApplicationOrThrow(manifest);
    application.service ??= [];

    let service = application.service.find(
        (s) => s.$['android:name'] === TRANSPORT_BACKEND_DISCOVERY_SERVICE,
    );
    if (!service) {
        service = {$: {'android:name': TRANSPORT_BACKEND_DISCOVERY_SERVICE}};
        application.service.push(service);
    }

    service['meta-data'] ??= [];
    if (!service['meta-data'].some((m) => m.$['android:name'] === CCT_BACKEND_META_DATA)) {
        service['meta-data'].push({
            $: {'android:name': CCT_BACKEND_META_DATA, 'tools:node': 'remove'},
        });
    }

    return manifest;
};

module.exports = {removeCctTransportBackend, TRANSPORT_BACKEND_DISCOVERY_SERVICE, CCT_BACKEND_META_DATA};
