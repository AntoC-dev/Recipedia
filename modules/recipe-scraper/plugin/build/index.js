"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var withAndroidChaquopy_1 = require("./withAndroidChaquopy");
var withiOSPython_1 = require("./withiOSPython");
var withRecipeScraper = function (config, props) {
    var pluginConfig = props || {};
    // Apply Android Chaquopy configuration
    config = (0, withAndroidChaquopy_1.withAndroidChaquopy)(config, pluginConfig);
    // Apply iOS Python configuration
    config = (0, withiOSPython_1.withiOSPython)(config, pluginConfig);
    return config;
};
var pkg = { name: 'recipe-scraper', version: '1.0.0' };
exports.default = (0, config_plugins_1.createRunOncePlugin)(withRecipeScraper, pkg.name, pkg.version);
