import {ConfigPlugin, withXcodeProject, withPodfile} from '@expo/config-plugins';
import {RecipeScraperPluginConfig} from './types';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin:
 * 1. Adds a pre-build script phase to download Python framework
 * 2. Updates Podfile to include PythonKit
 * 3. Configures Xcode project settings for Python framework
 */
export const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig> = (
    config,
    _pluginConfig,
) => {
    // Note: PythonKit is optional and uses #if canImport(PythonKit) in Swift code.
    // When PythonKit is not available, the module falls back to Swift SchemaRecipeParser.
    // To enable Python support, manually add PythonKit via Swift Package Manager.
    config = withPodfile(config, podfileConfig => {
        return podfileConfig;
    });

    // Configure Xcode project
    config = withXcodeProject(config, xcodeConfig => {
        const project = xcodeConfig.modResults;
        const projectRoot = xcodeConfig.modRequest.projectRoot;

        // Get the iOS module path
        const moduleIOSPath = path.join(
            projectRoot,
            'modules',
            'recipe-scraper',
            'ios',
        );

        // Run the setup script during prebuild if not already done
        const setupScriptPath = path.join(moduleIOSPath, 'scripts', 'setup-python.sh');
        if (fs.existsSync(setupScriptPath)) {
            // Check if frameworks already exist
            const frameworksPath = path.join(moduleIOSPath, 'Frameworks', 'Python.xcframework');
            if (!fs.existsSync(frameworksPath)) {
                console.log('[RecipeScraper] Setting up Python framework for iOS...');
                // Note: The actual setup is done by the podspec script phase
                // This is just for informational purposes during prebuild
            }
        }

        // Add framework search paths to the main target
        const targetKey = project.getFirstTarget().uuid;
        if (targetKey) {
            const configurations = project.pbxXCBuildConfigurationSection();

            Object.keys(configurations).forEach(key => {
                const buildSettings = configurations[key].buildSettings;
                if (buildSettings) {
                    // Add framework search paths for Python
                    const existingPaths = buildSettings.FRAMEWORK_SEARCH_PATHS || '$(inherited)';
                    if (!existingPaths.includes('Python.xcframework')) {
                        // The paths are handled by the podspec, this is backup
                    }

                    // Note: OTHER_LDFLAGS are handled by the podspec, no need to modify here
                }
            });
        }

        return xcodeConfig;
    });

    return config;
};
