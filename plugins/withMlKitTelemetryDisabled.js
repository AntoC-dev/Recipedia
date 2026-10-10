const {withAndroidManifest} = require('@expo/config-plugins');
const {removeCctTransportBackend} = require('./mlKitTelemetryManifest');

/**
 * Disables Google ML Kit usage telemetry on Android by removing the DataTransport CCT
 * backend, so its Clearcut events are discarded. See ARCHITECTURE.md, key invariants.
 *
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
const withMlKitTelemetryDisabled = (config) =>
    withAndroidManifest(config, (cfg) => {
        removeCctTransportBackend(cfg.modResults);
        return cfg;
    });

module.exports = withMlKitTelemetryDisabled;
