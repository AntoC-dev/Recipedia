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
 * The store build is the one that ships the production dataset
 * (`EXPO_PUBLIC_DATASET_TYPE === 'production'`) and is not an automation build.
 * Every Maestro/E2E profile sets `EXPO_PUBLIC_DISABLE_ANIMATIONS === 'true'` and
 * the store `production` profile does not, so that flag discriminates the store
 * build from the `production-maestro` E2E build (which seeds production data yet
 * must keep the shared `com.recipedia` id so Maestro can launch it on iOS). This
 * reuses two existing profile `env` vars instead of adding a dedicated store flag;
 * the trade-off is that it relies on the invariant that store builds keep
 * animations on and automation builds turn them off. `EAS_BUILD_PROFILE` can't be
 * used because EAS only injects it into the build job, after the bundle id is
 * resolved for credentials. See `tests/e2e/E2E_TESTING.md` → "Production Smoke
 * Build" for the full rationale.
 *
 * @param baseAppId - The platform-agnostic application id (e.g. `com.recipedia`).
 * @param env - Environment variables to read the dataset type and animation flag
 *   from. Defaults to `process.env`.
 * @returns The store bundle id (`<baseAppId>.ios`) for the store build, otherwise
 *   `baseAppId`.
 */
export function resolveIosBundleId(
    baseAppId: string,
    env: Record<string, string | undefined> = process.env,
): string {
    const usesProductionDataset = env.EXPO_PUBLIC_DATASET_TYPE === 'production';
    const isAutomationBuild = env.EXPO_PUBLIC_DISABLE_ANIMATIONS === 'true';
    const isStoreBuild = usesProductionDataset && !isAutomationBuild;
    return isStoreBuild ? `${baseAppId}.ios` : baseAppId;
}

const configuredName = toSlug(pkg.name);
const appId = `com.${toIdentifierSegment(pkg.name)}`;

// Maestro E2E flows hardcode a single `com.recipedia` shared across platforms,
// so only the store build (production dataset, animations enabled) carries the
// `.ios` suffix. See `resolveIosBundleId`.
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
            [
                'expo-splash-screen',
                {
                    image: './src/assets/app/splash_light.png',
                    resizeMode: 'cover',
                    backgroundColor: primaryColorLight,
                    dark: {
                        image: './src/assets/app/splash_dark.png',
                        backgroundColor: primaryColorDark,
                    },
                },
            ],
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
