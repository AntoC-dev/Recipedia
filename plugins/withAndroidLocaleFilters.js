const {withAppBuildGradle} = require('@expo/config-plugins');

/**
 * Restricts the Android build to the locales the app actually ships (en, fr).
 *
 * Without this, every AndroidX / Play Services / Material library contributes
 * resources for ~80 locales to the base APK. Filtering them out trims the
 * download size delivered by the Play Store. Recipedia only localizes en/fr.
 *
 * Injected into `defaultConfig` of the generated `android/app/build.gradle`,
 * which is regenerated on every prebuild (CNG), so this plugin re-applies it.
 *
 * @param {import('@expo/config-plugins').ExportedConfig} config
 * @param {{ locales?: string[] }} [options]
 */
const withAndroidLocaleFilters = (config, {locales = ['en', 'fr']} = {}) => {
    return withAppBuildGradle(config, (cfg) => {
        if (cfg.modResults.language !== 'groovy') {
            throw new Error(
                'withAndroidLocaleFilters: cannot modify non-groovy build.gradle',
            );
        }

        let contents = cfg.modResults.contents;
        if (contents.includes('resConfigs')) {
            return cfg;
        }

        const quoted = locales.map((l) => `"${l}"`).join(', ');
        const marker = /defaultConfig\s*\{/;
        if (!marker.test(contents)) {
            throw new Error(
                'withAndroidLocaleFilters: defaultConfig block not found in build.gradle',
            );
        }

        contents = contents.replace(
            marker,
            (match) => `${match}\n        resConfigs ${quoted}`,
        );
        cfg.modResults.contents = contents;
        return cfg;
    });
};

module.exports = withAndroidLocaleFilters;
