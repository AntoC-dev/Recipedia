const {withGradleProperties} = require('@expo/config-plugins');
const {enableGradleBuildCache} = require('./gradleBuildCacheProperties');

/**
 * Enables the Gradle build cache in the generated `android/gradle.properties`, so task
 * outputs are reused across builds, even from a fresh project dir (EAS local builds).
 *
 * @param {import('@expo/config-plugins').ExportedConfig} config
 */
const withGradleBuildCache = (config) =>
    withGradleProperties(config, (cfg) => {
        cfg.modResults = enableGradleBuildCache(cfg.modResults);
        return cfg;
    });

module.exports = withGradleBuildCache;
