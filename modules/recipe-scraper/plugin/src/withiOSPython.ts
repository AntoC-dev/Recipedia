import {ConfigPlugin, withDangerousMod} from '@expo/config-plugins';
import {RecipeScraperPluginConfig} from './types';
import * as path from 'path';
import * as fs from 'fs';
import {execSync} from 'child_process';

/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin:
 * 1. Downloads the Python framework before pod install (so CocoaPods can link it)
 * 2. PythonKit is added via SPM in the podspec using `spm_dependency` (React Native 0.75+)
 */
export const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig> = (
    config,
    _pluginConfig,
) => {
    // Use withDangerousMod to run setup BEFORE pod install
    // This is necessary because vendored_frameworks must exist when pod install runs
    config = withDangerousMod(config, [
        'ios',
        async modConfig => {
            const projectRoot = modConfig.modRequest.projectRoot;
            const moduleIOSPath = path.join(
                projectRoot,
                'modules',
                'recipe-scraper',
                'ios',
            );

            const setupScriptPath = path.join(moduleIOSPath, 'scripts', 'setup-python.sh');
            const frameworksPath = path.join(moduleIOSPath, 'Frameworks', 'Python.xcframework');

            // Run setup script if framework doesn't exist yet
            if (fs.existsSync(setupScriptPath) && !fs.existsSync(frameworksPath)) {
                console.log('[RecipeScraper] Downloading Python framework for iOS...');
                try {
                    execSync(`bash "${setupScriptPath}"`, {
                        cwd: moduleIOSPath,
                        stdio: 'inherit',
                    });
                    console.log('[RecipeScraper] Python framework setup complete');
                } catch (error) {
                    console.warn('[RecipeScraper] Python setup failed, Swift fallback will be used:', error);
                }
            } else if (fs.existsSync(frameworksPath)) {
                console.log('[RecipeScraper] Python framework already exists, skipping download');
            }

            return modConfig;
        },
    ]);

    return config;
};
