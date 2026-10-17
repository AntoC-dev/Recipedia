const {getMainApplicationOrThrow} = require('@expo/config-plugins/build/android/Manifest');

/**
 * Sets `android:gwpAsanMode="never"` on the main `<application>` element. Idempotent.
 *
 * @param {import('@expo/config-plugins').AndroidManifest} manifest
 * @returns {import('@expo/config-plugins').AndroidManifest}
 */
const disableGwpAsan = (manifest) => {
    getMainApplicationOrThrow(manifest).$['android:gwpAsanMode'] = 'never';
    return manifest;
};

module.exports = {disableGwpAsan};
