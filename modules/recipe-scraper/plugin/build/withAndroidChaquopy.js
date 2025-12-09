"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidChaquopy = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var types_1 = require("./types");
var withAndroidChaquopy = function (config, pluginConfig) {
    var mergedConfig = __assign(__assign({}, types_1.DEFAULT_CONFIG), pluginConfig);
    config = (0, config_plugins_1.withProjectBuildGradle)(config, function (gradleConfig) {
        if (gradleConfig.modResults.language === 'groovy') {
            gradleConfig.modResults.contents = addChaquopyToProjectGradle(gradleConfig.modResults.contents);
        }
        return gradleConfig;
    });
    config = (0, config_plugins_1.withGradleProperties)(config, function (gradleConfig) {
        var abiFiltersStr = mergedConfig.abiFilters.join(',');
        var existingIndex = gradleConfig.modResults.findIndex(function (item) { return item.type === 'property' && item.key === 'reactNativeArchitectures'; });
        if (existingIndex >= 0) {
            gradleConfig.modResults[existingIndex] = {
                type: 'property',
                key: 'reactNativeArchitectures',
                value: abiFiltersStr,
            };
        }
        else {
            gradleConfig.modResults.push({
                type: 'property',
                key: 'reactNativeArchitectures',
                value: abiFiltersStr,
            });
        }
        return gradleConfig;
    });
    return config;
};
exports.withAndroidChaquopy = withAndroidChaquopy;
function addChaquopyToProjectGradle(contents) {
    if (contents.includes('com.chaquo.python')) {
        return contents;
    }
    var buildscriptRegex = /buildscript\s*\{[\s\S]*?dependencies\s*\{/;
    var match = contents.match(buildscriptRegex);
    if (match) {
        var insertPoint = match.index + match[0].length;
        var chaquopyClasspath = "\n        classpath 'com.chaquo.python:gradle:".concat(types_1.CHAQUOPY_VERSION, "'");
        contents =
            contents.slice(0, insertPoint) +
                chaquopyClasspath +
                contents.slice(insertPoint);
    }
    return contents;
}
