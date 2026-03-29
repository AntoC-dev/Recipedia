const fs = require('fs');
const path = require('path');

const tsconfigPath = path.resolve(__dirname, 'tsconfig.json');
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

const {baseUrl, paths} = tsconfig.compilerOptions;

const getAliases = () => {
    return Object.entries(paths).reduce((aliases, [key, value]) => {
        key = key.replace('/*', '');
        value = './' + path.join(baseUrl, value[0].replace('/*', '').replace('*', ''));
        return {...aliases, [key]: value};
    }, {});
};

module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        env: {
            production: {
                plugins: ['react-native-paper/babel'],
            },
        },
        plugins: [
            [
                require.resolve('babel-plugin-module-resolver'),
                {
                    extensions: [
                        '.js',
                        '.jsx',
                        '.ts',
                        '.tsx',
                        '.android.tsx',
                        '.ios.tsx',
                        '.json',
                    ],
                    alias: getAliases(),
                },
            ],
        ],
    };
};
