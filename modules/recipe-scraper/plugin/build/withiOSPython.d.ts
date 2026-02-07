import { ConfigPlugin } from '@expo/config-plugins';
import { RecipeScraperPluginConfig } from './types';
/**
 * Expo config plugin for iOS Python support in RecipeScraper module.
 *
 * This plugin:
 * 1. Downloads the Python framework before pod install (so CocoaPods can link it)
 * 2. PythonKit is added via SPM in the podspec using `spm_dependency` (React Native 0.75+)
 */
export declare const withiOSPython: ConfigPlugin<RecipeScraperPluginConfig>;
