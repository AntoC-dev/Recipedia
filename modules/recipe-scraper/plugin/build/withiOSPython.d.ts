import { ConfigPlugin } from '@expo/config-plugins';
import { RecipeScraperPluginConfig } from './types';
/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin:
 * 1. Adds a pre-build script phase to download Python framework
 * 2. Updates Podfile to include PythonKit
 * 3. Configures Xcode project settings for Python framework
 */
export declare const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig>;
