export interface RecipeScraperPluginConfig {
    pythonVersion?: string;
    abiFilters?: string[];
    buildPython?: string;
}

export const DEFAULT_CONFIG: Required<Omit<RecipeScraperPluginConfig, 'buildPython'>> = {
    pythonVersion: '3.13',
    abiFilters: ['arm64-v8a', 'x86_64'],
};

export const CHAQUOPY_VERSION = '17.0.0';
