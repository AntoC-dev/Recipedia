/**
 * ESLint configuration for Recipedia React Native project
 *
 * Provides comprehensive linting rules for TypeScript, React, and React Native
 * development with focus on code quality and consistency.
 */

const js = require('@eslint/js');
const {defineConfig} = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactCompiler = require('eslint-plugin-react-compiler');

module.exports = defineConfig([
    expoConfig,
    reactCompiler.configs.recommended,
    // Base JavaScript config
    js.configs.recommended,

    // Main configuration for TypeScript and React Native files
    {
        files: ['src/**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                __DEV__: 'readonly',
                global: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
            react: require('eslint-plugin-react'),
            'react-native': require('eslint-plugin-react-native'),
            'react-hooks': require('eslint-plugin-react-hooks'),
            prettier: require('eslint-plugin-prettier'),
        },
        rules: {
            'no-unused-vars': 'off',
            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': ['error'],
            '@typescript-eslint/no-explicit-any': 'warn',

            // React specific rules
            'react/prop-types': 'off', // TypeScript handles this
            'react/react-in-jsx-scope': 'off', // Not needed in React Native
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'off', // React Compiler handles memoization

            // React Native specific rules
            'react-native/no-unused-styles': 'error',
            'react-native/split-platform-components': 'error',
            'react-native/no-color-literals': 'warn',

            // General code quality rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'prefer-const': 'error',
            'no-var': 'error',

            // Dead code detection
            'no-unreachable': 'error',
            'no-unused-expressions': 'error',
            'no-useless-return': 'error',

            // Prettier integration
            'prettier/prettier': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // Test files configuration - follow same rules as main code with minimal exceptions
    {
        files: ['tests/**/*.{ts,tsx,js,jsx}', '**/*.test.{ts,tsx,js,jsx}'],
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            globals: {
                jest: 'readonly',
                expect: 'readonly',
                test: 'readonly',
                describe: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                it: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
            react: require('eslint-plugin-react'),
            'react-native': require('eslint-plugin-react-native'),
            'react-hooks': require('eslint-plugin-react-hooks'),
            prettier: require('eslint-plugin-prettier'),
        },
        rules: {
            'no-undef': 'off',
            'no-unused-vars': 'off',
            // Allow any type in test files for mocking and test data
            '@typescript-eslint/no-explicit-any': 'off',
            // Allow console statements in tests for debugging
            'no-console': 'off',
            // Relax unused vars in tests (common for mock setups)
            '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
            // Prettier integration
            'prettier/prettier': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            'build/**',
            'dist/**',
            'coverage/**',
            '*.apk',
            '*.ipa',
            'docs/**',
            'maestro_logs/**',
            '.expo/**',
            'android/app/build/**',
            'ios/build/**',
        ],
    },
]);
