import {ConfigPlugin, withGradleProperties, withProjectBuildGradle,} from '@expo/config-plugins';
import {CHAQUOPY_VERSION, DEFAULT_CONFIG, RecipeScraperPluginConfig} from './types';

export const withAndroidChaquopy: ConfigPlugin<RecipeScraperPluginConfig> = (
    config,
    pluginConfig,
) => {
    const mergedConfig = {...DEFAULT_CONFIG, ...pluginConfig};

    config = withProjectBuildGradle(config, gradleConfig => {
        if (gradleConfig.modResults.language === 'groovy') {
            gradleConfig.modResults.contents = addChaquopyToProjectGradle(
                gradleConfig.modResults.contents,
            );
        }
        return gradleConfig;
    });

    config = withGradleProperties(config, gradleConfig => {
        const abiFiltersStr = mergedConfig.abiFilters.join(',');
        const existingIndex = gradleConfig.modResults.findIndex(
            item => item.type === 'property' && item.key === 'reactNativeArchitectures'
        );

        if (existingIndex >= 0) {
            gradleConfig.modResults[existingIndex] = {
                type: 'property',
                key: 'reactNativeArchitectures',
                value: abiFiltersStr,
            };
        } else {
            gradleConfig.modResults.push({
                type: 'property',
                key: 'reactNativeArchitectures',
                value: abiFiltersStr,
            });
        }

        return gradleConfig;
    });

    return config;
};

function addChaquopyToProjectGradle(contents: string): string {
    if (contents.includes('com.chaquo.python')) {
        return contents;
    }

    const buildscriptRegex = /buildscript\s*\{[\s\S]*?dependencies\s*\{/;
    const match = contents.match(buildscriptRegex);

    if (match) {
        const insertPoint = match.index! + match[0].length;
        const chaquopyClasspath = `\n        classpath 'com.chaquo.python:gradle:${CHAQUOPY_VERSION}'`;
        contents =
            contents.slice(0, insertPoint) +
            chaquopyClasspath +
            contents.slice(insertPoint);
    }

    return contents;
}
