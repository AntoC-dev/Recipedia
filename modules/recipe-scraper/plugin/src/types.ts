export interface RecipeScraperPluginConfig {
    pythonVersion?: string;
    pipPackages?: string[];
    abiFilters?: string[];
    buildPython?: string;
}

export const DEFAULT_CONFIG: Required<Omit<RecipeScraperPluginConfig, 'buildPython'>> = {
    pythonVersion: '3.13',
    pipPackages: ['recipe-scrapers', 'requests'],
    abiFilters: ['arm64-v8a', 'x86_64'],
};

export const CHAQUOPY_VERSION = '17.0.0';
