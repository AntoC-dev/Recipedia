const {withAppBuildGradle} = require('@expo/config-plugins');
const {addAndroidLocaleFilters} = require('./androidLocaleFilters');

/**
 * Restricts the Android build to the locales the app actually ships (en, fr).
 *
 * Without this, every AndroidX / Play Services / Material library contributes
 * resources for ~80 locales to the base APK. Filtering them out trims the
 * download size delivered by the Play Store. Recipedia only localizes en/fr.
 *
 * Injected into the `android` block of the generated `android/app/build.gradle`,
 * which is regenerated on every prebuild (CNG), so this plugin re-applies it.
 *
 * @param {import('@expo/config-plugins').ExportedConfig} config
 * @param {{ locales?: string[] }} [options]
 */
const withAndroidLocaleFilters = (config, {locales = ['en', 'fr']} = {}) =>
    withAppBuildGradle(config, (cfg) => {
        if (cfg.modResults.language !== 'groovy') {
            throw new Error('withAndroidLocaleFilters: cannot modify non-groovy build.gradle');
        }
        cfg.modResults.contents = addAndroidLocaleFilters(cfg.modResults.contents, locales);
        return cfg;
    });

module.exports = withAndroidLocaleFilters;
