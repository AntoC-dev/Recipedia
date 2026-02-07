import { ConfigPlugin } from '@expo/config-plugins';
import { RecipeScraperPluginConfig } from './types';
/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin downloads the Python framework and PythonKit source files before
 * pod install runs. This ensures CocoaPods can properly link the vendored framework
 * and compile the PythonKit source files.
 */
export declare const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig>;
