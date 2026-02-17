import {ConfigPlugin, withDangerousMod} from '@expo/config-plugins';
import {execSync} from 'child_process';
import {existsSync, statSync} from 'fs';
import {join} from 'path';
import {RecipeScraperPluginConfig} from './types';

const MODULE_DIR = join(__dirname, '..', '..');
const SCRIPTS_DIR = join(MODULE_DIR, 'scripts');
const ASSETS_DIR = join(MODULE_DIR, 'assets');
const BUNDLE_FILE = join(ASSETS_DIR, 'pyodide-bundle.html');
const SETUP_SCRIPT = join(SCRIPTS_DIR, 'setup-pyodide.sh');

const MIN_BUNDLE_SIZE = 10 * 1024 * 1024; // 10MB minimum

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
export const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig> = (
    config,
    _pluginConfig,
) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            console.log('[RecipeScraper] Setting up iOS Pyodide bundle...');

            // Check if setup script exists
            if (!existsSync(SETUP_SCRIPT)) {
                throw new Error(
                    `[RecipeScraper] Setup script not found: ${SETUP_SCRIPT}`,
                );
            }

            // Run the setup script
            try {
                console.log('[RecipeScraper] Running setup-pyodide.sh...');
                execSync(`bash "${SETUP_SCRIPT}"`, {
                    cwd: SCRIPTS_DIR,
                    stdio: 'inherit',
                    env: {...process.env, FORCE_COLOR: '1'},
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                throw new Error(
                    `[RecipeScraper] Failed to run setup script: ${message}`,
                );
            }

            // Verify bundle was created
            if (!existsSync(BUNDLE_FILE)) {
                throw new Error(
                    `[RecipeScraper] Pyodide bundle not generated: ${BUNDLE_FILE}`,
                );
            }

            // Verify bundle size
            const stats = statSync(BUNDLE_FILE);
            if (stats.size < MIN_BUNDLE_SIZE) {
                throw new Error(
                    `[RecipeScraper] Pyodide bundle too small (${stats.size} bytes), expected at least ${MIN_BUNDLE_SIZE} bytes`,
                );
            }

            const bundleSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(
                `[RecipeScraper] iOS Pyodide bundle ready (${bundleSizeMB} MB)`,
            );

            return config;
        },
    ]);
};
