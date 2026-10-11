const GRADLE_BUILD_CACHE_PROPERTY = 'org.gradle.caching';

/**
 * Sets `org.gradle.caching=true` in a parsed `gradle.properties`, replacing any existing value.
 *
 * @param {import('@expo/config-plugins').AndroidConfig.Properties.PropertiesItem[]} properties
 * @returns {import('@expo/config-plugins').AndroidConfig.Properties.PropertiesItem[]}
 */
const enableGradleBuildCache = (properties) => [
    ...properties.filter((item) => item.key !== GRADLE_BUILD_CACHE_PROPERTY),
    {type: 'property', key: GRADLE_BUILD_CACHE_PROPERTY, value: 'true'},
];

module.exports = {enableGradleBuildCache};
