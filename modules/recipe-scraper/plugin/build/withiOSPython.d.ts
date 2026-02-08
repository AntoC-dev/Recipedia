import { ConfigPlugin } from '@expo/config-plugins';
import { RecipeScraperPluginConfig } from './types';
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
export declare const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig>;
