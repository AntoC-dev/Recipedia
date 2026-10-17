const {withAndroidManifest} = require('@expo/config-plugins');
const {disableGwpAsan} = require('./gwpAsanManifest');

/**
 * Disables GWP-ASan on Android to avoid a Hermes SIGSEGV
 * (https://github.com/facebook/hermes/issues/2225); see ARCHITECTURE.md.
 *
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
const withGwpAsanDisabled = (config) =>
    withAndroidManifest(config, (cfg) => {
        disableGwpAsan(cfg.modResults);
        return cfg;
    });

module.exports = withGwpAsanDisabled;
