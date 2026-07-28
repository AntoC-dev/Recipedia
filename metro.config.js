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

// Keep test code out of the production bundle. .easignore already strips these
// from the EAS upload; this also covers local/bare prod bundling. Only the repo's
// own test dirs are blocked (anchored to __dirname so dependency `tests/` dirs in
// node_modules are untouched). tests/data/ is intentionally NOT blocked — it holds
// runtime seed data imported by src/utils/DatasetLoader.ts via the @test-data alias.
const escapedRoot = __dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const existingBlockList = Array.isArray(defaultConfig.resolver.blockList)
    ? defaultConfig.resolver.blockList
    : [defaultConfig.resolver.blockList].filter(Boolean);
defaultConfig.resolver.blockList = [
    ...existingBlockList,
    new RegExp(`^${escapedRoot}/tests/(unit|integration|e2e|perf|mocks|helpers|assets)/`),
    /\.test\.(ts|tsx|js|jsx)$/,
];

module.exports = defaultConfig;
