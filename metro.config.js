/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const {getDefaultConfig} = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Extend default extensions instead of overriding
defaultConfig.resolver.assetExts.push('db');
defaultConfig.resolver.assetExts.push('html');

// Enable persistent filesystem caching for faster builds
defaultConfig.cacheVersion = '1.0';

// Optimize resolver for faster dependency resolution
defaultConfig.resolver.platforms = ['ios', 'android', 'native', 'web'];
defaultConfig.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Enable asset optimization (simplified for stability)
defaultConfig.transformer = {
    ...defaultConfig.transformer,
    minifierPath: require.resolve('metro-minify-terser'),
};

module.exports = defaultConfig;
