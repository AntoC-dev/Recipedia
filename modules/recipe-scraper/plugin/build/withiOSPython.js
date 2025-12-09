"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withiOSPython = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin:
 * 1. Adds a pre-build script phase to download Python framework
 * 2. Updates Podfile to include PythonKit
 * 3. Configures Xcode project settings for Python framework
 */
var withiOSPython = function (config, _pluginConfig) {
    // Note: PythonKit is optional and uses #if canImport(PythonKit) in Swift code.
    // When PythonKit is not available, the module falls back to Swift SchemaRecipeParser.
    // To enable Python support, manually add PythonKit via Swift Package Manager.
    config = (0, config_plugins_1.withPodfile)(config, function (podfileConfig) {
        return podfileConfig;
    });
    // Configure Xcode project
    config = (0, config_plugins_1.withXcodeProject)(config, function (xcodeConfig) {
        var project = xcodeConfig.modResults;
        var projectRoot = xcodeConfig.modRequest.projectRoot;
        // Get the iOS module path
        var moduleIOSPath = path.join(projectRoot, 'modules', 'recipe-scraper', 'ios');
        // Run the setup script during prebuild if not already done
        var setupScriptPath = path.join(moduleIOSPath, 'scripts', 'setup-python.sh');
        if (fs.existsSync(setupScriptPath)) {
            // Check if frameworks already exist
            var frameworksPath = path.join(moduleIOSPath, 'Frameworks', 'Python.xcframework');
            if (!fs.existsSync(frameworksPath)) {
                console.log('[RecipeScraper] Setting up Python framework for iOS...');
                // Note: The actual setup is done by the podspec script phase
                // This is just for informational purposes during prebuild
            }
        }
        // Add framework search paths to the main target
        var targetKey = project.getFirstTarget().uuid;
        if (targetKey) {
            var configurations_1 = project.pbxXCBuildConfigurationSection();
            Object.keys(configurations_1).forEach(function (key) {
                var buildSettings = configurations_1[key].buildSettings;
                if (buildSettings) {
                    // Add framework search paths for Python
                    var existingPaths = buildSettings.FRAMEWORK_SEARCH_PATHS || '$(inherited)';
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
exports.withiOSPython = withiOSPython;
