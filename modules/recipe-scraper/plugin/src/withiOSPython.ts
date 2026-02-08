import {ConfigPlugin, withDangerousMod} from '@expo/config-plugins';
import {RecipeScraperPluginConfig} from './types';
import * as path from 'path';
import * as fs from 'fs';
import {execSync} from 'child_process';

/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin downloads the Python framework and PythonKit source files before
 * pod install runs. This ensures CocoaPods can properly link the vendored framework
 * and compile the PythonKit source files.
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
            const frameworksDir = path.join(moduleIOSPath, 'Frameworks');
            const frameworksPath = path.join(frameworksDir, 'Python.xcframework');
            const stdlibBundlePath = path.join(frameworksDir, 'PythonStdlib.bundle');
            const packagesBundlePath = path.join(frameworksDir, 'PythonPackages.bundle');

            // Check if ALL required Python artifacts exist (not just the framework)
            const allArtifactsExist =
                fs.existsSync(frameworksPath) &&
                fs.existsSync(stdlibBundlePath) &&
                fs.existsSync(packagesBundlePath);

            // Check for PythonKit source (required for compilation)
            const pythonKitDir = path.join(moduleIOSPath, 'PythonKit');
            const pythonKitMarker = path.join(pythonKitDir, '.complete');
            const pythonKitExists = fs.existsSync(pythonKitMarker);

            // Run setup script if any required artifact is missing
            if (fs.existsSync(setupScriptPath) && (!allArtifactsExist || !pythonKitExists)) {
                console.log('[RecipeScraper] Downloading Python framework for iOS...');
                execSync(`bash "${setupScriptPath}"`, {
                    cwd: moduleIOSPath,
                    stdio: 'inherit',
                });
                console.log('[RecipeScraper] Python framework setup complete');
            } else if (allArtifactsExist && pythonKitExists) {
                console.log('[RecipeScraper] Python framework and bundles already exist, skipping setup');
            }

            return modConfig;
        },
    ]);

    return config;
};
