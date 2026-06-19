import type {ConfigContext, ExpoConfig} from "expo/config";

const pkg = require("./package.json");

function toIdentifierSegment(slug: string): string {
    // Convert slug to a valid identifier segment: lowercase, remove non-alphanumerics, start with a letter
    const compact = slug.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return compact.replace(/^[^a-z]+/, "");
}

function toSlug(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function versionToCode(version: string): number {
    const parts = version.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    return major * 10000 + minor * 100 + patch;
}

/**
 * Resolves the iOS bundle identifier for a build.
 *
 * iOS is republished under a new App Store identity, so only the store build
 * uses the suffixed id (`<baseAppId>.ios`); every other build (Maestro E2E, dev,
 * simulator) keeps the plain `baseAppId`, identical to Android, so the E2E flows
 * can launch a single shared bundle id.
 *
 * The store build is detected via `EXPO_PUBLIC_DATASET_TYPE === 'production'`,
 * which only the `production` EAS profile sets in its `env` block. This is used
 * instead of `EAS_BUILD_PROFILE` because EAS only injects `EAS_BUILD_PROFILE`
 * into the build job, whereas the bundle id is resolved earlier, when `eas build`
 * evaluates this config to set up credentials — before the job env exists. A
 * build-profile `env` var is applied at config-evaluation time, so it resolves
 * the same bundle id for both local (`eas build --local`) and cloud builds.
 *
 * @param baseAppId - The platform-agnostic application id (e.g. `com.recipedia`).
 * @param env - Environment variables to read the dataset type from. Defaults to
 *   `process.env`.
 * @returns The store bundle id (`<baseAppId>.ios`) for production builds,
 *   otherwise `baseAppId`.
 */
export function resolveIosBundleId(
    baseAppId: string,
    env: Record<string, string | undefined> = process.env,
): string {
    const isStoreBuild = env.EXPO_PUBLIC_DATASET_TYPE === 'production';
    return isStoreBuild ? `${baseAppId}.ios` : baseAppId;
}

const configuredName = toSlug(pkg.name);
const appId = `com.${toIdentifierSegment(pkg.name)}`;

// Maestro E2E flows hardcode a single `com.recipedia` shared across platforms,
// so only the store build carries the `.ios` suffix. See `resolveIosBundleId`.
const iosAppId = resolveIosBundleId(appId);

const primaryColorLight = '#006D38';
const primaryColorDark = '#79DB95';

export default ({config}: ConfigContext): ExpoConfig => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        ...config,
        name: configuredName,
        slug: configuredName,
        version: pkg.version,
        orientation: "portrait",
        icon: "./src/assets/app/icon.png",
        userInterfaceStyle: "automatic",
        splash: {
            image: './src/assets/app/splash_light.png',
            resizeMode: 'cover',
            backgroundColor: primaryColorLight,
            dark: {
                image: './src/assets/app/splash_dark.png',
                backgroundColor: primaryColorDark,
            },
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: iosAppId,
            buildNumber: pkg.version,
            infoPlist: {
                "ITSAppUsesNonExemptEncryption": false,
                "NSCameraUsageDescription": "Recipedia uses the camera so you can take a photo of a dish and attach it to a recipe (for example, when creating or editing a recipe).",
                "NSPhotoLibraryUsageDescription": "Recipedia uses your photo library so you can choose an existing photo and set it as a recipe image (for example, selecting a picture for a new recipe)."
            }
        },
        android: {
            versionCode: versionToCode(pkg.version),
            adaptiveIcon: {
                foregroundImage: './src/assets/app/adaptative_icon.png',
                backgroundColor: primaryColorLight,
            },
            package: appId,
            permissions: ['android.permission.CAMERA'],
        },
        plugins: [
            'expo-image',
            'expo-localization',
            'expo-sqlite',
            'expo-mail-composer',
            'expo-background-task',
            'expo-font',
            [
                'expo-build-properties',
                {
                    android: {
                        compileSdkVersion: 36,
                        targetSdkVersion: 36,
                        buildToolsVersion: '36.0.0',
                        enableProguardInReleaseBuilds: true,
                        enableShrinkResourcesInReleaseBuilds: true,
                    },
                    ios: {
                        deploymentTarget: '18.0',
                    },
                },
            ],
            './modules/recipe-scraper/plugin/build/index.js',
            './plugins/withAndroidLocaleFilters',
        ],
        extra: {
            eas: {
                projectId: '247331ab-7746-4b0a-bb72-353045160518',
            },
        },
        owner: 'antoc',
        // Reduce build overhead for development
        updates: isProduction ? {} : {
            enabled: false
        },
        experiments: {
            reactCompiler: true,
        },
    };
};
