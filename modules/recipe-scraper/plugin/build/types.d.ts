export interface RecipeScraperPluginConfig {
    pythonVersion?: string;
    pipPackages?: string[];
    abiFilters?: string[];
    buildPython?: string;
}
export declare const DEFAULT_CONFIG: Required<Omit<RecipeScraperPluginConfig, 'buildPython'>>;
export declare const CHAQUOPY_VERSION = "17.0.0";
