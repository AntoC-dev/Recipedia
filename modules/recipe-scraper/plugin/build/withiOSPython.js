"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withiOSPython = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var MODULE_DIR = (0, path_1.join)(__dirname, '..', '..');
var SCRIPTS_DIR = (0, path_1.join)(MODULE_DIR, 'scripts');
var ASSETS_DIR = (0, path_1.join)(MODULE_DIR, 'assets');
var BUNDLE_FILE = (0, path_1.join)(ASSETS_DIR, 'pyodide-bundle.html');
var SETUP_SCRIPT = (0, path_1.join)(SCRIPTS_DIR, 'setup-pyodide.sh');
var MIN_BUNDLE_SIZE = 10 * 1024 * 1024; // 10MB minimum
/**
 * Expo config plugin for iOS RecipeScraper module.
 *
 * This plugin runs during `expo prebuild` to:
 * 1. Download Pyodide WASM runtime and Python packages
 * 2. Generate a self-contained HTML bundle with all assets embedded
 * 3. Verify the bundle was created successfully
 *
 * The bundle is then loaded by PyodideWebView at runtime without network access.
 */
var withiOSPython = function (config, _pluginConfig) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        function (config) {
            console.log('[RecipeScraper] Setting up iOS Pyodide bundle...');
            // Check if setup script exists
            if (!(0, fs_1.existsSync)(SETUP_SCRIPT)) {
                throw new Error("[RecipeScraper] Setup script not found: ".concat(SETUP_SCRIPT));
            }
            // Run the setup script
            try {
                console.log('[RecipeScraper] Running setup-pyodide.sh...');
                (0, child_process_1.execSync)("bash \"".concat(SETUP_SCRIPT, "\""), {
                    cwd: SCRIPTS_DIR,
                    stdio: 'inherit',
                    env: Object.assign(Object.assign({}, process.env), { FORCE_COLOR: '1' }),
                });
            }
            catch (error) {
                var message = error instanceof Error ? error.message : String(error);
                throw new Error("[RecipeScraper] Failed to run setup script: ".concat(message));
            }
            // Verify bundle was created
            if (!(0, fs_1.existsSync)(BUNDLE_FILE)) {
                throw new Error("[RecipeScraper] Pyodide bundle not generated: ".concat(BUNDLE_FILE));
            }
            // Verify bundle size
            var stats = (0, fs_1.statSync)(BUNDLE_FILE);
            if (stats.size < MIN_BUNDLE_SIZE) {
                throw new Error("[RecipeScraper] Pyodide bundle too small (".concat(stats.size, " bytes), expected at least ").concat(MIN_BUNDLE_SIZE, " bytes"));
            }
            var bundleSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log("[RecipeScraper] iOS Pyodide bundle ready (".concat(bundleSizeMB, " MB)"));
            return config;
        },
    ]);
};
exports.withiOSPython = withiOSPython;
