const {mergeContents} = require('@expo/config-plugins/build/utils/generateCode');

/**
 * Adds a tagged `androidResources { localeFilters.addAll([...]) }` block at the top of the
 * `android` block of a Groovy `build.gradle`. Replaces the deprecated `resConfigs` DSL (AGP 8.8+).
 * Idempotent; a changed locale list replaces the previously generated block.
 *
 * @param {string} contents Groovy source of `android/app/build.gradle`
 * @param {string[]} locales Locale qualifiers to keep (e.g. `['en', 'fr']`)
 * @returns {string} The updated Groovy source
 * @throws {Error} When no top-level `android {` line is found
 */
const addAndroidLocaleFilters = (contents, locales) => {
    const quoted = locales.map((locale) => `"${locale}"`).join(', ');
    return mergeContents({
        src: contents,
        newSrc: `    androidResources {\n        localeFilters.addAll([${quoted}])\n    }`,
        tag: 'recipedia-locale-filters',
        anchor: /^android\s*\{/,
        offset: 1,
        comment: '//',
    }).contents;
};

module.exports = {addAndroidLocaleFilters};
