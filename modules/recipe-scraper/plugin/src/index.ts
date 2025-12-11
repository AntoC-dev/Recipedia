import {ConfigPlugin, createRunOncePlugin} from '@expo/config-plugins';
import {withAndroidChaquopy} from './withAndroidChaquopy';
import {withiOSPython} from './withiOSPython';
import {RecipeScraperPluginConfig} from './types';

const withRecipeScraper: ConfigPlugin<RecipeScraperPluginConfig | void> = (
    config,
    props,
) => {
    const pluginConfig = props || {};

    // Apply Android Chaquopy configuration
    config = withAndroidChaquopy(config, pluginConfig);

    // Apply iOS Python configuration
    config = withiOSPython(config, pluginConfig);

    return config;
};

const pkg = {name: 'recipe-scraper', version: '1.0.0'};

export default createRunOncePlugin(withRecipeScraper, pkg.name, pkg.version);
